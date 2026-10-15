import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EmailService } from './providers/email.service';
// import { SmsService } from './providers/sms.service';

@Module({
  providers: [NotificationService, EmailService],
  exports: [NotificationService], // Export if other modules need to inject it
})
export class NotificationModule {}