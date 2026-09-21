/**
 * Branch hours wire types, mirrored from the `branch_hours` drizzle table and
 * backend/src/salon-setup/dto/branch-hours.dto.ts.
 */

export interface BreakWindow {
  /** "HH:MM" 24h. */
  start: string;
  end: string;
}

/** One weekday in a PUT body. `weekday` is 0 (Sun) .. 6 (Sat). */
export interface WeekdayHours {
  weekday: number;
  isClosed: boolean;
  /** "HH:MM" 24h; ignored (stored null) when isClosed. */
  opensAt?: string;
  closesAt?: string;
  /** At most 4. */
  breaks: BreakWindow[];
}

/** One stored weekday row, as returned by GET and PUT (an array ordered by weekday). */
export interface BranchHoursView {
  id: string;
  salonId: string;
  branchId: string;
  weekday: number;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  breaks: BreakWindow[];
  createdAt: string;
  updatedAt: string;
}

export interface SetBranchHoursInput {
  /** Always the full week, one entry per weekday. */
  week: WeekdayHours[];
}
