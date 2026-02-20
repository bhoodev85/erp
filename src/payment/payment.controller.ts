import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
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

  @IsOptional()
  @IsString()
  rawBody?: string;
}

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':orderNo/link')
  generate(@Param('orderNo') orderNo: string) {
    return this.paymentService.generateLink(orderNo);
  }

  @Post('webhook')
  webhook(
    @Body() body: WebhookDto,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    const rawBody = body.rawBody ?? JSON.stringify(body);
    return this.paymentService.handleWebhook(body, signature, rawBody);
  }
}
