import { Module } from '@nestjs/common';
import { RollCallController } from './rollcall.controller';
import { RollCallService } from './rollcall.service';

@Module({
  controllers: [RollCallController],
  providers: [RollCallService],
  exports: [RollCallService],
})
export class RollCallModule {}
