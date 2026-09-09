import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { AuditWriter } from './audit-writer.js';
import { AuditRepo } from './data/audit.repo.js';
import { AuditController } from './audit.controller.js';
import { ListAuditEvents } from './application/list-audit-events.js';

/**
 * `AuditWriter` is global — any feature module writes audit rows through it,
 * in-transaction with the change. The read side (`GET /audit`, gated by
 * `auditlog:view`) lives here too.
 *
 * There is no auto-audit interceptor: every sensitive use case writes its own
 * audit row so it can capture before/after state, which a generic interceptor
 * cannot.
 */
@Global()
@Module({
  imports: [AuthModule, RbacModule],
  controllers: [AuditController],
  providers: [AuditWriter, AuditRepo, ListAuditEvents],
  exports: [AuditWriter],
})
export class AuditModule {}
