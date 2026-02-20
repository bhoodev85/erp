import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { NotificationService } from '../notification/notification.service';
import { OrderService } from '../order/order.service';
import { WebhookEvent, WebhookEventDocument } from './webhook-event.schema';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(WebhookEvent.name) private readonly webhookModel: Model<WebhookEventDocument>,
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
  ) {}

  async generateLink(orderNo: string) {
    const order = await this.orderService.findByOrderNo(orderNo);
    const paymentToken = uuid();
    const paymentLink = `https://payments.example.com/pay/${paymentToken}?order=${order.orderNo}`;
    await this.orderService.attachPaymentLink(orderNo, paymentLink);
    return { orderNo: order.orderNo, paymentLink };
  }

  async handleWebhook(payload: {
    eventId: string;
    type: string;
    orderNo: string;
    paymentRef: string;
  }) {
    const existing = await this.webhookModel.findOne({ providerEventId: payload.eventId }).lean().exec();
    if (existing) {
      return { duplicate: true, message: 'Already processed' };
    }

    await this.webhookModel.create({
      providerEventId: payload.eventId,
      type: payload.type,
      payload,
      processed: false,
    });

    if (payload.type === 'payment.success') {
      const order = await this.orderService.markPaid(payload.orderNo, payload.paymentRef);
      await this.notificationService.sendWhatsApp(order.orderNo, order.userId);
    }

    await this.webhookModel.updateOne({ providerEventId: payload.eventId }, { $set: { processed: true } });
    return { processed: true };
  }
}
