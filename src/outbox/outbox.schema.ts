import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OutboxDocument = HydratedDocument<OutboxEvent>;

@Schema({ timestamps: true, collection: 'outbox_events' })
export class OutboxEvent {
  @Prop({ required: true })
  topic!: string;

  @Prop({ required: true })
  key!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;

  @Prop({ default: false, index: true })
  published!: boolean;
}

export const OutboxSchema = SchemaFactory.createForClass(OutboxEvent);
