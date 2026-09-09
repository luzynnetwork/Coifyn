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
