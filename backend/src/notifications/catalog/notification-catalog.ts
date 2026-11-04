/**
 * The customer-facing message catalog (phase-2 spec "Catalog"). Each key has a
 * default body; a salon may override a body with a versioned
 * `notification_template` row. `transactional` notices always send; the rest
 * respect the customer's marketing consent.
 *
 * Variables are written `{{name}}` and substituted by render-template.ts.
 */
export interface CatalogEntry {
  transactional: boolean;
  variables: readonly string[];
  body: string;
}

export const NOTIFICATION_CATALOG = {
  'appointment.booked': {
    transactional: true,
    variables: ['customerName', 'stylistName', 'startAt'],
    body: 'Hi {{customerName}}, you are booked with {{stylistName}} on {{startAt}}.',
  },
  'appointment.reminder_24h': {
    transactional: true,
    variables: ['customerName', 'stylistName', 'startAt'],
    body: 'Reminder: {{customerName}}, your appointment with {{stylistName}} is tomorrow at {{startAt}}.',
  },
  'appointment.reminder_2h': {
    transactional: true,
    variables: ['customerName', 'stylistName', 'startAt'],
    body: 'See you soon, {{customerName}} — your appointment with {{stylistName}} starts at {{startAt}}.',
  },
  'appointment.rescheduled': {
    transactional: true,
    variables: ['customerName', 'stylistName', 'startAt'],
    body: 'Hi {{customerName}}, your appointment with {{stylistName}} moved to {{startAt}}.',
  },
  'appointment.cancelled': {
    transactional: true,
    variables: ['customerName', 'startAt'],
    body: 'Hi {{customerName}}, your appointment on {{startAt}} was cancelled.',
  },
  'stylist.running_late': {
    transactional: true,
    variables: ['customerName', 'stylistName', 'minutes'],
    body: 'Hi {{customerName}}, {{stylistName}} is running about {{minutes}} min late.',
  },
  'stylist.absent': {
    transactional: true,
    variables: ['customerName', 'stylistName'],
    body: 'Hi {{customerName}}, {{stylistName}} is unavailable for your appointment.',
  },
  'disruption.options': {
    transactional: true,
    variables: ['customerName', 'options'],
    body: 'Hi {{customerName}}, how would you like to proceed? Options: {{options}}. Reply to the front desk.',
  },
  'queue.you_are_next': {
    transactional: true,
    variables: ['customerName'],
    body: '{{customerName}}, you are next in line.',
  },
  'queue.ready': {
    transactional: true,
    variables: ['customerName', 'stylistName'],
    body: '{{customerName}}, {{stylistName}} is ready for you.',
  },
  'loyalty.points_earned': {
    transactional: false,
    variables: ['customerName', 'points', 'balance'],
    body: '{{customerName}}, you earned {{points}} points (balance {{balance}}).',
  },
  'loyalty.reward_available': {
    transactional: false,
    variables: ['customerName', 'reward'],
    body: '{{customerName}}, a reward is available: {{reward}}.',
  },
} as const satisfies Record<string, CatalogEntry>;

export type NotificationKey = keyof typeof NOTIFICATION_CATALOG;

export function isNotificationKey(value: string): value is NotificationKey {
  return value in NOTIFICATION_CATALOG;
}
