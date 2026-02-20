import { Body, Controller, Param, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { PaymentService } from './payment.service';

class WebhookDto {
  @IsString()
  eventId!: string;

  @IsString()
  type!: string;

  @IsString()
  orderNo!: string;

  @IsString()
  paymentRef!: string;
}

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':orderNo/link')
  generate(@Param('orderNo') orderNo: string) {
    return this.paymentService.generateLink(orderNo);
  }

  @Post('webhook')
  webhook(@Body() body: WebhookDto) {
    return this.paymentService.handleWebhook(body);
  }
}
