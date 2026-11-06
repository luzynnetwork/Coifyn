import { IsOptional, IsUUID, Matches } from 'class-validator';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export class DayReportQuery {
  @IsUUID()
  branchId!: string;

  /** Local calendar day in the salon's timezone, YYYY-MM-DD. */
  @Matches(DAY, { message: 'date must be YYYY-MM-DD' })
  date!: string;
}

export class SalesRangeQuery {
  /** First local day, inclusive. */
  @Matches(DAY, { message: 'from must be YYYY-MM-DD' })
  from!: string;

  /** Last local day, inclusive. */
  @Matches(DAY, { message: 'to must be YYYY-MM-DD' })
  to!: string;

  /** Omit for the whole salon (needs an org-wide report:view grant). */
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
