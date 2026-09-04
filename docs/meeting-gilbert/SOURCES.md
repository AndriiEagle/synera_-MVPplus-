# Source register

Checked **2026-09-04** through live web retrieval. These 24 source pages support the linked research; their existence does not validate Synera demand. Company pages establish their own published offer, not independently verified product quality. Dates below are publication dates only where the page exposed one. A crawl date is not a publication date.

| ID | Source | Evidence used | Limit / unresolved point |
| --- | --- | --- | --- |
| S01 | [Boardy homepage](https://www.boardy.ai/) | Goal-oriented introductions, double opt-in, Pro offering | No Pro price exposed; marketing traction not treated as audited results |
| S02 | [Boardy Terms](https://www.boardy.ai/terms-and-conditions) · 2026-04-17 | Terms state current free use | Possible pricing/documentation drift relative to Pro homepage |
| S03 | [YC Co-Founder Matching](https://www.ycombinator.com/cofounder-matching) | Free co-founder product; visibility among approved users | Different job from recurring service collaboration |
| S04 | [Impact Hub Zürich membership](https://zurich.impacthub.ch/en/what-we-do/coworking-community/) | Community CHF50/month, minimum three months; youth offer CHF20 | Membership bundle, not standalone software; VAT inclusion not separately verified |
| S05 | [Swisspreneur community/events](https://www.swisspreneur.org/community-events) | Founder Slack applications and in-person formats | No overall monthly membership price established; no partnership |
| S06 | [BNI Switzerland FAQ](https://bni.swiss/de-CH/faq) | Referral network, admission process, profession exclusivity, fee components | Exact current CHF quote unavailable on FAQ |
| S07 | [EY Swiss AI survey](https://www.ey.com/en_ch/newsroom/2026/05/artificial-intelligence-widely-established-in-swiss-companies-but-many-are-still-in-the-early-stages-of-scaling) · 2026-05-27 | 604 respondents; daily AI use and sample composition | Large firms overrepresented relative to Synera target; no Synera WTP evidence |
| S08 | [FDPIC: AI and data protection](https://www.edoeb.admin.ch/en/ai-and-data-protection) · 2025-09-24 | Swiss data law applies to AI; transparency and individual control | Requirements guidance, not certification of this implementation |
| S09 | [Zheng et al., Judging LLM-as-a-Judge](https://arxiv.org/abs/2306.05685) · 2023 | Position, verbosity and self-preference bias | Response-judging benchmarks, not business mediation acceptance |
| S10 | [Assessing Judging Bias in Large Reasoning Models](https://arxiv.org/abs/2504.09946) · 2025 | Reasoning does not remove all judging biases | Research conditions/model versions; avoid universal numerical claims |
| S11 | [Tessler et al., AI can help humans find common ground](https://deepmind.google/research/publications/65220/) · Science, 2024-10-18 | Iterative mediation of opinions and critiques in deliberation | Social/political deliberation, not ownership allocation or commercial arbitration |
| S12 | [Stripe Switzerland pricing](https://stripe.com/en-ch/pricing) | Domestic Payments 2.9% + CHF0.30 and recurring Billing 0.7% | Calculator excludes optional products, international/FX and disputes |
| S13 | [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) | Asynchronous subscription state and verified events | Integration not implemented or tested against Stripe in this task |
| S14 | [Stripe customer management](https://docs.stripe.com/customer-management) | Customer billing/subscription self-service | Real seller/account configuration remains necessary |
| S15 | [FTA VAT rates](https://www.estv.admin.ch/en/vat-rates-switzerland) | Current normal rate 8.1% | Does not determine the seller's actual tax status |
| S16 | [FTA VAT liability](https://www.estv.admin.ch/en/vat-tax-liability) | Ordinary-business CHF100000 qualifying turnover threshold | Relevant domestic/foreign turnover, exemptions and voluntary registration matter |
| S17 | [SECO SME e-commerce obligations](https://www.kmu.admin.ch/en/statutory-obligations-swiss-and-european-e-commerce-laws) | Seller information and transparent mandatory price components | Launch requirements; legal terms for actual seller still needed |
| S18 | [Supabase pricing](https://supabase.com/pricing) | $0 tier, database limit, active project count, inactivity pause | Published allowance does not lift this organization's existing gateway restriction |
| S19 | [Cloudflare Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/) · page updated 2026-04-21 | Static requests free; Functions priced/limited separately | No account deployment or production availability proof |
| S20 | [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/) | Public tiles have usage/attribution/service constraints | Not a guaranteed unlimited free commercial API |
| S21 | [OSMF Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) | Public geocoder restrictions | No Nominatim integration in the prototype |
| S22 | [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp) | Default email restrictions and custom SMTP setup | Real email delivery remains unaccepted |
| S23 | [Stanford AI Index 2026: Economy](https://hai.stanford.edu/ai-index/2026-ai-index-report/economy) | Surveyed organizational AI adoption and early agent deployment | Aggregated studies, not all businesses or Synera customers |
| S24 | [University of Melbourne / KPMG trust study](https://kpmg.com/xx/en/media/press-releases/2025/04/trust-of-ai-remains-a-critical-challenge.html) · 2025 | 47-country survey distinguishes use from willingness to trust | Fieldwork Nov 2024–Jan 2025; no Synera-specific inference |

## Contradictions and excluded evidence

- Impact Hub's old `become-member` link redirected to events. Price was subsequently confirmed on S04; the old search snippet alone was not accepted.
- Boardy S02 describes free access while S01 offers Pro without a price. No invented price or promise of all features being free.
- Lunchclub's rendered text did not establish current pricing; no historical price was filled in.
- A 2021 chamber membership PDF appeared with a newer search publication label. It was not used as a current tariff.
- The SECO summary of EY was followed back to S07. Its sample is not a random estimate for all Swiss small businesses.
- Competitor testimonials, user totals, introductions and capital figures were not used to calculate Synera conversion or revenue.
- No user interview, purchase, commercial partnership, or private Gilbert correspondence was retrieved for this report. Search results are not substitutes for those evidence types.

## Local evidence

- Source base for this extension: local commit `c52e24b42667da85a1e08b4a57926f48d8bf4d35` on `codex/synera-documentation-refresh` plus the meeting-lab changes. Final validation is recorded in [VALIDATION.md](VALIDATION.md).
- Product/data boundaries: [architecture](../ARCHITECTURE.md), [launch state](../SUPABASE_LAUNCH.uk.md), [matching implementation](../../web_launch/matching.mjs), [financial model](../../web_launch/economics.mjs).
- A narrow search for the indicated correspondence returned no matching message; that does not establish that correspondence does not exist. The user was asked for the actual text/location and meeting date.
- Prior public research about a similarly named contact was used only to preserve the distinction between public claims and private agreements. It was not used to assign this Gilbert a company, role, architecture, ownership share or promise.
