# 🚀 Skilytics Deployment & Infrastructure Configuration

This directory consolidates all cloud deployment manifests, infrastructure blueprints, and service configuration files for the **Skilytics** platform.

---

## 📁 Directory Structure & File Index

| File / Folder | Target Platform / Service | Description |
| :--- | :--- | :--- |
| `vercel.json` | **Vercel** (Frontend SPA) | Hosting configuration for the React + Vite frontend single-page application. Handles asset rewrites, SPA routing fallbacks, and backend API proxying. |
| `render.yaml` | **Render** (Backend API Server) | Infrastructure-as-Code (IaC) blueprint specification for provisioning and executing the Node.js / Express API service (`skilytics-api`) with healthcheck endpoints and environment variable bindings. |
| `package.json` | **Root Orchestration** | Deployment manifest defining global build and start commands (`build:render`, `start:render`, `copy-dist`). |
| `pnpm-lock.yaml` & `package-lock.json` | **Package Manager** | Deterministic lockfiles ensuring reproducible dependency resolution across build pipelines. |
| `scripts/copy-dist.js` | **Build Pipeline** | Post-build automation utility that copies compiled production assets from `src/artifacts/reskill-ai/dist/public` to the root distribution directory (`dist/`). |
| `neon.ts` | **Neon PostgreSQL** | Branching policy and cloud database lifecycle configuration for Neon Serverless PostgreSQL. |
| `skills-lock.json` | **Antigravity Tooling** | Skill definitions and lockfile tracking agentic backend integrations. |

---

## 🌐 Live Production Deployments

- **Frontend (Vercel):** [https://skilytics.vercel.app](https://skilytics.vercel.app)
- **Backend API (Render):** `https://sdc2026-hackathon-4bit-skilytics.onrender.com`
- **Database (Neon Serverless PostgreSQL):** Managed cloud cluster in `ap-southeast-1` (Singapore)
