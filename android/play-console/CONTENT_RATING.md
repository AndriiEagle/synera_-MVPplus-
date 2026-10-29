# Google Play content rating — чернетка 29.10.2026

**DRAFT / NEEDS_REVIEW. Фінального вікового рейтингу немає.** Нижче всі пропозиції з `content_rating` вихідної чернетки. Власник має відповісти у чинній анкеті IARC за реальною функціональністю та отримати її результат. Intended audience 18+ не означає автоматичний рейтинг 18+ і не замінює анкету.

Джерело та SHA-256: [SOURCES.json](../SOURCES.json). Офіційні правила: [content ratings](https://support.google.com/googleplay/android-developer/answer/9859655), [user-generated content](https://support.google.com/googleplay/android-developer/answer/9876937). Реальне блокування/скарги/модерацію, приватність профілів і платежі тут не прийнято.

## Questionnaire and store category

- **draft_answer**: Google Play category suggestion: Business. Select the IARC questionnaire type that matches the actual interaction features.
- **status**: NEEDS_REVIEW
- **notes**: Business positioning does not remove social-interaction or user-generated-content questions.

## User-generated content

- **draft_answer**: YES if users can publish profile text visible to others.
- **status**: NEEDS_REVIEW
- **notes**: Profile text is supplied as a feature; its publication and visibility need confirmation.

## User interaction and communication

- **draft_answer**: Provisionally YES for visible user profiles and collaboration interactions. Direct messaging, attachments and live communication are UNKNOWN.
- **status**: NEEDS_REVIEW
- **notes**: Answer each concrete question from the shipped feature set. Do not describe an unverified chat feature.

## Violence, sexual content, nudity, profanity, horror, drugs and gambling themes

- **draft_answer**: NO for developer-provided content, based on the described business product.
- **status**: DRAFT_NEEDS_CONTENT_REVIEW
- **notes**: Inspect actual copy, screenshots, icons, links and other supplied content. Handle user-generated content through the questionnaire's relevant UGC questions.

## Gambling, cash prizes and simulated gambling

- **draft_answer**: NO, based on the supplied scope.
- **status**: DRAFT_NEEDS_FEATURE_REVIEW
- **notes**: Business collaboration is not itself gambling. Confirm there are no contests, wagering or gambling integrations.

## Purchases and paid digital features

- **draft_answer**: NO for the initial pilot if purchases are disabled and no paid digital features are sold.
- **status**: DRAFT_NEEDS_BUILD_REVIEW
- **notes**: Future tier explanations are not active purchases. Reassess disclosures and rating descriptors before enabling payments.

## Location sharing

- **draft_answer**: NEEDS_REVIEW — optional meeting information is known; sharing a user's precise current location is not established.
- **status**: NEEDS_REVIEW
- **notes**: Check precision, visibility, device permissions and whether the field describes a venue or the user's location.

## Unrestricted internet access

- **draft_answer**: NO if Synera provides its defined service without a general browser or unrestricted browsing feature.
- **status**: NEEDS_REVIEW
- **notes**: Inspect actual navigation and embedded browsing. A TWA implementation alone does not settle this answer.

## Target audience

- **draft_answer**: Suggested intended audience: adults aged 18 and over running a business.
- **status**: NEEDS_REVIEW
- **notes**: Confirm the product's eligibility rules and configure the relevant audience settings. Intended audience, access restrictions and content rating are separate matters.

## Moderation and user protection

- **draft_answer**: UNKNOWN
- **status**: NEEDS_REVIEW
- **notes**: Verify terms acceptance, reporting, blocking and moderation appropriate to the actual UGC and interaction features. Do not answer that these controls exist without checking them.

## Final age rating

- **draft_answer**: NOT DETERMINED
- **status**: NEEDS_REVIEW
- **notes**: Use the rating returned by the completed current questionnaire. Do not promise Everyone, PEGI 3 or an Apple age rating from this draft.

