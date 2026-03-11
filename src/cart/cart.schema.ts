import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

class CartItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  qty!: number;

  @Prop({ required: true })
  unitPrice!: number;
}

@Schema({ timestamps: true, collection: 'carts' })
export class Cart {
  @Prop({ unique: true, required: true, index: true })
  userId!: string;

  @Prop({ type: [CartItem], default: [] })
  items!: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
