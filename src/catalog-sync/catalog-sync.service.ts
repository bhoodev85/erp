import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OutboxService } from '../outbox/outbox.service';
import { Product, ProductDocument } from '../catalog/product.schema';

type MetaProduct = {
  metaProductId: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  stock: number;
};

@Injectable()
export class CatalogSyncService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly outbox: OutboxService,
    private readonly configService: ConfigService,
  ) {}

  async syncSingle(metaProductId: string) {
    const syncVersion = new Date().toISOString();
    const product = await this.fetchMetaProduct(metaProductId);
    await this.upsertProduct(product, syncVersion);

    await this.outbox.publish('catalog.synced.single', metaProductId, {
      syncVersion,
      metaProductId,
      at: new Date().toISOString(),
    });

    return { syncVersion, count: 1, item: product };
  }

  async syncBulk(limit = 100, cursor?: string) {
    const syncVersion = new Date().toISOString();
    const { items, nextCursor } = await this.fetchMetaCatalog(limit, cursor);

    for (const product of items) {
      await this.upsertProduct(product, syncVersion);
    }

    await this.outbox.publish('catalog.synced', syncVersion, {
      syncVersion,
      count: items.length,
      nextCursor,
      at: new Date().toISOString(),
    });

    return { syncVersion, count: items.length, nextCursor };
  }

  private async upsertProduct(product: MetaProduct, syncVersion: string) {
    await this.productModel.updateOne(
      { metaProductId: product.metaProductId },
      { ...product, syncVersion, isActive: true },
      { upsert: true },
    );
  }

  private async fetchMetaProduct(metaProductId: string): Promise<MetaProduct> {
    const baseUrl = this.configService.get<string>('META_API_BASE_URL');
    if (!baseUrl) {
      throw new InternalServerErrorException('META_API_BASE_URL is required for single sync');
    }

    const data = await this.fetchMeta(`${baseUrl.replace(/\/$/, '')}/products/${metaProductId}`);
    return this.normalizeMetaProduct(data);
  }

  private async fetchMetaCatalog(limit: number, cursor?: string): Promise<{ items: MetaProduct[]; nextCursor?: string }> {
    const baseUrl = this.configService.get<string>('META_API_BASE_URL');
    if (!baseUrl) {
      throw new InternalServerErrorException('META_API_BASE_URL is required for bulk sync');
    }

    const url = new URL(`${baseUrl.replace(/\/$/, '')}/products`);
    url.searchParams.set('limit', String(limit));
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }

    const data = await this.fetchMeta(url.toString());
    const rawItems = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data)
          ? data
          : [];

    return {
      items: rawItems.map((item: unknown) => this.normalizeMetaProduct(item)),
      nextCursor:
        typeof data?.paging?.next_cursor === 'string'
          ? data.paging.next_cursor
          : typeof data?.nextCursor === 'string'
            ? data.nextCursor
            : undefined,
    };
  }

  private async fetchMeta(url: string): Promise<any> {
    const token = this.configService.get<string>('META_API_TOKEN');

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new BadGatewayException(`Meta API request failed (${response.status})`);
    }

    return response.json();
  }

  private normalizeMetaProduct(raw: any): MetaProduct {
    const id = raw?.id ?? raw?.metaProductId ?? raw?.retailer_id;
    if (!id) {
      throw new BadGatewayException('Meta API payload missing product id');
    }

    return {
      metaProductId: String(id),
      title: String(raw?.title ?? raw?.name ?? 'Untitled Product'),
      description: String(raw?.description ?? ''),
      images: Array.isArray(raw?.images)
        ? raw.images.map((value: unknown) => String(value))
        : raw?.image
          ? [String(raw.image)]
          : [],
      price: Number(raw?.price ?? raw?.amount ?? 0),
      currency: String(raw?.currency ?? 'INR'),
      stock: Number(raw?.stock ?? raw?.inventory ?? 0),
    };
  }
}
