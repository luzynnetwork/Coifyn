import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  AddPhotoDto,
  CreateCutRecordDto,
  CreateFormulaDto,
  UpdateCutRecordDto,
  UpdateFormulaDto,
} from './dto/cut-record.dto.js';
import { ListCutRecords } from './application/list-cut-records.js';
import { CreateCutRecord } from './application/create-cut-record.js';
import { UpdateCutRecord } from './application/update-cut-record.js';
import { AddCutRecordPhoto } from './application/add-cut-record-photo.js';
import { DeleteCutRecordPhoto } from './application/delete-cut-record-photo.js';
import { GetLastCut } from './application/get-last-cut.js';
import { Formulas } from './application/formulas.js';

@ApiTags('cut-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class CutRecordsController {
  constructor(
    private readonly listUc: ListCutRecords,
    private readonly createUc: CreateCutRecord,
    private readonly updateUc: UpdateCutRecord,
    private readonly addPhotoUc: AddCutRecordPhoto,
    private readonly deletePhotoUc: DeleteCutRecordPhoto,
    private readonly lastCutUc: GetLastCut,
    private readonly formulas: Formulas,
  ) {}

  @Get('customers/:id/cut-records')
  list(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listUc.execute(user, id);
  }

  @Post('cut-records')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCutRecordDto) {
    return this.createUc.execute(user, dto);
  }

  @Patch('cut-records/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCutRecordDto,
  ) {
    return this.updateUc.execute(user, id, dto);
  }

  @Post('cut-records/:id/photos')
  addPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddPhotoDto,
  ) {
    return this.addPhotoUc.execute(user, id, dto);
  }

  @Delete('cut-records/:id/photos/:photoId')
  deletePhoto(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.deletePhotoUc.execute(user, id, photoId);
  }

  @Get('appointments/:id/last-cut')
  lastCut(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.lastCutUc.execute(user, id);
  }

  @Get('customers/:id/formulas')
  listFormulas(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.formulas.list(user, id);
  }

  @Post('formulas')
  createFormula(@CurrentUser() user: AuthUser, @Body() dto: CreateFormulaDto) {
    return this.formulas.create(user, dto);
  }

  @Patch('formulas/:id')
  updateFormula(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFormulaDto,
  ) {
    return this.formulas.update(user, id, dto);
  }
}
