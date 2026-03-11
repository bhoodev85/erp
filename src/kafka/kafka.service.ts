import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);

  constructor(@Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka) {}

  async onModuleInit() {
    try {
      await this.kafka.connect();
      this.logger.log('Kafka connected');
    } catch (error) {
      this.logger.warn(`Kafka unavailable, app will continue: ${(error as Error).message}`);
    }
  }

  async emit(topic: string, payload: Record<string, unknown>) {
    try {
      await this.kafka.emit(topic, payload).toPromise();
    } catch (error) {
      this.logger.warn(`Failed emitting topic ${topic}: ${(error as Error).message}`);
      throw error;
    }
  }
}
