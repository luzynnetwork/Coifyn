export interface TicketTaxRate {
  /** Basis points: 800 = 8.00%. */
  basisPoints: number;
  /** Inclusive: line prices already contain the tax. Exclusive: tax is added on top. */
  inclusive: boolean;
}

export interface TicketDiscountInput {
  type: 'percent' | 'amount';
  /** percent: basis points (1000 = 10%). amount: minor units. */
  value: number;
}

export interface TicketTotals {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

/**
 * Ticket money, in integer minor units end to end — never a float that is
 * rounded at the end. One rounding step per figure, half away from zero.
 *
 *  discount  = percent of subtotal, or a fixed amount, capped at the subtotal
 *  taxable   = subtotal - discount
 *  exclusive : tax = taxable * rate;            total = taxable + tax
 *  inclusive : tax = taxable - taxable/(1+rate); total = taxable
 *
 * Tax is applied after the discount, so a discount also reduces the tax.
 */
export function computeTotals(
  lineTotalsMinor: readonly number[],
  discount: TicketDiscountInput | null,
  tax: TicketTaxRate | null,
): TicketTotals {
  const subtotalMinor = lineTotalsMinor.reduce((sum, n) => sum + n, 0);

  let discountMinor = 0;
  if (discount) {
    discountMinor =
      discount.type === 'percent'
        ? Math.round((subtotalMinor * discount.value) / 10000)
        : discount.value;
    discountMinor = Math.min(Math.max(discountMinor, 0), subtotalMinor);
  }

  const taxable = subtotalMinor - discountMinor;
  if (!tax || tax.basisPoints === 0) {
    return { subtotalMinor, discountMinor, taxMinor: 0, totalMinor: taxable };
  }

  if (tax.inclusive) {
    const net = Math.round((taxable * 10000) / (10000 + tax.basisPoints));
    return {
      subtotalMinor,
      discountMinor,
      taxMinor: taxable - net,
      totalMinor: taxable,
    };
  }

  const taxMinor = Math.round((taxable * tax.basisPoints) / 10000);
  return {
    subtotalMinor,
    discountMinor,
    taxMinor,
    totalMinor: taxable + taxMinor,
  };
}
