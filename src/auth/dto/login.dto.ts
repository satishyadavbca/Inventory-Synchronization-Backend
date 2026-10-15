import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsPhoneNumber
} from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Invalid email format" })
  @MaxLength(255)
  email!: string;
  @IsNotEmpty({ message: "Phone number is required" })
  @IsPhoneNumber(undefined, {
    message: "Must be a valid phone number (e.g., +1234567890)",
  })
  phone!: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
