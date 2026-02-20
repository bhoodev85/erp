import { Controller, Post } from '@nestjs/common';
import { CatalogSyncService } from './catalog-sync.service';

@Controller('admin/catalog')
export class CatalogSyncController {
  constructor(private readonly syncService: CatalogSyncService) {}

  @Post('sync')
  sync() {
    return this.syncService.sync();
  }
}
