import { Controller, Post } from '@nestjs/common';
import { SyncMakesUseCase } from '../../domain/makes/use-cases/sync-makes';

@Controller('makes')
export class MakesController {
  constructor(private readonly syncMakes: SyncMakesUseCase) {}

  @Post('sync')
  sync(): void {
    // fire and forget
    void this.syncMakes.execute();
  }
}
