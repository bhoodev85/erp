import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { OrderService } from './order.service';

class CreateOrderDto {
  @IsString()
  userId!: string;
}

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.orderService.create(body.userId);
  }

  @Get(':orderNo')
  getOne(@Param('orderNo') orderNo: string) {
    return this.orderService.findByOrderNo(orderNo);
  }
}
