// src/users/users.service.ts
import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from "argon2";
import {AuthService} from "../auth/auth.service";
import { PinoLogger } from "nestjs-pino";
import { UserRegisteredEvent } from "../notification/events/user-registered.event";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
     private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    console.log('createUserDto',createUserDto)
    const { name, email, phone, password } = createUserDto;

    // Check if user already exists

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.error(`Attempt to create a user with an existing email: ${email}`);
      throw new ConflictException("User with this email already exists");
    }

    // Secure password hashing using Argon2id
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Generate OTP before creating user
    const otp = await this.authService.generateOTP();

    // Save user and omit the password from the returned object
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        otp
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        otp: true,
      },
    });
    // (Optional: save OTP and its expiration to database here)
    await this.authService.sendOtp(phone, email);


    const eventName = 'user.registered';
    const hasListeners = this.eventEmitter.hasListeners(eventName);

if (!hasListeners) {
  this.logger.warn(`⚠️ Warning: No listeners registered for event: ${eventName}`);
  console.warn(`⚠️ Warning: No listeners registered for event: ${eventName}`);
}
    console.log('Emitting user.registered event for user:', user.id);
    this.eventEmitter.emit(
      eventName,
      new UserRegisteredEvent(
        user.id.toString(),
        user.name,
        user.email,
        user.phone ?? '',
        otp,
      ),
    );
    this.logger.info(`User registered event emitted for user: ${user.id}, ${user.name}, ${user.email}, ${user.phone}`);
    return {
      message: "User created successfully",
      user,
    };
  }

  async findAll() {
    

    const result= await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        otp:true
        // Notice 'password' is intentionally left out
      },
    });

    return result
  }
}
