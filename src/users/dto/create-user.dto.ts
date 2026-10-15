// src/users/dto/create-user.dto.ts
import { License } from "@prisma/client";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsPhoneNumber
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MaxLength(100, { message: "Name cannot exceed 100 characters" })
  name!: string;

  @IsEmail({}, { message: "Invalid email format" })
   @IsNotEmpty({ message: "Email is required" })
  @MaxLength(255)
  email!: string;

  
 @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber(undefined, { message: 'Must be a valid phone number (e.g., +1234567890)' })
  phone!: string;

  @IsString()
  @IsNotEmpty({message:"Password is required"})
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(128)
  password!: string;

  otp !: string;
  licenses!: License[];
}
