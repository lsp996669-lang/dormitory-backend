import { Module } from '@nestjs/common';
import { BedsController, FloorsController } from './beds.controller';
import { BedsService } from './beds.service';

@Module({
  controllers: [BedsController, FloorsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}
