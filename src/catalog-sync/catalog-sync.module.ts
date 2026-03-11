import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../catalog/product.schema';
import { OutboxModule } from '../outbox/outbox.module';
import { CatalogSyncController } from './catalog-sync.controller';
import { CatalogSyncService } from './catalog-sync.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]), OutboxModule],
  controllers: [CatalogSyncController],
  providers: [CatalogSyncService],
})
export class CatalogSyncModule {}
