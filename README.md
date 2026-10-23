<div align="center">

  <!-- Project Logo -->
  <img src="./Skilytics-removebg-preview.png" alt="Skilytics Logo" width="180" height="180" />

  # 🚀 Skilytics (Skilytic)
  ### **AI-Powered Future-Ready Workforce & Career Reskilling Platform**
  *Bridging the gap between "Who I am today" and "Where I can be in the AI Era"*

  [![Live Demo](https://img.shields.io/badge/🌐_Live_Website-skilytics.vercel.app-802424?style=for-the-badge)](https://skilytics.vercel.app/)
  [![Domain](https://img.shields.io/badge/Domain_1-Aiversecity_Workforce-d4af37?style=for-the-badge)](#)
  [![UN SDGs](https://img.shields.io/badge/UN_SDGs-4_%7C_8_%7C_9-007dbc?style=for-the-badge)](#🌍-alignment-with-un-sustainable-development-goals-sdgs)
  [![License](https://img.shields.io/badge/License-Permissive_Open_Source-2ea44f?style=for-the-badge)](#📜-third-party-licenses--attributions)

  <p align="center">
    <a href="#-project-description">Description</a> •
    <a href="#-key-specialties--must-have-features">Features</a> •
    <a href="#️-environment-requirements-env">Environment (.env)</a> •
    <a href="#-how-to-use-skilytics-step-by-step-guide">How to Use</a> •
    <a href="#️-architecture--technology-stack">Tech Stack</a> •
    <a href="#-third-party-licenses--attributions">Licenses</a>
  </p>
</div>

---

## 📖 Project Description

### **The Problem We Solve**
AI is transforming industries faster than traditional training programmes and educational curricula can adapt. While over 56% of professionals in Malaysia already use AI tools at work, only 26% have received formal training, leaving more than 600,000 workers in need of reskilling within the next three to five years. Workers are unsure which skills to learn, employers struggle to identify which roles to train their teams for, and static learning lists quickly become obsolete.

### **Our Solution: Skilytics**
**Skilytics** is a human-centred, AI-powered career analytics and workforce reskilling platform created for the **Aiversecity Future-Ready Workforce Domain (Domain 1)**. Positioning AI as a collaborative partner rather than a replacement for human judgement, Skilytics continuously tracks AI advancements and labour market signals to predict emerging and declining skills, match individuals to future-proof roles, and generate actionable, personalised reskilling pathways tied directly to the **17 UN Sustainable Development Goals (SDGs)**.

### **Who Skilytics Is Built For**
1. **👩‍💻 Working Adults & Career Switchers:** Individuals at risk of job displacement or seeking a career pivot with transparent, step-by-step guidance and skill-gap breakdowns.
2. **🎓 Students & Fresh Graduates:** Emerging talent looking to understand their natural work preferences and build high-demand skills before entering the job market.
3. **🏢 HR & Learning & Development (L&D) Managers:** Corporate leaders planning company-wide reskilling strategies, tracking employee skill gaps, and monitoring team AI exposure.
4. **🏫 TVET & University Career Centres:** Educators and career advisors upgrading their curriculum structures and guiding students toward sustainable, high-growth career pathways.

---

## ✨ Key Specialties & Must-Have Features

* **🧠 Explain Like I'm 5 (ELI5) AI Reasoning Engine:** Complex labour statistics, skill gaps, and psychometric intersections are translated into friendly, easy-to-understand **ELI5 explanations**—ensuring every user understands *why* a career path or learning plan is recommended for them.
* **📄 Multi-Modal Skills Profile Intake (CV + RIASEC):** Combines automated OCR/PDF resume parsing with the scientifically validated **Holland Code (RIASEC)** psychometric test, synthesised by AI to form a holistic profile of both technical capability and personal work preferences.
* **📡 Live AI-Trend Signal Layer & Market Pulse:** Integrates real-time, citable public data sources—displaying unemployment & participation rates, labour force trends, AI usage by role, and most AI-exposed roles.
* **🎯 Explainable Future-Role Matching & Skill Mapping:** Ranks best-fit future roles with transparent match scores, visual radar skill maps, and handling of future uncertainty (modelling moderate vs. fast AI disruption scenarios).
* **🗺️ Personalised Reskilling Pathways:** Generates ordered, time-bound learning plans tailored to the user's weekly study hours and budget constraints, utilizing accessible online courses and HRD Corp-claimable programmes.
* **🌍 Meaningful UN SDG Mapping:** Tags every recommended role and skill to relevant UN Sustainable Development Goals (**SDG 4** Quality Education,**SDG 8** Decent Work & Economic Growth, **SDG 9** Industry and Innovation & Infrastructure.
* **🏆 Gamified Workspace & Certification:** Tracks learning milestones, awards skill badges/achievements, and generates a verifiable **Certificate of Accomplishment** upon course completion.

---

## ⚙️ Environment Requirements (`.env`)

Before running the application locally or deploying backend services, ensure you configure your environment variables. Create a `.env` file in the root directory and populate it with the following configuration:

```env
# ==========================================
# Database Configuration (PostgreSQL)
# ==========================================
DATABASE_URL="your_postgres_database_url_here"
DATABASE_URL_UNPOOLED="your_unpooled_postgres_database_url_here"

# ==========================================
# Server Configuration
# ==========================================
PORT=5000
NODE_ENV=development
LOG_LEVEL=info

# ==========================================
# Authentication & Session Security
# ==========================================
SESSION_SECRET="your_session_secret_here"

# ==========================================
# AI & LLM Inference Configuration (RunPod)
# ==========================================
RUNPOD_API_KEY="your_runpod_api_key_here"
RUNPOD_LLM_ENDPOINT_ID="your_runpod_llm_endpoint_id_here"
RUNPOD_LLM_MODEL="your_runpod_llm_model_name_here"
RUNPOD_LIGHT_ENDPOINT_ID="your_runpod_light_endpoint_id_here"
RUNPOD_LIGHT_MODEL="your_runpod_light_model_name_here"

# ==========================================
# Google Generative AI Configuration (Gemini)
# ==========================================
GEMINI_API_KEY="your_gemini_api_key_here"
```

### Environment Variable Descriptions

The table below describes each required variable, sorted alphabetically to align with the deployment configuration:

| Variable Name | Required | Default / Example | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host/db?sslmode=require` | Pooled PostgreSQL connection string (Neon Serverless PostgreSQL) used for application-level data queries through Drizzle ORM. |
| `DATABASE_URL_UNPOOLED` | Yes | `postgresql://user:pass@host/db?sslmode=require` | Direct (unpooled) PostgreSQL connection string dedicated to running database schema migrations and direct management commands. |
| `GEMINI_API_KEY` | Yes | `AIzaSy...` | Google Gemini API key (`@google/genai`) utilized for resume parsing, document understanding, and structured skill extraction. |
| `LOG_LEVEL` | No | `info` | Logging verbosity level for the Pino logging service (options: `fatal`, `error`, `warn`, `info`, `debug`, `trace`). |
| `NODE_ENV` | No | `development` | Target execution runtime environment (`development`, `test`, or `production`). |
| `PORT` | No | `5000` | Local or containerized TCP port on which the Express application server listens for incoming HTTP traffic. |
| `RUNPOD_API_KEY` | Yes | `rpa_...` | Authentication token used to authorize requests against RunPod Serverless GPU endpoints. |
| `RUNPOD_LIGHT_ENDPOINT_ID` | Yes | `vllm-xxxxxx` | RunPod serverless endpoint identifier designated for fast, low-latency reasoning and lighter language model tasks. |
| `RUNPOD_LIGHT_MODEL` | Yes | `meta-llama/Llama-3.2-3B-Instruct` | Model checkpoint identifier loaded on the lightweight RunPod serverless worker. |
| `RUNPOD_LLM_ENDPOINT_ID` | Yes | `vllm-yyyyyy` | Primary RunPod serverless endpoint identifier assigned for complex analytical reasoning, career path synthesis, and deep evaluations. |
| `RUNPOD_LLM_MODEL` | Yes | `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B` | Primary large language model checkpoint identifier deployed on the main RunPod compute worker. |
| `SESSION_SECRET` | Yes | `generate-a-strong-random-key` | High-entropy cryptographic string used to sign, verify, and secure HTTP session cookies against tampering. |

---

## 🧭 How to Use Skilytics (Step-by-Step Guide)

You can access the live platform directly at **[https://skilytics.vercel.app/](https://skilytics.vercel.app/)**. 

> 💡 **Note on Saving Progress:** You can explore the intake and analytics tools immediately, but to **save your assessment results, track your workspace progress, and claim certificates**, make sure to **Sign Up / Log In** with an account!

### 👤 Portal 1: For Workers, Career Switchers, Students & Graduates

```
[1. Upload CV] ➔ [2. Goals & Budget] ➔ [3. RIASEC Test] ➔ [4. AI ELI5 Synthesis] ➔ [5. Role Match & Skill Map] ➔ [6. Custom Pathway] ➔ [7. Workspace & Certificate]
```

1. **Step 1: CV Upload & AI Interpretation**
   * Upload your CV/Resume (supports PDF or scanned image formats).
   * Our AI and OCR engine (`PDF.js` & `Tesseract.js`) automatically extracts your work history, education, and existing skills.
   * **Review & Confirm:** Inspect the extracted details and edit or confirm their accuracy before proceeding.
2. **Step 2: Set Learning Goals & Plan Constraints**
   * Define your personal career objectives (e.g., transitioning industries, upskilling in your current role, or entering the workforce).
   * Input your practical constraints, including your **allocated weekly study time** (hours/week) and your **training budget**.
3. **Step 3: Complete the Holland Code (RIASEC) Questionnaire**
   * Answer an interactive psychometric questionnaire covering the six RIASEC dimensions (*Realistic, Investigative, Artistic, Social, Enterprising, Conventional*) to uncover the work environments and skill types that naturally suit you.
4. **Step 4: AI Synthesis & Final Intake Summary (with ELI5 Explanations)**
   * View your Holland Code results alongside a **special AI synthesis feature** that merges your past experience (CV) with your personality profile (RIASEC).
   * Read the **Final Intake Summary**, powered by our **ELI5 ("Explain Like I'm 5") AI engine**, which breaks down your strengths and career readiness in plain, jargon-free language.
5. **Step 5: Explore Suggested Career Paths & Your Skill Map**
   * Receive ranked future career recommendations complete with explainable match scores, SDG tags, and AI disruption scenarios.
   * Inspect your interactive **Skill Map** (radar and competency charts) comparing your current skill levels against the target requirements of your chosen role.
6. **Step 6: Customise Your Reskilling Plan & Timeline**
   * Review curated course recommendations specifically selected to bridge your identified skill gaps.
   * Adjust your **learning timeline** and **weekly training investment** (time and cost).
   * Read transparent **AI explanations on why you should choose the suggested plan**, detailing how each module maximizes ROI for your career transition.
7. **Step 7: Track Progress in Workspace, Earn Achievements & Get Certified**
   * Save your chosen pathway to your personal **Workspace**.
   * Track your ongoing course modules, unlock **Learner Achievements / Badges**, and upon completing your courses, receive an official **Certificate of Accomplishment** to celebrate your milestone!
8. **Step 8: Explore Role Library, Course Catalogue, Market Pulse & Data Sources**
   * **Role Library:** Browse comprehensive job profiles across diverse economic sectors.
   * **Courses:** Explore the full catalogue of free, low-cost, and claimable training programmes.
   * **Market Pulse:** Analyze live macroeconomic and AI indicators, including:
     * *Unemployment & Participation Rates*
     * *Labour Force Trends*
     * *AI Usage by Role*
     * *Most AI-Exposed Roles*
   * **Data Sources:** Inspect the transparent documentation of all AI services, open datasets, and catalogues powering the platform, including clear explanations of how each data source operates.

---

### 🏢 Portal 2: For Employers, HR Managers & Educators (TVET / Universities)

Switch to the **Employer & Educator Portal** to manage organisational reskilling and curriculum alignment:

1. **Step 1: Company & Institution Dashboard Overview**
   * Access a dedicated macro-view built for your company, department, or academic cohort.
   * Instantly monitor **AI Exposure by Team Member**, identify **Top Organisational Skill Gaps**, view aggregated **RIASEC Interest Profiles**, and discover **Recommended Courses for Common Gaps**.
2. **Step 2: Employee / Student Roster Management & Tracking**
   * Navigate to the **Employee / Talent Tracking Section** to view individual profiles, skill readiness, and active reskilling progress.
   * **Add New Members:** Easily onboard new employees or students to the portal to evaluate their skills and assign targeted training pathways.
3. **Step 3: Curriculum & L&D Strategy Alignment**
   * Leverage the shared **Course Catalogue**, **Market Pulse** (unemployment trends, AI exposure by role, labour force shifts), and **Data Sources** to restructure corporate training programs or modernize university/TVET curricula in step with real-world industry demand.

---

## 🛠️ Architecture & Technology Stack

### **System Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (FRONTEND)                        │
│     React 18 + Vite 6 + Tailwind CSS + Radix UI + Recharts + Wouter     │
│        (Hosted on Vercel | Captures CV, Goals & RIASEC Responses)       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ REST API / Type-Safe Orval Client
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API SERVER                             │
│              Node.js 20 + Express.js + Zod + Pino Logger                │
│     (Hosted on Render | Routing, Auth, Evaluation & Market Queries)     │
└───────────────┬───────────────────────────────────────┬─────────────────┘
                │                                       │
                ▼                                       ▼
┌───────────────────────────────────┐   ┌─────────────────────────────────┐
│        AI MODEL & OCR LAYER       │   │          DATABASE LAYER         │
│ • RunPod Serverless LLMs (Python) │   │ • Drizzle ORM + node-postgres   │
│ • Google Gemini SDK (@google/genai│   │ • Neon Serverless PostgreSQL    │
│ • Tesseract.js & PDF.js (CV Parse)│   │   (Profiles, Skills & Catalog)  │
└───────────────────────────────────┘   └─────────────────────────────────┘
```

* **User Interface (Frontend):** A React single-page application built with Vite (`src/artifacts/reskill-ai`) that captures user interactions, profile configurations, and RIASEC assessment responses.
* **Backend API:** A Node.js Express server that processes client REST requests, handling routing, authentication, and core evaluation logic.
* **AI Model / API:** Interacts with AI agent services (`src/artifacts/api-server/src/lib/llm.ts`) via RunPod and Google Gemini to process CVs, evaluate skill gaps, and generate AI-driven ELI5 career recommendations.
* **Database Layer:** Managed via Drizzle ORM (`src/lib/db`) connected to a Neon Serverless PostgreSQL database, storing user profiles, skill matrices, and course catalog items.
* **Cloud Hosting:** Cloud infrastructure deployed via **Render** (`render.yaml`) for backend deployment and **Vercel** (`vercel.json`) for frontend hosting.

### **Languages, Frameworks & Libraries**

| Name & Version | Purpose in Project | License |
| :--- | :--- | :---: |
| **TypeScript** `(v5.x)` | Primary programming language used across both frontend and backend for type-safe application development. | Apache 2.0 |
| **Node.js** `(v20.x)` | Runtime environment powering the backend API server, automated build scripts, and local developer environment. | MIT |
| **Python** `(v3.10+)` | Scripting language used for model testing, sending structured inference requests to RunPod, and data validation. | PSF License |
| **React** `(v18.x)` | Frontend library for building the interactive user interface, assessment workflows, and dashboard components. | MIT |
| **Vite** `(v6.x)` | Frontend tooling and development server providing fast bundling and hot-module replacement. | MIT |
| **Tailwind CSS** `(v3.x)` | Utility-first CSS framework used for styling responsive, modern user interface layouts. | MIT |
| **Radix UI / Shadcn UI** `(Latest)` | Unstyled, accessible component primitives used to construct dialogs, tabs, progress bars, and forms. | MIT |
| **Lucide React** `(v0.x)` | Icon library providing consistent vector icons across the platform interface. | ISC |
| **TanStack React Query** `(v5.x)` | Asynchronous state management library handling API data caching, background fetching, and server state synchronization. | MIT |
| **Express.js** `(v4.x)` | Minimalist backend web framework routing API requests for CV processing, user profiling, and market data queries. | MIT |
| **Zod** `(v3.x)` | Schema declaration and validation library enforcing structured, type-safe inputs and outputs for API routes and AI payloads. | MIT |
| **Orval** `(v7.x)` | OpenAPI code generator creating type-safe TypeScript React Query hooks and fetch clients directly from OpenAPI specs. | MIT |
| **Drizzle ORM** `(v0.x)` | TypeScript Object Relational Mapper used for database schema declaration, migrations, and type-safe database queries. | Apache 2.0 |
| **Neon Serverless SDK** `(@neondatabase/serverless)` | Serverless PostgreSQL driver connecting the backend to cloud Neon database instances via WebSockets/HTTP. | Apache 2.0 / MIT |
| **Google Generative AI SDK** `(@google/genai)` | Client SDK for interacting with the Gemini API to execute resume parsing, interest extraction, and career reasoning. | Apache 2.0 |
| **Tesseract.js** `(v7.x)` | Primary OCR engine to extract text from image/scanned CV files (scanned images like JPEG/PNG). | Apache 2.0 |
| **PDF.js** `(pdfjs-dist & unpdf)` `(v4.x / v1.x)` | Extracts text, structure, and metadata from PDF-formatted CV files. | Apache 2.0 |
| **Recharts** `(v2.x)` | Generates interactive data visualizations, radar charts (6 competency scores), and analytics charts in the dashboard. | MIT |
| **Framer Motion** `(v12.x)` | Handles micro-animations, score card transitions, and smooth UI interactivity. | MIT |
| **Wouter** `(v3.x)` | Client-side routing library used for frontend page navigation. | MIT |
| **node-postgres (`pg`)** `(v8.x)` | The actual driver that connects the Node.js backend directly to the Neon Postgres database. | MIT |
| **Pino & Pino-HTTP** `(v9.x)` | High-performance logging system for backend error monitoring and request auditing. | MIT |

---

## 📜 Third-Party Licenses & Attributions

This project relies on open-source libraries under permissive licenses. We gratefully acknowledge the creators and maintainers of the following ecosystems:

* **MIT License:**
  * `React`, `Vite`, `Express`, `Tailwind CSS`, `TanStack Query`, `Radix UI`, `Zod`, `Orval`, `Node.js`, `Recharts`, `Framer Motion`, `Wouter`, `node-postgres (pg)`, `Pino & Pino-HTTP`.
* **ISC License:**
  * `Lucide React`.
* **Apache License 2.0:**
  * `TypeScript`, `Drizzle ORM`, `Tesseract.js`, `PDF.js (pdfjs-dist & unpdf)`, `Google Generative AI SDK (@google/genai)`, `Neon Serverless SDK`.
* **PSF License (Python Software Foundation):**
  * `Python`.

---

<div align="center">
  <p>Built with ❤️ for the <b>Aiversecity Future-Ready Workforce Domain (Domain 1)</b></p>
  <p><i>Empowering human potential in the age of Artificial Intelligence.</i></p>
</div>
