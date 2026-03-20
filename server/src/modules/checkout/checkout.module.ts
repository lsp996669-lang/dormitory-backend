import { Module } from '@nestjs/common';
import { CheckOutController } from './checkout.controller';
import { CheckOutService } from './checkout.service';

@Module({
  controllers: [CheckOutController],
  providers: [CheckOutService],
  exports: [CheckOutService],
})
export class CheckOutModule {}
