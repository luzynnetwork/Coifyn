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
import {
  AddNoteDto,
  AddTagDto,
  MergeCustomersDto,
  UpdateConsentDto,
  UpdatePreferencesDto,
} from './dto/customer-crm.dto.js';
import { GetPreferences } from './application/get-preferences.js';
import { UpdatePreferences } from './application/update-preferences.js';
import { GetConsent } from './application/get-consent.js';
import { UpdateConsent } from './application/update-consent.js';
import { AddTag } from './application/add-tag.js';
import { AddNote } from './application/add-note.js';
import { GetTimeline } from './application/get-timeline.js';
import { MergeCustomers } from './application/merge-customers.js';

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
    private readonly getPreferencesUc: GetPreferences,
    private readonly updatePreferencesUc: UpdatePreferences,
    private readonly getConsentUc: GetConsent,
    private readonly updateConsentUc: UpdateConsent,
    private readonly addTagUc: AddTag,
    private readonly addNoteUc: AddNote,
    private readonly timelineUc: GetTimeline,
    private readonly mergeUc: MergeCustomers,
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

  @Post('customers/merge')
  merge(@CurrentUser() user: AuthUser, @Body() dto: MergeCustomersDto) {
    return this.mergeUc.execute(user, dto);
  }

  @Get('customers/:id/preferences')
  preferences(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getPreferencesUc.execute(user, id);
  }

  @Patch('customers/:id/preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.updatePreferencesUc.execute(user, id, dto);
  }

  @Get('customers/:id/consent')
  consent(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getConsentUc.execute(user, id);
  }

  @Patch('customers/:id/consent')
  updateConsent(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateConsentDto,
  ) {
    return this.updateConsentUc.execute(user, id, dto);
  }

  @Post('customers/:id/tags')
  addTag(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddTagDto,
  ) {
    return this.addTagUc.execute(user, id, dto);
  }

  @Post('customers/:id/notes')
  addNote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
  ) {
    return this.addNoteUc.execute(user, id, dto);
  }

  @Get('customers/:id/timeline')
  timeline(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.timelineUc.execute(user, id);
  }
}
