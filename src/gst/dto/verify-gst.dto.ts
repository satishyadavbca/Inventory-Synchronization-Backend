// src/gst/dto/verify-gst.dto.ts
import { IsString, Matches, IsNotEmpty } from 'class-validator';

export class VerifyGstinDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, {
    message: 'Invalid GSTIN format. Please provide a valid 15-character GSTIN.',
  })
  gstin: string;
}