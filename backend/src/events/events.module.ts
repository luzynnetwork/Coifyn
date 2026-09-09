import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus.js';

/** Global — feature modules emit domain events through {@link EventBus}. The
 *  relay worker, typed event registry and BullMQ wiring land in the events
 *  phase; for now events are durably written to the outbox in-transaction. */
@Global()
@Module({
  providers: [EventBus],
  exports: [EventBus],
})
export class EventsModule {}
