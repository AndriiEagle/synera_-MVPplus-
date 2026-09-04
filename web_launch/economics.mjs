// Scenario assumptions, not actual provider usage, taxes due, demand or accounting profit.
export function economics({ price = 39, members = 50, minutes = 10, hourly = 45, ai = 1, infrastructure = 50, fixedHours = 8, acquisition = 200, vat = 0, paymentPercent = 2.9, billingPercent = 0.7, paymentFixed = 0.30 } = {}) {
  const values = [price, members, minutes, hourly, ai, infrastructure, fixedHours, acquisition, vat, paymentPercent, billingPercent, paymentFixed];
  if (values.some(n => !Number.isFinite(n) || n < 0) || price <= 0 || !Number.isInteger(members) || vat > 100 || paymentPercent + billingPercent > 100) throw new Error('Invalid scenario');
  const revenuePerMember = price / (1 + vat / 100);
  const feesPerMember = price * (paymentPercent + billingPercent) / 100 + paymentFixed;
  const timePerMember = minutes * hourly / 60;
  const contribution = revenuePerMember - feesPerMember - ai - timePerMember;
  const fixed = infrastructure + fixedHours * hourly + acquisition;
  const beforeOwnerTime = members * (revenuePerMember - feesPerMember - ai) - infrastructure - acquisition;
  return { revenuePerMember, feesPerMember, timePerMember, contribution, fixed,
    grossRevenue: members * price, beforeOwnerTime, afterOwnerTime: members * contribution - fixed,
    breakEvenMembers: contribution > 0 ? Math.ceil(fixed / contribution) : null,
    contributionMargin: contribution / revenuePerMember,
    hoursPerMonth: members * minutes / 60 + fixedHours,
    // Time ceiling for a 60% contribution margin before fixed costs.
    sixtyPercentFeasible: 0.4 * revenuePerMember - feesPerMember - ai >= 0,
    minutesFor60Percent: hourly > 0 && 0.4 * revenuePerMember - feesPerMember - ai >= 0 ? (0.4 * revenuePerMember - feesPerMember - ai) * 60 / hourly : null,
  };
}
