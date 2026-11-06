import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { StylistsModule } from '../stylists/stylists.module.js';
import { CutRecordsController } from './cut-records.controller.js';
import { CutRecordsRepo } from './data/cut-records.repo.js';
import { CutRecordPhotosRepo } from './data/cut-record-photos.repo.js';
import { FormulaEntriesRepo } from './data/formula-entries.repo.js';
import { CutRecordPresenter } from './application/cut-record-presenter.js';
import { ListCutRecords } from './application/list-cut-records.js';
import { CreateCutRecord } from './application/create-cut-record.js';
import { UpdateCutRecord } from './application/update-cut-record.js';
import { AddCutRecordPhoto } from './application/add-cut-record-photo.js';
import { DeleteCutRecordPhoto } from './application/delete-cut-record-photo.js';
import { GetLastCut } from './application/get-last-cut.js';
import { Formulas } from './application/formulas.js';

/** Phase 2: reproducible cut history — guards, fade, products, photos and
 *  colour formulas, visible to any stylist serving the customer. */
@Module({
  imports: [AuthModule, RbacModule, CustomersModule, StylistsModule, AppointmentsModule],
  controllers: [CutRecordsController],
  providers: [
    CutRecordsRepo,
    CutRecordPhotosRepo,
    FormulaEntriesRepo,
    CutRecordPresenter,
    ListCutRecords,
    CreateCutRecord,
    UpdateCutRecord,
    AddCutRecordPhoto,
    DeleteCutRecordPhoto,
    GetLastCut,
    Formulas,
  ],
  exports: [CutRecordsRepo],
})
export class CutRecordsModule {}
