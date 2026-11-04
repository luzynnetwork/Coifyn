import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';
import { ListCustomers } from './application/list-customers.js';
import { GetCustomer } from './application/get-customer.js';
import { CreateCustomer } from './application/create-customer.js';
import { UpdateCustomer } from './application/update-customer.js';
import { ListCustomerVisits } from './application/list-customer-visits.js';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class CustomersController {
  constructor(
    private readonly listCustomersUc: ListCustomers,
    private readonly getCustomerUc: GetCustomer,
    private readonly createCustomerUc: CreateCustomer,
    private readonly updateCustomerUc: UpdateCustomer,
    private readonly listVisitsUc: ListCustomerVisits,
  ) {}

  @Get('customers')
  list(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.listCustomersUc.execute(user, search);
  }

  @Post('customers')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomerDto) {
    return this.createCustomerUc.execute(user, dto);
  }

  @Get('customers/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getCustomerUc.execute(user, id);
  }

  @Patch('customers/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.updateCustomerUc.execute(user, id, dto);
  }

  @Get('customers/:id/visits')
  visits(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listVisitsUc.execute(user, id);
  }
}
