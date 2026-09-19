/**
 * The full Drizzle schema. drizzle-kit reads this (drizzle.config.ts) and every
 * repository imports its tables from here.
 *
 * Phase 0 slice: tenancy, auth, rbac, events, audit. Feature tables (services,
 * stylists, queue, tickets, …) are added by their phases as new files exported
 * here.
 */
export * from './tenancy.js';
export * from './auth.js';
export * from './rbac.js';
export * from './events.js';
export * from './audit.js';
export * from './notifications.js';
export * from './customer-auth.js';
export * from './salon-setup.js';
export * from './services.js';
export * from './stylists.js';
export * from './staff.js';
export * from './customers.js';
export * from './queue.js';
