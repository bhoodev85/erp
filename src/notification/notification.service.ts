import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendWhatsApp(orderNo: string, userId: string) {
    this.logger.log(`WhatsApp notification queued for order ${orderNo}, user ${userId}`);
    return { sent: true, channel: 'whatsapp', orderNo, userId };
  }
}
