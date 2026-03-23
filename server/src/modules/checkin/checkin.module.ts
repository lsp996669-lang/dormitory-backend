import { Module } from '@nestjs/common';
import { CheckInController } from './checkin.controller';
import { CheckInService } from './checkin.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [CheckInController],
  providers: [CheckInService],
  exports: [CheckInService],
})
export class CheckInModule {}
