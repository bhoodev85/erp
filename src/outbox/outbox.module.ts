import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaModule } from '../kafka/kafka.module';
import { OutboxEvent, OutboxSchema } from './outbox.schema';
import { OutboxService } from './outbox.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: OutboxEvent.name, schema: OutboxSchema }]), KafkaModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
