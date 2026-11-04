import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { LoyaltyController } from './loyalty.controller.js';
import { LoyaltyRulesRepo } from './data/loyalty-rules.repo.js';
import { LoyaltyAccountsRepo } from './data/loyalty-accounts.repo.js';
import { LoyaltyLedgerRepo } from './data/loyalty-ledger.repo.js';
import { PointsPoster } from './application/points-poster.js';
import { AccruePoints } from './application/accrue-points.js';
import { GetLoyalty } from './application/get-loyalty.js';
import { AdjustPoints } from './application/adjust-points.js';
import { LoyaltyRules } from './application/loyalty-rules.js';
import { ExpirePoints } from './application/expire-points.js';
import { LoyaltyWorker } from './loyalty.worker.js';

/** Phase 2: points on payment, tiers, manual (audited) adjustment and expiry.
 *  AccruePoints is exported so the payment use case can call it in-transaction. */
@Module({
  imports: [AuthModule, RbacModule, CustomersModule, NotificationsModule],
  controllers: [LoyaltyController],
  providers: [
    LoyaltyRulesRepo,
    LoyaltyAccountsRepo,
    LoyaltyLedgerRepo,
    PointsPoster,
    AccruePoints,
    GetLoyalty,
    AdjustPoints,
    LoyaltyRules,
    ExpirePoints,
    LoyaltyWorker,
  ],
  exports: [AccruePoints],
})
export class LoyaltyModule {}
