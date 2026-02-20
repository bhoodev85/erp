import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogSyncModule } from './catalog-sync/catalog-sync.module';
import { CatalogModule } from './catalog/catalog.module';
import { CartModule } from './cart/cart.module';
import { KafkaModule } from './kafka/kafka.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { OutboxModule } from './outbox/outbox.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI', 'mongodb://127.0.0.1:27017/erp'),
      }),
    }),
    KafkaModule,
    OutboxModule,
    CatalogSyncModule,
    CatalogModule,
    CartModule,
    OrderModule,
    PaymentModule,
    NotificationModule,
  ],
})
export class AppModule {}
