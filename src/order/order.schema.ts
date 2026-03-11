import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OrderStatus } from '../common/types';

export type OrderDocument = HydratedDocument<Order>;

class OrderItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  titleSnapshot!: string;

  @Prop({ required: true })
  qty!: number;

  @Prop({ required: true })
  unitPrice!: number;
}

class PaymentInfo {
  @Prop()
  provider?: string;

  @Prop()
  paymentLink?: string;

  @Prop()
  paymentRef?: string;

  @Prop()
  paidAt?: Date;
}

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ unique: true, required: true, index: true })
  orderNo!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ type: [OrderItem], required: true })
  items!: OrderItem[];

  @Prop({ required: true })
  subtotal!: number;

  @Prop({ required: true })
  tax!: number;

  @Prop({ required: true })
  total!: number;

  @Prop({ enum: OrderStatus, default: OrderStatus.PendingPayment, index: true })
  status!: OrderStatus;

  @Prop({ type: PaymentInfo, default: {} })
  payment!: PaymentInfo;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
