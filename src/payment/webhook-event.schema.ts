import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookEventDocument = HydratedDocument<WebhookEvent>;

@Schema({ timestamps: true, collection: 'webhook_events' })
export class WebhookEvent {
  @Prop({ required: true, unique: true, index: true })
  providerEventId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;

  @Prop({ default: false })
  processed!: boolean;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);
