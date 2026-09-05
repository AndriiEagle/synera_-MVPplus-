# Review-ready support request — not sent

Destination: Supabase Support through the owner's authenticated dashboard.
Subject: Empty Free project blocked by HTTP 402 despite healthy database

Hello Supabase Support,

Please review the service restriction on our Free organization `acykwutodtrvoslhptae` and the new project `synera-demo` (`onwvsxgoxuuiopwnvvvy`, Frankfurt).

On 5 September 2026, a read-only request to `/auth/v1/settings` still returned HTTP 402. Earlier checks reported `exceed_db_size_quota` and the dashboard showed services restricted. Today, the Management API reports the project as ACTIVE_HEALTHY, SQL is accessible, and read-only counts show 0 Auth users, 0 profiles and 0 meeting requests. The database currently reports 10,816,659 bytes.

Could you confirm whether this is a historical organization-level quota restriction, what action is required to restore Auth and REST on the Free plan, and whether you can review/recalculate the restriction? Please do not upgrade our plan, disable spending protections, delete data, or change the three older projects. We are preparing a small two-person pilot and need working authentication before opening registration.

Thank you.

---
This draft contains project/organization identifiers and service diagnostics only. No passwords, API keys or user records are included. Sending requires the owner's exact approval under AGENTS.md.
