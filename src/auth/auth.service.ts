import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import * as argon2 from "argon2";
import { PinoLogger } from "nestjs-pino";
import { randomInt } from "node:crypto";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly OTP_EXPIRY_MINUTES = 5;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      this.logger.warn({ msg: "Failed login attempt", email: loginDto.email });
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.logger.warn({
        msg: "Login attempt on locked account",
        userId: user.id,
      });
      throw new ForbiddenException("Account locked.");
    }

    const isPasswordValid = await argon2.verify(
      user.password,
      loginDto.password,
    );

    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      let lockedUntil = null;
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newAttempts, lockedUntil },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    const result = await this.generateTokens(user.id, user.email, user.name);
    console.log("User authenticated successfully:", result);
    return result;
  }

  private async generateTokens(userId: string, email: string, name: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, name },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "1h" },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, name },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: "7d" },
      ),
    ]);
    return { accessToken, refreshToken, user: { id: userId, email, name } };
  }

  async sendOtp(phone: string, email?: string): Promise<{ message: string }> {
    // 1. Invalidate any previously active OTPs for this phone number (Resend logic)

    const isExist = await this.prisma.user.findFirst({
      where: { phone },
    });
    console.log("Checking if phone number exists:", isExist);
    if(!isExist){
      throw new BadRequestException("Phone number not registered.");
    }
    await this.prisma.otpVerification.updateMany({
      where: {
        phone,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // 2. Generate a random 4-digit OTP
    const otp = await this.generateOTP(); //randomInt(1000, 10000).toString();

    // 3. Hash the OTP (Use a low salt round like 10 for performance)
    const otpHash = await bcrypt.hash(otp, 10);

    // 4. Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // 5. Save to database
    await this.prisma.otpVerification.create({
      data: {
        phone,
        otpHash,
        expiresAt,
      },
    });

    return { message: "OTP sent successfully" };
  }

  async verifyOtp(
    phone: string,
    enteredOtp: string,
  ): Promise<{ success: boolean; message: string }> {
    // 1. Find the most recent active OTP
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        phone,
        isUsed: false,
        expiresAt: { gt: new Date() }, // Must not be expired
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new BadRequestException("OTP has expired or does not exist.");
    }

    // 2. Check for brute-force attempts
    if (otpRecord.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      // Invalidate the OTP to lock it permanently
      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      throw new BadRequestException(
        "Too many failed attempts. Please request a new OTP.",
      );
    }

    // 3. Verify the hash
    const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otpHash);

    if (!isMatch) {
      // Increment failed attempts
      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { failedAttempts: { increment: 1 } },
      });
      throw new BadRequestException("Invalid OTP.");
    }

    // 4. Success: Mark OTP as used to prevent replay attacks
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return { success: true, message: "OTP verified successfully" };
  }

  async generateOTP(): Promise<string> {
    const otp = randomInt(1000, 10000).toString();
    console.log(`[DEV ONLY] OTP is: ${otp}`);
    return otp;
  }
}
