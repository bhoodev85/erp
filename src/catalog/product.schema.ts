import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ unique: true, required: true, index: true })
  metaProductId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ required: true })
  price!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ default: 0 })
  stock!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ required: true })
  syncVersion!: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
