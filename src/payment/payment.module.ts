import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationModule } from '../notification/notification.module';
import { OrderModule } from '../order/order.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { WebhookEvent, WebhookEventSchema } from './webhook-event.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: WebhookEvent.name, schema: WebhookEventSchema }]), OrderModule, NotificationModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
