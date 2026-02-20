import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogController } from './catalog.controller';
import { Product, ProductSchema } from './product.schema';
import { CatalogService } from './catalog.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService, MongooseModule],
})
export class CatalogModule {}
