// src/gst/gst.controller.ts
import { Controller,Body, Post } from '@nestjs/common';
import { GstService } from './gst.service';
import { VerifyGstinDto } from './dto/verify-gst.dto';
import { PinoLogger } from "nestjs-pino";

@Controller('gst')
export class GstController {
  constructor(private readonly gstService: GstService, private readonly logger: PinoLogger) {}

  @Post('verify')
  async verifyGstin(@Body() verifyGstinDto: VerifyGstinDto) {
    // If the code reaches here, the DTO regex has already passed!
    // Now we make the paid API call.
    this.logger.info(`Verifying GSTIN: ${verifyGstinDto.gstin}`);
    return await this.gstService.verifyGstin(verifyGstinDto.gstin);
  }
}