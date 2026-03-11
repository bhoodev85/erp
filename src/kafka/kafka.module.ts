import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: (config.get('KAFKA_BROKERS', '127.0.0.1:9092') as string).split(','),
              clientId: config.get('KAFKA_CLIENT_ID', 'erp-commerce-api'),
            },
            consumer: {
              groupId: config.get('KAFKA_GROUP_ID', 'erp-commerce-api-group'),
            },
          },
        }),
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
