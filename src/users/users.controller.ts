// src/users/users.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    console.log('Received createUserDto:', createUserDto);
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  findAll() {
    console.log('Finding all users');
    return this.usersService.findAll();
  }
}