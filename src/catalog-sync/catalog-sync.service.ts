import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { OutboxService } from '../outbox/outbox.service';
import { Product, ProductDocument } from '../catalog/product.schema';

@Injectable()
export class CatalogSyncService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly outbox: OutboxService,
  ) {}

  async sync() {
    const syncVersion = new Date().toISOString();
    const metaCatalog = this.mockMetaCatalog();

    for (const product of metaCatalog) {
      await this.productModel.updateOne(
        { metaProductId: product.metaProductId },
        { ...product, syncVersion, isActive: true },
        { upsert: true },
      );
    }

    await this.outbox.publish('catalog.synced', syncVersion, {
      syncVersion,
      count: metaCatalog.length,
      at: new Date().toISOString(),
    });

    return { syncVersion, count: metaCatalog.length };
  }

  private mockMetaCatalog() {
    return [
      {
        metaProductId: `meta-${uuid()}`,
        title: 'Meta Hoodie',
        description: 'Premium hoodie from synced catalog',
        images: ['https://example.com/hoodie.jpg'],
        price: 49.99,
        currency: 'USD',
        stock: 100,
      },
      {
        metaProductId: `meta-${uuid()}`,
        title: 'Meta Sneakers',
        description: 'Sneakers from synced catalog',
        images: ['https://example.com/sneaker.jpg'],
        price: 79.99,
        currency: 'USD',
        stock: 50,
      },
    ];
  }
}
