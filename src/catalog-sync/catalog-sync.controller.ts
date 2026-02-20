import { Body, Controller, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CatalogSyncService } from './catalog-sync.service';

class SyncSingleDto {
  @IsString()
  metaProductId!: string;
}

class SyncBulkDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}

@Controller('admin/catalog')
export class CatalogSyncController {
  constructor(private readonly syncService: CatalogSyncService) {}

  @Post('sync/single')
  syncSingle(@Body() body: SyncSingleDto) {
    return this.syncService.syncSingle(body.metaProductId);
  }

  @Post('sync/bulk')
  syncBulk(@Body() body: SyncBulkDto) {
    return this.syncService.syncBulk(body.limit, body.cursor);
  }

  @Post('sync')
  sync(@Body() body: SyncBulkDto) {
    return this.syncService.syncBulk(body.limit, body.cursor);
  }
}
