import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingRequestsRepo } from '../../booking-requests/data/booking-requests.repo.js';
import { SlotFinder } from '../../availability/application/slot-finder.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import type { SubmitBookingRequestDto } from '../dto/public-booking.dto.js';
import { PublicSalonReader, localDate } from './public-salon-reader.js';

const MAX_OPEN_PER_PHONE = 5;

/**
 * A customer asks for a slot from the public page. The slot must genuinely be
 * open (re-derived server-side — the client's list is never trusted), and the
 * request waits in the console for staff to confirm. Nothing is booked yet, so
 * the slot is not blocked until then.
 */
@Injectable()
export class SubmitBookingRequest {
  constructor(
    private readonly database: DatabaseService,
    private readonly reader: PublicSalonReader,
    private readonly stylists: StylistProfilesRepo,
    private readonly finder: SlotFinder,
    private readonly requests: BookingRequestsRepo,
    private readonly events: EventBus,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(slug: string, dto: SubmitBookingRequestDto) {
    const phone = dto.customerPhone.replace(/\s+/g, '');
    const startAt = new Date(dto.startAt);

    const row = await this.database.withSystem(async () => {
      const salon = await this.reader.resolve(slug);
      const stylist = await this.stylists.findById(salon.id, dto.stylistId);
      if (!stylist || !stylist.isBookable) {
        throw new NotFoundException('Stylist not found.');
      }

      const open = await this.finder.find({
        salonId: salon.id,
        stylistId: stylist.id,
        serviceIds: dto.serviceIds,
        date: localDate(startAt, salon.timezone),
      });
      const slot = open.find((s) => s.startAt.getTime() === startAt.getTime());
      if (!slot) throw new ConflictException('That slot is no longer open.');

      if ((await this.requests.countOpenForPhone(salon.id, phone)) >= MAX_OPEN_PER_PHONE) {
        throw new HttpException(
          'Too many open requests for this number.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (dto.customerName.trim().length === 0) {
        throw new BadRequestException('Name is required.');
      }

      const created = await this.requests.create({
        salonId: salon.id,
        branchId: stylist.branchId,
        stylistId: stylist.id,
        serviceIds: dto.serviceIds,
        startAt: slot.startAt,
        endAt: slot.endAt,
        customerName: dto.customerName.trim(),
        customerPhone: phone,
        notes: dto.notes ?? null,
      });
      await this.events.emit({
        aggregateType: 'booking_request',
        aggregateId: created.id,
        type: 'BookingRequestSubmitted',
        salonId: salon.id,
        payload: { requestId: created.id, branchId: created.branchId },
      });
      return created;
    });

    this.realtime.publish(`front-desk:${row.branchId}`, { bookingRequestId: row.id });
    return { id: row.id, status: row.status, startAt: row.startAt, endAt: row.endAt };
  }
}
