import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthCustomer } from './customer.js';

/** Injects the {@link AuthCustomer} attached by {@link CustomerJwtAuthGuard}. */
export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthCustomer => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { customer?: AuthCustomer }>();
    if (!req.customer) {
      throw new Error(
        'CurrentCustomer used on a route without CustomerJwtAuthGuard.',
      );
    }
    return req.customer;
  },
);
