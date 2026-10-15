// src/gst/gst.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GstController } from './gst.controller';
import { GstService } from './gst.service';

@Module({
  imports: [HttpModule], // Required for making API calls
  controllers: [GstController],
  providers: [GstService],
})
export class GstModule {}