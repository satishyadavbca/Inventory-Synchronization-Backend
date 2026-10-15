import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
// Redis-backed distributed throttling (future): install a version of
// `nestjs-throttler-storage-redis` compatible with the project's
// reflect-metadata, then pass its storage into ThrottlerModule below.
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpCleanupService } from './otp-cleanup.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
   PassportModule, 
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET, 
      signOptions: { expiresIn: '1h' },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 5,
    }]),
  ],
  controllers: [AuthController],
  providers: [AuthService,OtpCleanupService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
