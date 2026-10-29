# Google Play Data safety — чернетка 29.10.2026

**DRAFT / NEEDS_REVIEW. Не подавати без перевірки реального релізу та схвалення Андрія.** Нижче збережено всі відповіді та застереження вихідної чернетки, а не висновки аудиту. TWA охоплює дані контрольованої PWA і підключених сервісів. Встановлення оболонки не прибирає цієї відповідальності.

Джерело: STORE-listing-and-TWA.json, `data_safety`; SHA-256 у [SOURCES.json](../SOURCES.json). Правила перевірені за [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469) і [видалення акаунтів](https://support.google.com/googleplay/android-developer/answer/13327111). Поля Console треба звірити на момент подання.

Перед заповненням: інвентаризувати фактичні реєстрацію/профілі, auth IDs, логи, optional AI, аналітику, локацію, усі SDK/процесори та передачі; підтвердити HTTPS усіх потоків; перевірити in-app видалення і публічний deletion URL. Neon USA і Cloudflare нижче — твердження чернетки, конфігурацію та договори тут не перевірено. Відсутність реклами не доводить відсутність трекінгу. Відповіді мають описувати всі версії та регіони, охоплені декларацією.

## Submission scope

- **answer**: DRAFT — do not submit unchanged.
- **status**: NEEDS_REVIEW
- **notes**: These answers use only the supplied product facts. Include collection through the PWA, authentication, hosting, SDKs and third-party services reached through the TWA. A wrapper does not make the website's collection disappear. Exact current Play Console labels were not checked.

## Does the app collect user data?

- **answer**: YES
- **status**: SUPPORTED_BY_TASK_INPUT
- **notes**: Email, name, profile text and consent records are provided as collected data. Meeting location is optional.

## Email

- **play_data_type**: Personal info > Email address
- **collected**: YES
- **shared**: NEEDS_REVIEW — apply the processor and user-initiated transfer assessment below.
- **purposes**: Account management; App functionality
- **required_or_optional**: NEEDS_REVIEW — required only if the actual registration flow requires email.
- **ephemeral_processing**: NO if stored in the account database.
- **status**: DRAFT_NEEDS_FLOW_CONFIRMATION

## Name

- **play_data_type**: Personal info > Name
- **collected**: YES
- **shared**: NEEDS_REVIEW — check visibility to other users and processor exceptions.
- **purposes**: App functionality; Account management, if used for the account
- **required_or_optional**: NEEDS_REVIEW — inspect whether registration or profile completion requires it.
- **ephemeral_processing**: NO if stored in the profile.
- **status**: DRAFT_NEEDS_FLOW_CONFIRMATION

## Profile text

- **play_data_type**: App activity > Other user-generated content
- **collected**: YES
- **shared**: NEEDS_REVIEW — check profile publication and the user-initiated transfer exception.
- **purposes**: App functionality
- **required_or_optional**: NEEDS_REVIEW
- **ephemeral_processing**: NO if saved in the profile.
- **status**: NEEDS_REVIEW
- **notes**: This is the proposed mapping for free-form profile content. Separately classify structured personal information contained in additional profile fields. Do not assume the free-text category covers every field.

## Optional meeting location

- **play_data_type**: Location > Approximate location and/or Precise location, depending on actual content and precision
- **collected**: YES when the user provides it.
- **shared**: NEEDS_REVIEW — depends on who can see the meeting location.
- **purposes**: App functionality
- **required_or_optional**: OPTIONAL
- **ephemeral_processing**: NEEDS_REVIEW — depends on storage and retention.
- **status**: NEEDS_REVIEW
- **notes**: Confirm whether this means a city, venue, street address or device coordinates, and whether it describes the user's location. A city-level field and an exact address need different classification. Manual entry does not prove that location data is absent. No GPS permission or background tracking is established by the supplied facts.

## Consent records

- **play_data_type**: Proposed: Personal info > Other info for account-linked consent choices; verify the actual record schema.
- **collected**: YES
- **shared**: NEEDS_REVIEW — processor assessment required.
- **purposes**: Fraud prevention, security and compliance, where records document compliance; App functionality, where records enforce user preferences
- **required_or_optional**: NEEDS_REVIEW — distinguish essential records from optional consents and their records.
- **ephemeral_processing**: NO if retained as records.
- **status**: NEEDS_REVIEW
- **notes**: Inventory timestamps, account IDs, IP addresses and other metadata separately. Do not turn optional processing consent into a mandatory consent merely because the choice is recorded.

## Backend and service-provider transfers

- **answer**: Neon stores data in the USA according to the task. Cloudflare also processes data; its precise services, logs, locations and contractual role remain unverified.
- **play_shared_answer**: NEEDS_REVIEW
- **status**: NEEDS_REVIEW
- **notes**: Google Play's service-provider exception may exclude qualifying processor transfers from the form's definition of sharing. Confirm actual contracts and uses before selecting NO. International processing still belongs in the privacy disclosure even when a Play sharing exception applies.

## Profiles and meeting details shown to other users

- **answer**: NEEDS_REVIEW
- **status**: NEEDS_REVIEW
- **notes**: Document what is public, what is member-only and what is sent to selected people. Assess the user-initiated transfer exception against the actual flow and disclosures. Do not infer that all publication is exempt or that all account data is public.

## Advertising, sale and tracking

- **contains_ads**: NO, according to the task.
- **data_sale**: NO, according to the task.
- **advertising_or_marketing_data_purpose**: Do not select unless an actual integration or use requires it.
- **cross_service_tracking**: NEEDS_REVIEW
- **status**: PROVIDED_FACTS_NOT_AUDITED
- **notes**: No ads and no sale do not independently establish that analytics, identifiers or tracking are absent.

## Encryption in transit

- **answer**: NEEDS_REVIEW — do not select YES without verification.
- **status**: NEEDS_REVIEW
- **notes**: Verify all collection and transfer paths, including authentication, database connections, uploads, third-party requests and redirects. An HTTPS landing page alone is insufficient.

## Account and data deletion

- **answer**: NEEDS_REVIEW
- **status**: NEEDS_REVIEW
- **notes**: If account creation is available, prepare the required discoverable in-app deletion route and a public web deletion-request URL. Verify deletion propagation to processors, backups and any retained compliance records. Publish retention periods and justified exceptions; do not promise immediate total deletion without evidence.

## Additional data inventory

- **answer**: UNKNOWN — not established as absent.
- **status**: NEEDS_REVIEW
- **inspect**: Authentication and generated user IDs; Cloudflare access and security logs; IP addresses and device or browser identifiers; Analytics, diagnostics and crash reports; Cookies, local storage and session identifiers; Messages, attachments, notifications and contact information if implemented
- **notes**: Declare only data actually collected. Classify IP-derived location if location is actually derived; do not invent location processing from the existence of an IP address.

