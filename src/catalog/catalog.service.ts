import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Product, ProductDocument } from './product.schema';

@Injectable()
export class CatalogService {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<ProductDocument>) {}

  async browse(search?: string, page = 1, limit = 20) {
    const query: FilterQuery<ProductDocument> = { isActive: true };
    if (search) query.title = { $regex: search, $options: 'i' };

    const [items, total] = await Promise.all([
      this.productModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .lean()
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    return { page, limit, total, items };
  }

  async findActiveByIds(ids: string[]) {
    return this.productModel.find({ _id: { $in: ids }, isActive: true }).lean().exec();
  }
}
