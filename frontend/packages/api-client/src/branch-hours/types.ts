/** Branch hours wire types, mirrored from backend/src/salon-setup/dto/branch-hours.dto.ts. */

export interface BreakWindow {
  start: string;
  end: string;
}

export interface WeekdayHours {
  weekday: number;
  isClosed: boolean;
  opensAt?: string;
  closesAt?: string;
  breaks: BreakWindow[];
}

export interface BranchHoursView {
  branchId: string;
  week: WeekdayHours[];
}

export interface SetBranchHoursInput {
  week: WeekdayHours[];
}
