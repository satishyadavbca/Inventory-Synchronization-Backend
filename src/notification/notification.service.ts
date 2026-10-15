import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoginSuccessEvent } from './events/login-success.event';
import { EmailService } from './providers/email.service';
// import { SmsService } from './providers/sms.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    // private readonly smsService: SmsService,
  ) {}

  // { async: true } ensures this runs in the background and does not block the HTTP request
  @OnEvent('user.registered', { async: true })
  async handleUserLoginEvent(payload: LoginSuccessEvent) {
    this.logger.log(`Processing login notifications for user: ${payload.userId}`);

    const { email, phone, name, otp } = payload;

    // Execute both network requests concurrently
    const results = await Promise.allSettled([
      this.emailService.sendLoginOtp(email, name, otp),
    //   this.smsService.sendMobileOtp(phone, otp),
    ]);

    // Gracefully handle and log any failures without crashing the application

    console.log('Email response:',results)
    results.forEach((result, index) => {
      const provider = index === 0 ? 'Email' : 'SMS';
      
      if (result.status === 'rejected') {
        this.logger.error(`[${provider}] Failed to send to ${payload.userId}: ${result.reason.message}`, result.reason.stack);
        // Here you could add logic to retry, send to a dead-letter queue, or alert Sentry/Datadog
      } else {
        this.logger.log(`[${provider}] Successfully sent to ${payload.userId}`);
      }
    });
  }
}