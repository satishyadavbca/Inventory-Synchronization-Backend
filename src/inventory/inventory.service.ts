import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InventoryService.name);
  }

  async create(createProductDto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { sku: createProductDto.sku } });
    if (existing) {
      throw new ConflictException('Product with this SKU already exists');
    }
    
    this.logger.info({ msg: 'Creating new product', sku: createProductDto.sku });
    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true }
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id }
    });
  }
}
