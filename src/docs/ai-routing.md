# CV extraction and hybrid agent routing

## Model choice

Gemini 3.1 Flash-Lite is the default CV extraction and profile-summary model:
it accepts images/PDFs and supports structured output. Keep Gemini 3.8 Live
for a future voice interface: its Live API does not support structured outputs.
Gemma 4 31B is a candidate for deeper text reasoning; Gemma 4 26B A4B is a
candidate when inference throughput matters. No comparative CV benchmark has
been completed, so parameter counts are not claimed to prove accuracy.

The observed deployed graduate image upload eventually reached Review with
OCR spelling errors. The worker PDF upload reproduced the generic failure.
Changes send original scanned pages to vision before OCR, allow 8192 output
tokens for JSON/transcription, preserve explicitly configured Gemini model
IDs, exclude thinking parts from output, and stop cycling through six guessed
model names with retries. One explicitly configured fallback is allowed.
Missing image pages must not reuse the first page's transcript.

## Deployment configuration (server only)

```dotenv
AI_AGENT_ROUTING=gemini-only
RUNPOD_ENABLE_GENERATION=false
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_CV_MODEL=gemini-3.1-flash-lite
# GEMINI_API_KEY=<existing Google API credential>
# RUNPOD_API_KEY=<existing RunPod credential>
# RUNPOD_LLM_ENDPOINT_ID=<existing vLLM endpoint>
RUNPOD_LLM_MODEL=qwen/qwen3.5-27b
# RUNPOD_LIGHT_ENDPOINT_ID=<optional separate vLLM endpoint>
RUNPOD_LIGHT_MODEL=qwen/qwen3.5-9b
```

Testing defaults to Gemini for every application agent, even when RunPod
credentials exist. RunPod generation and worker probes are disabled. To activate
the reserved hackathon routing later, explicitly set BOTH AI_AGENT_ROUTING=hybrid
and RUNPOD_ENABLE_GENERATION=true. This may incur RunPod usage charges.
Do not put API keys in VITE variables or commit them.

| Agent | Provider | Model / task |
| --- | --- | --- |
| CV upload and CV improvements | Gemini | Flash-Lite; original-image reading and evidence extraction |
| Profiler | Gemini | Flash-Lite; sourced career profile |
| Holland | Gemini during testing | Flash-Lite; reserved RunPod Qwen light for hackathon |
| Fitter | Gemini during testing | Flash-Lite; reserved RunPod Qwen main for hackathon |
| Planner | Gemini during testing | Flash-Lite; reserved RunPod Qwen main for hackathon |
| SDG | Gemini during testing | Flash-Lite; reserved RunPod Qwen light for hackathon |
| Analyst | Gemini during testing | Flash-Lite; reserved RunPod Qwen main for hackathon |

Without a light endpoint, the light agents use the main RunPod endpoint/model.
Model IDs must match the worker's advertised /models response. Supplying these
settings does not create a RunPod worker or install a model. Existing deployment
credentials/endpoints are required. The code does not silently fall back from
RunPod analysis to Gemini; configuration failures remain visible.

Data Sources reads /api/ai/routing from the running server, showing the actual
configured provider/model for every agent. Credential presence is labelled
configured, not successful inference. Saved insights retain the actual response
model. RunPod source probes are disabled during testing; when enabled they probe
RunPod even if global AI_PROVIDER is Gemini. No deployment secrets were changed
by this source update.

References:
- https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live
- https://ai.google.dev/gemma/docs/core/model_card_4
- https://docs.runpod.io/serverless/vllm/overview
