// src/gst/gst.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GstService {
  private readonly logger = new Logger(GstService.name);

  constructor(private readonly httpService: HttpService) {}

  async verifyGstin(gstin: string) {
    try {
      this.logger.log(`Initiating RapidAPI validation for GSTIN: ${gstin}`);

      const response = await firstValueFrom(
        // 1. Switched to .get()
        // 2. Removed the body payload argument. GET only takes (url, config)
        this.httpService.get(
            
          `https://gst-insights-api.p.rapidapi.com/getGSTDetailsUsingGST/27AABCI6363G3ZH`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-rapidapi-host': 'gst-insights-api.p.rapidapi.com',
              // Never hardcode your key in production, always use process.env or ConfigService
              'x-rapidapi-key': `${process.env.RAPIDAPI_KEY}`, 
            },
          },
        ),
      );

      return {
        isValid: true,
        businessDetails: response.data,
      };

    } catch (error: unknown) {
      this.logger.error(`GSTIN API Error: ${(error as Error)?.message}`);
      
      // Cleanly cast the error once to avoid repeating the ugly syntax
      const err = error as { response?: { status: number } };

      // Handle invalid GSTINs rejected by RapidAPI
      if (err.response?.status === 400 || err.response?.status === 404) {
        throw new HttpException(
          { isValid: false, message: 'GSTIN is formatted correctly but not found/active in government records.' },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Handle rate limits or missing API keys (common with RapidAPI)
      if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 429) {
        throw new HttpException(
          'API authentication failed or rate limit exceeded. Check your RapidAPI account.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Handle provider downtime
      throw new HttpException(
        'GSTIN Verification service is currently unavailable.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}