import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentCustomer } from './current-customer.decorator.js';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard.js';
import type { AuthCustomer } from './customer.js';
import {
  ForgotCustomerPasswordDto,
  LoginCustomerDto,
  LogoutCustomerDto,
  RegisterCustomerDto,
  ResetCustomerPasswordDto,
  UpdateMeCustomerDto,
  VerifyCustomerDto,
} from './dto/customer-auth.dto.js';
import { GetMeCustomer } from './application/get-me.js';
import { LoginCustomer } from './application/login.js';
import { LogoutCustomer } from './application/logout.js';
import { RegisterCustomer } from './application/register.js';
import { RequestCustomerPasswordReset } from './application/request-password-reset.js';
import { ResetCustomerPassword } from './application/reset-password.js';
import { UpdateMeCustomer } from './application/update-me.js';
import { VerifyCustomer } from './application/verify.js';
import type { CustomerSessionContext } from './application/issue-customer-session.js';

@ApiTags('customer-auth')
@Controller({ path: 'portal', version: '1' })
export class CustomerAuthController {
  constructor(
    private readonly register: RegisterCustomer,
    private readonly verify: VerifyCustomer,
    private readonly login: LoginCustomer,
    private readonly logout: LogoutCustomer,
    private readonly getMe: GetMeCustomer,
    private readonly updateMe: UpdateMeCustomer,
    private readonly requestPasswordReset: RequestCustomerPasswordReset,
    private readonly resetPassword: ResetCustomerPassword,
  ) {}

  @Post('auth/register')
  registerAccount(@Body() dto: RegisterCustomerDto) {
    return this.register.execute(dto);
  }

  @Post('auth/verify')
  @HttpCode(200)
  verifyAccount(@Body() dto: VerifyCustomerDto, @Req() req: Request) {
    return this.verify.execute(dto, sessionContext(req));
  }

  @Post('auth/login')
  @HttpCode(200)
  loginAccount(@Body() dto: LoginCustomerDto, @Req() req: Request) {
    return this.login.execute(dto, sessionContext(req));
  }

  @Post('auth/logout')
  @HttpCode(204)
  async logoutAccount(@Body() dto: LogoutCustomerDto) {
    await this.logout.execute(dto);
  }

  @Post('auth/forgot-password')
  @HttpCode(202)
  async forgotPassword(@Body() dto: ForgotCustomerPasswordDto) {
    await this.requestPasswordReset.execute(dto);
  }

  @Post('auth/reset-password')
  @HttpCode(204)
  async doResetPassword(@Body() dto: ResetCustomerPasswordDto) {
    await this.resetPassword.execute(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  me(@CurrentCustomer() customer: AuthCustomer) {
    return this.getMe.execute(customer);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  patchMe(
    @CurrentCustomer() customer: AuthCustomer,
    @Body() dto: UpdateMeCustomerDto,
  ) {
    return this.updateMe.execute(customer, dto);
  }
}

function sessionContext(req: Request): CustomerSessionContext {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ip: req.ip ?? null,
  };
}
