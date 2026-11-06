import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdjustPointsDto, PutRulesDto } from './dto/loyalty.dto.js';
import { GetLoyalty } from './application/get-loyalty.js';
import { AdjustPoints } from './application/adjust-points.js';
import { LoyaltyRules } from './application/loyalty-rules.js';

@ApiTags('loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class LoyaltyController {
  constructor(
    private readonly getUc: GetLoyalty,
    private readonly adjustUc: AdjustPoints,
    private readonly rulesUc: LoyaltyRules,
  ) {}

  @Get('customers/:id/loyalty')
  account(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getUc.account(user, id);
  }

  @Get('customers/:id/loyalty/ledger')
  ledger(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getUc.ledgerFor(user, id);
  }

  @Post('customers/:id/loyalty/adjust')
  adjust(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdjustPointsDto,
  ) {
    return this.adjustUc.execute(user, id, dto);
  }

  @Get('loyalty/rules')
  rules(@CurrentUser() user: AuthUser) {
    return this.rulesUc.get(user);
  }

  @Put('loyalty/rules')
  putRules(@CurrentUser() user: AuthUser, @Body() dto: PutRulesDto) {
    return this.rulesUc.put(user, dto);
  }
}
