import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from './modules/auth/auth.module';
import { BedsModule } from './modules/beds/beds.module';
import { CheckInModule } from './modules/checkin/checkin.module';
import { CheckOutModule } from './modules/checkout/checkout.module';

@Module({
  imports: [AuthModule, BedsModule, CheckInModule, CheckOutModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
