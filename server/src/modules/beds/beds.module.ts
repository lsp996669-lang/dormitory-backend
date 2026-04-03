import { Module } from '@nestjs/common';
import { BedsController, FloorsController, BedsMaintenanceController } from './beds.controller';
import { BedsService } from './beds.service';

@Module({
  controllers: [BedsController, FloorsController, BedsMaintenanceController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}
