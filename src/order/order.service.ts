import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { CatalogService } from '../catalog/catalog.service';
import { OrderStatus } from '../common/types';
import { OutboxService } from '../outbox/outbox.service';
import { CartService } from '../cart/cart.service';
import { Order, OrderDocument } from './order.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
    private readonly catalogService: CatalogService,
    private readonly outbox: OutboxService,
  ) {}

  async create(userId: string) {
    const cart = await this.cartService.get(userId);
    if (!cart.items.length) throw new NotFoundException('Cart is empty');

    const productIds = cart.items.map((item: { productId: string }) => item.productId);
    const products = await this.catalogService.findActiveByIds(productIds);

    const items = cart.items.map((cartItem: { productId: string; qty: number }) => {
      const product = products.find((p) => String(p._id) === cartItem.productId);
      if (!product) throw new NotFoundException(`Product missing: ${cartItem.productId}`);
      return {
        productId: cartItem.productId,
        titleSnapshot: product.title,
        qty: cartItem.qty,
        unitPrice: product.price,
      };
    });

    const subtotal = items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
    const tax = Number((subtotal * 0.1).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const order = await this.orderModel.create({
      orderNo: `ORD-${Date.now()}-${uuid().slice(0, 8)}`,
      userId,
      items,
      subtotal,
      tax,
      total,
      status: OrderStatus.PendingPayment,
    });

    await this.outbox.publish('order.created', order.orderNo, {
      orderNo: order.orderNo,
      userId,
      total,
    });

    return order;
  }

  async findByOrderNo(orderNo: string) {
    const order = await this.orderModel.findOne({ orderNo }).exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async attachPaymentLink(orderNo: string, paymentLink: string) {
    const order = await this.findByOrderNo(orderNo);
    order.payment.provider = 'mock-gateway';
    order.payment.paymentLink = paymentLink;
    await order.save();
    return order;
  }

  async markPaid(orderNo: string, paymentRef: string) {
    const order = await this.findByOrderNo(orderNo);
    if (order.status === OrderStatus.Confirmed) return order;

    order.status = OrderStatus.Paid;
    order.payment.paymentRef = paymentRef;
    order.payment.paidAt = new Date();
    await order.save();

    await this.outbox.publish('payment.received', order.orderNo, {
      orderNo: order.orderNo,
      paymentRef,
      status: OrderStatus.Paid,
    });

    order.status = OrderStatus.Confirmed;
    await order.save();

    await this.outbox.publish('order.confirmed', order.orderNo, {
      orderNo: order.orderNo,
      userId: order.userId,
      total: order.total,
    });

    return order;
  }
}
