import { Controller, Post, Get,Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { GenerateBulkLicensesDto } from './dto/generate-bulk.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';


@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('activate')
  @HttpCode(HttpStatus.OK)
//    @UseGuards(JwtAuthGuard) // Protect this route so only logged-in users can activate
   
  async activate(
    @Body() activateLicenseDto: ActivateLicenseDto,
    @Req() req: any // Using Req to extract the logged-in user's ID
  ) {
    // In a real app with JWT: const userId = req.user.id;
    // For testing without JWT, hardcode a user ID that exists in your database:
    const userId = '05146569-0282-408c-8883-a6200e4a1894'; 

    return this.licensesService.activateLicense(userId, activateLicenseDto.licenseKey);
  }

  @Post('generate-bulk')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard) 
//   @Roles(Role.ADMIN)
  async generateBulk(@Body() dto: GenerateBulkLicensesDto) {
    return this.licensesService.generateBulkLicenses(dto.count);
  }

  // Admin-only route to view all licenses
  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllLicenses() {
    return this.licensesService.getAllLicenses();
  }
}