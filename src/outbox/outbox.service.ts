import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KafkaService } from '../kafka/kafka.service';
import { OutboxDocument, OutboxEvent } from './outbox.schema';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectModel(OutboxEvent.name) private readonly outboxModel: Model<OutboxDocument>,
    private readonly kafka: KafkaService,
  ) {}

  async publish(topic: string, key: string, payload: Record<string, unknown>) {
    const event = await this.outboxModel.create({ topic, key, payload, published: false });
    try {
      await this.kafka.emit(topic, payload);
      event.published = true;
      await event.save();
    } catch {
      this.logger.warn(`Outbox event ${event.id} stored as unpublished`);
    }
    return event;
  }
}
