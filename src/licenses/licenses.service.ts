import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service"; // Adjust path based on your structure
import * as crypto from 'node:crypto';

@Injectable()
export class LicensesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateRandomKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) key += "-";
      // crypto.randomInt ensures true cryptographic randomness
      key += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return key;
  }

  // --- NEW: Bulk Generation Logic ---
  async generateBulkLicenses(
    count: number,
  ): Promise<{ success: boolean; generated: number; message: string }> {
    const newLicenses = [];

    for (let i = 0; i < count; i++) {
      newLicenses.push({
        key: this.generateRandomKey(),
        isActivated: false,
      });
    }

    // Insert all keys in a single highly-optimized database query
    const result = await this.prisma.license.createMany({
      data: newLicenses,
      skipDuplicates: true, // Safety net: skips insert if a random collision happens
    });

    return {
      success: true,
      generated: result.count,
      message: `Successfully generated and saved ${result.count} offline billing licences.`,
    };
  }

  async activateLicense(
    userId: string,
    licenseKey: string,
  ): Promise<{ success: boolean; message: string }> {
    // 1. Find the license in the database
    const license = await this.prisma.license.findUnique({
      where: { key: licenseKey },
    });

    if (!license) {
      throw new NotFoundException(
        "The licence key entered does not exist. Please check for typos.",
      );
    }

    // 2. Check if it is already activated
    if (license.isActivated) {
      throw new BadRequestException(
        "This licence key has already been activated.",
      );
    }

    // 3. Mark as activated and link to the user inside a transaction
    await this.prisma.$transaction(async (prisma) => {
      // Update the license
      await prisma.license.update({
        where: { id: license.id },
        data: {
          isActivated: true,
          activatedAt: new Date(),
          userId: userId,
        },
      });

      // Optional: Update the user's role/status to "PRO" or "LICENSED" here if needed
      // await prisma.user.update({
      //   where: { id: userId },
      //   data: { isPremium: true }
      // });
    });

    return {
      success: true,
      message: "Licence activated successfully. Offline billing unlocked.",
    };
  }


  // Add this inside your LicensesService class

  async getAllLicenses() {
    const licenses = await this.prisma.license.findMany({
      orderBy: {
        createdAt: 'desc', // Shows the newest generated keys first
      },
      include: {
        // This joins the user data for licenses that are activated
        user: {
          select: {
            id: true,
            phone: true,
            // You can add email or firstName here if they exist in your User model
          },
        },
      },
    });

    return {
      success: true,
      count: licenses.length,
      data: licenses,
    };
  }
}
