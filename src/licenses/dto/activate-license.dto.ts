import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ActivateLicenseDto {
  @IsString()
  @IsNotEmpty()
  // Validates format: XXXX-XXXX-XXXX-XXXX (Alphanumeric)
  @Matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, {
    message: 'Invalid licence key format. Expected format: XXXX-XXXX-XXXX-XXXX',
  })
  licenseKey: string;
}