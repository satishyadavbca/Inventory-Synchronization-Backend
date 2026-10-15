import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class  OtpCleanupService {
  private readonly logger = new Logger(OtpCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Runs every day at 2:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleOtpCleanup() {
    this.logger.log('Starting OTP cleanup job...');
    
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const result = await this.prisma.otpVerification.deleteMany({
      where: {
        expiresAt: { lt: twentyFourHoursAgo },
      },
    });

    this.logger.log(`Deleted ${result.count} expired OTP records.`);
  }
}