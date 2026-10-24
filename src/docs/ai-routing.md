# AI service inventory and routing

Reviewed: 24 October 2026. Source of truth: `src/lib/agent-routing.ts` and `GET /api/ai/routing` in the API server.

## Eight routed AI roles

| Route identity | Actual use | Retrieved context / entry point | Tier |
| --- | --- | --- | --- |
| `cv` | Uploaded CV extraction and optional CV improvements | CV text/images and local O*NET skill references; `lib/cv-retrieval.ts`, profile insights | light |
| `holland` | Holland explanation, employer employee summary, translation utility | Fixed questionnaire scores plus reviewed CV fields; `routes/profiles.ts`, employee summary, `lib/agents.ts` | light |
| `profiler` | Explain profile strengths and constraints | Saved profile, occupations and market context; profile insights | main |
| `fitter` | Explain ranked career matches | Deterministic role scores, gaps, course availability; profile insights | main |
| `planner` | Explain a learning timeline | Existing course plan and constraints; profile insights | main |
| `sdg` | Explain thematic SDG links | Supplied role/course targets; profile insights | light |
| `analyst` | Market outlook, outlook questions, Company Future analysis | Stored labour/AI snapshots, reviewed projections/news for public outlook; organisation learning and exposure snapshot for company analysis | main |
| `company_advisor` | Employer follow-up chat after Company Future analysis | Same account's saved analysis, anonymous company snapshot, up to six recent saved turns, up to six relevant available course references | main |

These are bounded, application-orchestrated AI workflows, not eight autonomous agents that browse, execute tools or take actions. CV extraction and CV advice share one route. Employee summaries share Holland; public market and company analyses share Analyst. Translation is a utility, not an extra agent. Other roles can remain registered for optional insights even when a streamlined UI does not expose their buttons.

Holland scoring, role ranking, skill-gap calculation, course scheduling, vacancy matching, SDG mapping rules and slider scenario formulas are deterministic code. AI explains supplied results; it does not produce verified future measurements or certify employee ability.

## Company Advisor retrieval, privacy and caching

- Employer-authenticated endpoints: `POST /api/enterprise/future/analysis`, `GET /api/enterprise/future/chat?analysisId=…`, `POST /api/enterprise/future/chat`.
- Analysis returns its saved prediction ID. Chat requires that exact analysis, the same account, matching 1–10-year horizon and a current company-input fingerprint. Stale analyses return 409, unrelated account IDs return 404.
- Retrieval starts from organisation-scoped database data and available course suggestions. A bounded keyword relevance pass ranks those course references for the question. It is not internet-wide or vector retrieval. Course titles and links must come from this context; missing evidence is declared.
- Prompts omit employee names, IDs and raw CVs. Supplied profile text, questions and source text are untrusted data. Prior turns are loaded from owned database rows, not client-submitted chat history. Company-only recommendations exclude hiring/dismissal decisions and employee rankings.
- Every response contains EN/BM/Simplified Chinese in one provider request. Switching language displays the saved translation and sends no generation request.
- Existing `predictions` rows store replies, references, analysis ID and parent turn. No new tables or migrations. Concurrent identical questions are locked and cached by account, analysis fingerprint, parent and question. History returns the latest 40 turns; the prompt uses at most six recent turns. A new question is an on-demand AI request and uses the existing user AI request limiter.
- The UI shows chat only after analysis. Moving a slider changes local scenario values, not a company AI call. Changing company data/year hides the old result until the corresponding analysis is generated or retrieved again.

## Testing configuration

```dotenv
AI_AGENT_ROUTING=gemini-only
RUNPOD_ENABLE_GENERATION=false
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_CV_MODEL=gemini-3.1-flash-lite
# GEMINI_API_KEY=<server credential; never commit>
# RUNPOD_API_KEY=<reserved server credential>
# RUNPOD_LLM_ENDPOINT_ID=<reserved vLLM endpoint>
RUNPOD_LLM_MODEL=qwen/qwen3.5-27b
# RUNPOD_LIGHT_ENDPOINT_ID=<optional separate endpoint>
RUNPOD_LIGHT_MODEL=qwen/qwen3.5-9b
```

All eight routes use Gemini during normal testing. RunPod is disabled, with no generation or worker probes. Explicit hybrid routing plus `RUNPOD_ENABLE_GENERATION=true` is required to activate the reserved Holland/SDG light and Fitter/Planner/Analyst/Company Advisor main routes. CV and Profiler remain Gemini in that hybrid policy. Without a light RunPod endpoint, light routes use its main endpoint. No deployment credentials were changed by this update.

Global `AI_PROVIDER` overrides routing and `AI_TEST_MODE` can select the test engine. Public routing metadata reports the configured service/model, not proof that inference succeeded; saved response rows retain the responding model. API credentials are private service access, not public datasets.

## Slider semantics

- AI scenario: `100 × (1 − (1 − observedExposure) × 0.95^years)`; unknown stays unknown.
- Career growth scenario: compound the supplied reviewed ten-year growth over the chosen horizon; not a Malaysian vacancy forecast.
- Skills priority scenario: reviewed baseline index × `1.05^years`; an assumption, not a measured shortage.
- Current coverage, skill gaps and completions remain current observations. Company Future displays current exposure separately from the selected-year scenario. Year badges, changed-value colour/motion and graph markers share the selected horizon; reduced-motion preferences are respected.

## Verification

`enterprise.test.ts` checks organisation/account boundaries, saved translation reuse, concurrent chat caching, references, history and stale snapshot/horizon rejection with a mocked model provider. `agent-routing.test.ts` checks eight distinct identities and Gemini-only testing. No AI credits are needed for these tests.
