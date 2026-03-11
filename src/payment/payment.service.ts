import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, randomUUID } from 'crypto';
import { Model } from 'mongoose';
import Razorpay from 'razorpay';
import { NotificationService } from '../notification/notification.service';
import { OrderService } from '../order/order.service';
import { WebhookEvent, WebhookEventDocument } from './webhook-event.schema';

type RazorpayWebhookPayload = {
  eventId: string;
  type: string;
  orderNo: string;
  paymentRef: string;
};

@Injectable()
export class PaymentService {
  private readonly razorpay?: Razorpay;
  private readonly webhookSecret?: string;

  constructor(
    @InjectModel(WebhookEvent.name) private readonly webhookModel: Model<WebhookEventDocument>,
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async generateLink(orderNo: string) {
    const order = await this.orderService.findByOrderNo(orderNo);

    if (!this.razorpay) {
      const fallbackLink = `https://payments.example.com/pay/mock-${randomUUID()}?order=${order.orderNo}`;
      await this.orderService.attachPaymentLink(orderNo, fallbackLink);
      return {
        orderNo: order.orderNo,
        provider: 'mock-gateway',
        paymentLink: fallbackLink,
        note: 'Razorpay credentials are missing; generated mock link.',
      };
    }

    const callbackUrl = this.configService.get<string>('RAZORPAY_CALLBACK_URL');
    const payload: Record<string, unknown> = {
      amount: Math.round(order.total * 100),
      currency: 'INR',
      accept_partial: false,
      reference_id: order.orderNo,
      description: `Payment for order ${order.orderNo}`,
      customer: {
        name: order.userId,
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: true,
    };

    if (callbackUrl) {
      payload.callback_url = callbackUrl;
      payload.callback_method = 'get';
    }

    const response = await this.razorpay.paymentLink.create(payload);
    const paymentLink = response.short_url ?? response.id;

    await this.orderService.attachPaymentLink(orderNo, paymentLink);

    return { orderNo: order.orderNo, provider: 'razorpay', paymentLink, razorpayLinkId: response.id };
  }

  async handleWebhook(payload: RazorpayWebhookPayload, signature?: string, rawBody?: string) {
    this.verifyWebhookSignature(rawBody, signature);

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

    if (payload.type === 'payment.success' || payload.type === 'payment.captured') {
      const order = await this.orderService.markPaid(payload.orderNo, payload.paymentRef);
      await this.notificationService.sendWhatsApp(order.orderNo, order.userId);
    }

    await this.webhookModel.updateOne({ providerEventId: payload.eventId }, { $set: { processed: true } });
    return { processed: true };
  }

  private verifyWebhookSignature(rawBody?: string, signature?: string) {
    if (!this.webhookSecret) {
      return;
    }

    if (!rawBody || !signature) {
      throw new BadRequestException('Missing Razorpay webhook signature/raw body');
    }

    const digest = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');

    if (digest !== signature) {
      throw new UnauthorizedException('Invalid Razorpay webhook signature');
    }
  }
}
