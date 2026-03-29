import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from './modules/auth/auth.module';
import { BedsModule } from './modules/beds/beds.module';
import { CheckInModule } from './modules/checkin/checkin.module';
import { CheckOutModule } from './modules/checkout/checkout.module';
import { ExportModule } from './modules/export/export.module';
import { NotificationModule } from './modules/notification/notification.module';
import { RollCallModule } from './modules/rollcall/rollcall.module';

@Module({
  imports: [AuthModule, BedsModule, CheckInModule, CheckOutModule, ExportModule, NotificationModule, RollCallModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
