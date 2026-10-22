# Interest, course and employer audit — 23 October 2026

## Findings and decisions

Skilytics uses CV evidence, occupational interests, skill gaps and learning
pathways to support career exploration and reskilling. Its individual users
include workers and graduates; organisational users are employers and educators.
The API role identifier remains `hr` to preserve accounts and organisation
access rules. Its displayed name is Employer / Majikan / 雇主. Its people tab is
Employees / Pekerja / 员工.

### Interest instrument

O*NET offers a 30-item Mini-IP and a 60-item Short Form. Both deliberately span
different occupations. Narrowing interests to AI or software would bias results
and exclude practical, creative, social, commercial and administrative work.

The previously installed Mini-IP faithfully included its specific examples
(kitchen cabinets, chemical experiments, mail sorting), but lacked instructions
to imagine enjoying unfamiliar activities independently of existing skills,
education and pay. These examples were difficult to relate to this app.

The current 30 items adapt the six O*NET activity domains to broadly familiar
workplace tasks, retaining five items per domain and five response options.
All items must be answered. English, Malay and Mandarin versions express the same
activity. The questionnaire measures preferences, not CV skills or employability.

| Domain | O*NET activity example | Skilytics contextual activity |
| --- | --- | --- |
| Realistic | Assemble electronic parts | Install and test electrical or electronic components |
| Investigative | Conduct chemical experiments | Run experiments to test an idea |
| Artistic | Write scripts for movies or television shows | Write stories, articles or scripts |
| Social | Give career guidance to people | Guide someone who is choosing a career or course |
| Enterprising | Negotiate business contracts | Negotiate an agreement with a supplier or customer |
| Conventional | Keep shipping and receiving records | Maintain accurate stock and delivery records |

This is a Skilytics contextual screener, **not the validated O*NET Mini-IP**.
Neither adaptations nor translations have independent psychometric validation.
Research validation remains outstanding; software tests do not establish
psychometric validity. Content attribution and the Tools Developer License are
shown with the assessment. USDOL/ETA has not approved, endorsed or tested changes.
IDs 201–230 prevent reuse of previous instrument answers. Old scores are withheld
from resumed onboarding and interest matching until the current set is completed.
Scores remain area averages on the app's 1–5 scale with deterministic RIASEC
ordering for ties; they are not externally computed O*NET scores.

References:
- https://www.onetcenter.org/IP.html
- https://www.onetcenter.org/dl_files/Mini-IP.pdf (Appendix A)
- https://www.onetcenter.org/dl_tools/ipsf/Interest_Profiler.pdf
- https://www.onetcenter.org/license_tools.html

### Course data

Previously the public catalogue read the database seed, including estimated
prices and generic provider landing pages. The source health check reported
success without actually verifying course content. Plans were always returned
without items, even when courses were available.

The public catalogue and planner now read Microsoft Learn's public learning-path
catalogue, using provider titles, exact course URLs and published durations.
The inspected response contained 833 paths; 482 matched this app's skill taxonomy
and had valid HTTPS learning-path URLs and positive durations. IDs are stable
hashes of provider UIDs; all 482 IDs were distinct in this response.

Self-paced Microsoft Learn content is free. Credential examinations and
certificates are not included and are not advertised as free certification.
Skill links are editorial matches of the provider title/summary against existing
skill aliases. They are not Microsoft certifications of skill attainment.

Refresh happens on demand and through the existing six-hour source scheduler.
Concurrent requests share one fetch. After cache expiry a failed refresh returns
no courses, with retries limited to once per minute; expired seed prices are
never substituted. Browser lists re-fetch every five minutes. Health metadata
uses the actual provider fetch timestamp.

This is a six-hour refreshed provider catalogue, not an instantaneous guarantee
that an external page can never move. The legacy public Microsoft endpoint
responded successfully during verification. Microsoft's newer Platform API
requires application onboarding and authentication; its future migration needs
provider credentials. OpenLearn's catalogue was investigated but automated
access returned a challenge, so no unsupported scraper was added. Other
providers' old seed entries remain isolated to the explicit demo loader.

Plans expose items only while their stable IDs and exact URLs remain in the
current catalogue. Entirely current plans expose totals; partially outdated
plans withhold totals and return the affected skills as uncovered.

References:
- https://learn.microsoft.com/api/catalog/?locale=en-us&type=learningPaths
- https://learn.microsoft.com/en-us/training/support/integrations-learn-platform-api-catalog
- https://www.open.edu/openlearn/free-courses/full-catalogue

### SDG and funding

Courses carry an ordered target list. First is the main theme; subsequent
targets are related themes. Default target 4.4 reflects vocational learning;
explicit sustainability education maps to 4.7, climate/carbon to 13.3, energy
to 7.3, waste/recycling to 12.5, entrepreneurship to 8.3, accessibility to
10.2, and technological productivity to 8.2. These are conservative editorial
associations, not provider claims or measured impact.

Official complete UN goal icons are stored locally, with translated accessible
labels. English artwork is retained because Malay artwork is not an official
UN release. Attribution is in `public/sdg/NOTICE.md`; course pages state that
the UN has not approved the content. Primary and related target labels support
all three interface languages.

HRD Corp controls and badges are employer-only. API creation/updates and planner
funding also enforce the employer role. A company icon identifies the HRD
badge without implying use of an unverified corporate logo. No current live
course has verified HRD claimability; unknown claims never make a course
automatically funded.

Icon source and guidelines:
https://www.un.org/sustainabledevelopment/news/communications-material/
