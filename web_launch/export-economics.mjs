import fs from 'node:fs/promises';
import { economics } from './economics.mjs';
const output = new URL('../docs/meeting-gilbert/pricing-scenarios.csv', import.meta.url);
const columns = ['price_chf', 'members', 'minutes_per_member', 'vat_percent', 'hourly_chf', 'variable_ai_allowance_chf', 'infrastructure_chf', 'fixed_hours', 'acquisition_chf', 'fees_per_member_chf', 'contribution_per_member_chf', 'gross_revenue_chf', 'before_owner_time_chf', 'after_owner_time_chf', 'break_even_members', 'monthly_owner_hours'];
const rows = [];
for (const price of [20, 29, 39, 49, 50]) for (const members of [20, 50, 100]) for (const minutes of [10, 30]) for (const vat of [0, 8.1]) {
  const input = { price, members, minutes, vat, hourly: 45, ai: 1, infrastructure: 50, fixedHours: 8, acquisition: 200 }, r = economics(input);
  rows.push([price, members, minutes, vat, input.hourly, input.ai, input.infrastructure, input.fixedHours, input.acquisition, r.feesPerMember, r.contribution, r.grossRevenue, r.beforeOwnerTime, r.afterOwnerTime, r.breakEvenMembers ?? 'not_reachable', r.hoursPerMonth].map(v => typeof v === 'number' ? Number(v.toFixed(4)) : v).join(','));
}
await fs.writeFile(output, columns.join(',') + '\n' + rows.join('\n') + '\n');
console.log(JSON.stringify({ scenarios: rows.length, file: 'docs/meeting-gilbert/pricing-scenarios.csv', actual_revenue: false }));
