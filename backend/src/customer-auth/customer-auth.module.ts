import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomerAuthController } from './customer-auth.controller.js';
import { CustomersRepo } from './data/customers.repo.js';
import { CustomerSessionsRepo } from './data/customer-sessions.repo.js';
import { CustomerVerificationsRepo } from './data/customer-verifications.repo.js';
import { PasswordService } from '../auth/lib/password.js';
import { CustomerTokenService } from './lib/customer-tokens.js';
import { IssueCustomerSession } from './application/issue-customer-session.js';
import { RegisterCustomer } from './application/register.js';
import { VerifyCustomer } from './application/verify.js';
import { LoginCustomer } from './application/login.js';
import { LogoutCustomer } from './application/logout.js';
import { GetMeCustomer } from './application/get-me.js';
import { UpdateMeCustomer } from './application/update-me.js';
import { RequestCustomerPasswordReset } from './application/request-password-reset.js';
import { ResetCustomerPassword } from './application/reset-password.js';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard.js';

/**
 * Customer-portal identity — separate from `AuthModule` (staff). One provider
 * per operation (application/*), one repo per table (data/*).
 * `PasswordService` is reused from `AuthModule` as-is (hashing has no identity
 * of its own); everything else — tokens, sessions, guard — is customer-only so
 * a staff token can never authenticate a portal route and vice versa.
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerAuthController],
  providers: [
    CustomersRepo,
    CustomerSessionsRepo,
    CustomerVerificationsRepo,
    PasswordService,
    CustomerTokenService,
    IssueCustomerSession,
    RegisterCustomer,
    VerifyCustomer,
    LoginCustomer,
    LogoutCustomer,
    GetMeCustomer,
    UpdateMeCustomer,
    RequestCustomerPasswordReset,
    ResetCustomerPassword,
    CustomerJwtAuthGuard,
  ],
  // CustomerJwtAuthGuard is re-instantiated in every module that @UseGuards it
  // (mirrors AuthModule's export of JwtAuthGuard).
  exports: [CustomerJwtAuthGuard, CustomerTokenService, CustomersRepo],
})
export class CustomerAuthModule {}
