import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsInt, IsMongoId, IsString, Min } from 'class-validator';
import { CartService } from './cart.service';

class AddCartItemDto {
  @IsString()
  userId!: string;

  @IsMongoId()
  productId!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  addItem(@Body() body: AddCartItemDto) {
    return this.cartService.addItem(body.userId, body.productId, body.qty);
  }

  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.cartService.get(userId);
  }

  @Delete(':userId')
  clear(@Param('userId') userId: string) {
    return this.cartService.clear(userId);
  }
}
