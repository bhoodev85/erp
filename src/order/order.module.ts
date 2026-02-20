import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../catalog/catalog.module';
import { CartModule } from '../cart/cart.module';
import { OutboxModule } from '../outbox/outbox.module';
import { OrderController } from './order.controller';
import { Order, OrderSchema } from './order.schema';
import { OrderService } from './order.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]), CartModule, CatalogModule, OutboxModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
