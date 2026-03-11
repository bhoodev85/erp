import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CatalogService } from '../catalog/catalog.service';
import { Cart, CartDocument } from './cart.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    private readonly catalogService: CatalogService,
  ) {}

  async addItem(userId: string, productId: string, qty: number) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid productId');
    }

    const [product] = await this.catalogService.findActiveByIds([productId]);
    if (!product) throw new NotFoundException('Product not found');

    const cart = (await this.cartModel.findOne({ userId })) ?? new this.cartModel({ userId, items: [] });
    const existing = cart.items.find((item) => item.productId === productId);

    if (existing) {
      existing.qty += qty;
      existing.unitPrice = product.price;
    } else {
      cart.items.push({ productId, qty, unitPrice: product.price });
    }

    await cart.save();
    return cart;
  }

  async get(userId: string) {
    return (await this.cartModel.findOne({ userId }).lean().exec()) ?? { userId, items: [] };
  }

  async clear(userId: string) {
    await this.cartModel.updateOne({ userId }, { $set: { items: [] } }, { upsert: true });
    return { userId, items: [] };
  }
}
