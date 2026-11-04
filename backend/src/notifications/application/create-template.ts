import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import {
  NOTIFICATION_CATALOG,
  type NotificationKey,
} from '../catalog/notification-catalog.js';
import { NotificationTemplatesRepo } from '../data/notification-templates.repo.js';
import type { CreateTemplateDto } from '../dto/notification-template.dto.js';

/** Saves a new version of a template; the previous versions stay for audit. */
@Injectable()
export class CreateTemplate {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly templates: NotificationTemplatesRepo,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, dto: CreateTemplateDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'notification:manage', { salonId });
      const row = await this.templates.createVersion({
        salonId,
        key: dto.key,
        channel: dto.channel,
        body: dto.body,
        variables: [...NOTIFICATION_CATALOG[dto.key as NotificationKey].variables],
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'notification.template_versioned',
        targetType: 'notification_template',
        targetId: row.id,
        after: { key: dto.key, channel: dto.channel, version: row.version },
      });
      return row;
    });
  }
}
