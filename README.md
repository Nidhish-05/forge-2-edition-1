# Forge Sprint

AI-powered career preparation platform built for the Forge Hackathon.

Forge Sprint helps users improve their resumes, evaluate ATS compatibility, and prepare for technical interviews using AI-assisted workflows.

---

## Features

* Resume upload and management
* ATS compatibility analysis
* Resume feedback
* AI-generated interview questions
* Authentication with Laravel Sanctum
* Dashboard for resume insights
* Modern responsive interface

---

## Technology Stack

### Backend

* Laravel 13
* PHP 8.5
* PostgreSQL
* Sanctum
* REST API

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS v4
* shadcn/ui
* React Query
* Zustand
* Axios

### Infrastructure

* Docker
* PostgreSQL
* GitHub

### AI Development Workflow

* Ollama
* OpenClaw
* Hermes Agent
* Slack Integration

---

## Repository Structure

```text
forge-2-edition-1
│
├── backend/
│   ├── app/
│   ├── routes/
│   ├── database/
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Clone

```bash
git clone https://github.com/Nidhish-05/forge-2-edition-1.git
cd forge-2-edition-1
```

---

### Backend

```bash
cd backend

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate

php artisan serve
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

### Docker

```bash
docker compose up -d
```

---

## Development Status

Current implementation includes:

* Project initialization
* Laravel backend
* React frontend
* Docker configuration
* PostgreSQL integration
* Sanctum setup
* Tailwind CSS
* shadcn/ui integration

Planned features:

* Authentication workflow
* Resume parser
* ATS scoring engine
* AI interview generator
* Resume analytics dashboard
* Deployment pipeline

---

## System Architecture

```text
React Client
      │
      ▼
REST API (Laravel)
      │
      ▼
PostgreSQL
      │
      ▼
AI Processing Layer
```

---

## Objectives

The project is designed to:

* Improve resume quality
* Increase ATS compatibility
* Provide interview preparation
* Deliver actionable AI feedback
* Demonstrate a production-oriented full-stack architecture

---

## Contributors

**Nidhish Bansal**

GitHub: https://github.com/Nidhish-05

---

## License

MIT License
