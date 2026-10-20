# 🎓 University Exam Portal with Little's Law Performance Monitoring

A modern, full-stack Online Examination System and Computer Organization & Architecture (COA) Performance Telemetry Platform. The portal features a complete student assessment workflow paired with real-time system performance monitoring and queueing simulation powered by **Little's Law** ($L = \lambda \times W$).

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Theoretical Foundation: Little's Law](#-theoretical-foundation-littles-law)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Demo Credentials](#-demo-credentials)
- [API Endpoints](#-api-endpoints)
- [License](#-license)

---

## 📌 Overview

This project bridges **educational software** and **computer systems architecture**. While students take time-constrained computer science examinations, system administrators and instructors can inspect the underlying server's performance metrics in real time. 

The embedded performance engine continuously tracks HTTP request durations across a sliding window, computes live arrival rates ($\lambda$) and response times ($W$), and applies Little's Law to calculate the concurrency state ($L$) of the system. An interactive **Traffic Simulator** allows users to stress-test the system and observe queueing behavior under database slowdowns and traffic spikes.

---

## 📐 Theoretical Foundation: Little's Law

In queueing theory and computer systems performance analysis, **Little's Law** states that under steady-state conditions:

$$L = \lambda \times W$$

Where:
- **$L$ (Mean Number of Customers / Requests in System)**: The average concurrency or queue length.
- **$\lambda$ (Arrival Rate)**: The average rate at which incoming requests enter the system (requests per second, req/s).
- **$W$ (Mean Response Time / Latency)**: The average total time a request spends in the system (seconds).

### Practical Architectural Implications:
1. **Capacity Planning**: Predicting the concurrency limit before queue delays compound.
2. **Bottleneck Identification**: Distinguishing whether elevated response times ($W$) stem from backend bottlenecks (e.g. database serialization) or elevated arrival rates ($\lambda$).
3. **Simulation Presets**:
   - **Baseline / Original**: Balanced arrival rate ($\lambda = 1200\text{ req/s}$) and fast latency ($W = 0.25\text{s}$).
   - **Database Slowdown**: Unchanged arrival rate ($\lambda = 1200\text{ req/s}$), but doubled latency ($W = 0.50\text{s}$) due to I/O contention, resulting in doubled system load ($L$).
   - **Spike Traffic**: Surge arrival rate ($\lambda = 3000\text{ req/s}$) showing high concurrency and queueing pressure.

---

## ✨ Key Features

### 👨‍🎓 Student Portal
- **Dashboard**: Overview of upcoming exams, completed tests, and average performance scores.
- **Interactive Exam Interface**:
  - Live countdown timer with auto-submit protection.
  - Question navigation grid with flag-for-review status.
  - Radio options with client-side state caching.
- **Detailed Result Breakdown**:
  - Immediate score calculation, percentage, and pass/fail verdict.
  - Question-by-question review with correct answers and explanations.
- **Historical Records**: Comprehensive log of all past attempts and submission timestamps.

### 🛡️ Admin & Performance Telemetry Portal
- **Live Metrics Dashboard**:
  - Real-time gauges for Concurrency ($L$), Arrival Rate ($\lambda$), and Latency ($W$).
  - System health indicator (`Healthy`, `Elevated`, `Critical`).
  - Rolling time-series charts of historical metrics.
- **Traffic Simulator**:
  - Synthetic workload generation in an asynchronous background worker.
  - Quick presets (`original`, `db_slowdown`, `spike`, `high_load`, `idle`).
  - Custom configurable arrival rates and latency distributions.
- **Case Study Report**:
  - Pre-computed and analytical comparison tables demonstrating Little's Law in practice.
  - Architectural diagnosis and optimization recommendations.
- **Assessment Management**: View exam submissions, review student scores, and inspect question answer keys.

---

## 🛠️ Architecture & Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI Server)
- **Database**: SQLite with thread-safe persistence for submissions and student performance.
- **Authentication**: JWT (JSON Web Tokens) with `python-jose` and `bcrypt` password hashing.
- **Metrics Engine**: Thread-safe sliding-window ring buffer (`collections.deque`) calculating rolling $\lambda$, $W$, and $L$.

### Frontend
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **HTTP Client**: [Axios](https://axios-http.com/)

---

## 📂 Project Structure

```text
coa-project/
├── backend/
│   ├── app/
│   │   ├── middleware/
│   │   │   └── timing.py          # HTTP latency measurement middleware
│   │   ├── routers/
│   │   │   ├── admin.py           # Admin exam & submission endpoints
│   │   │   ├── auth.py            # Authentication & JWT tokens
│   │   │   ├── exams.py           # Student exam delivery
│   │   │   ├── metrics.py         # Live Little's Law metrics & simulator controls
│   │   │   └── submissions.py     # Exam answer submission & auto-grading
│   │   ├── services/
│   │   │   ├── metrics_service.py # Sliding-window buffer & Little's Law calculations
│   │   │   └── simulator_service.py# Traffic simulator background worker
│   │   ├── auth.py                # Credential hashing & user registry
│   │   ├── data.py                # Sample exams and question bank
│   │   ├── database.py            # SQLite schema initialization
│   │   ├── dependencies.py        # Role-based access control dependencies
│   │   ├── main.py                # FastAPI entry point & CORS configuration
│   │   └── schemas.py             # Pydantic data models
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   ├── public/                    # Static assets & icons
│   ├── src/
│   │   ├── api/                   # Axios API clients for backend integration
│   │   ├── components/            # Reusable UI components & layouts (Student/Admin)
│   │   ├── pages/
│   │   │   ├── admin/             # Dashboard, Exams, Performance, Case Study
│   │   │   ├── auth/              # Login screen
│   │   │   └── student/           # Exam List, Instructions, Live Exam, Result, History
│   │   ├── stores/                # Zustand global state (Auth, UI)
│   │   ├── App.tsx                # App routing & protected route wrappers
│   │   └── main.tsx               # Application mount point
│   ├── package.json               # Frontend dependencies & scripts
│   ├── tailwind.config.js         # Tailwind styling configuration
│   └── vite.config.ts             # Vite build configuration
│
├── .gitignore                     # Git ignore rules for node_modules, build & DB
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher

---

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. *(Optional but recommended)* Create and activate a virtual environment:
   ```powershell
   # Windows PowerShell:
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will be available at: **`http://localhost:8000`**  
   Interactive API docs (Swagger): **`http://localhost:8000/docs`**

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit: **`http://localhost:5173`**

---

## 🌐 Public Cloud Deployment (Free 24/7 Access)

### Step 1: Deploy Backend (Render)
1. Sign up/log in to [Render](https://render.com/).
2. Click **New +** > **Blueprint** (or **Web Service**).
3. Connect your GitHub repository (`Sundars-git/coa-project`).
4. Render automatically detects [`render.yaml`](render.yaml) and configures the FastAPI service.
   - *Manual settings if not using blueprint*:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - **Environment Variable**: `CORS_ORIGINS=*`
5. Once deployed, copy your backend URL (e.g., `https://coa-exam-portal-api.onrender.com`).

### Step 2: Deploy Frontend (Vercel)
1. Sign up/log in to [Vercel](https://vercel.com/).
2. Click **Add New...** > **Project** and import `Sundars-git/coa-project`.
3. In the project setup settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     - Key: `VITE_API_URL`
     - Value: `https://<your-render-backend-url>.onrender.com` (from Step 1)
4. Click **Deploy**.
5. Your exam portal is now live with a public URL (e.g., `https://coa-project.vercel.app`)!

---

## 🔑 Demo Credentials

Pre-configured accounts for testing different user roles:

| Role | Name | Email | Password | Access / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Prof. Kamatchi Sundar | `admin@uniportal.edu` | `Admin@1234` | Full access: Performance Monitor, Simulator, Reports, Exams |
| **Student** | Nishthika | `nishthika@student.edu` | `Student@1234` | Student portal: Take exams, view results, history |
| **Student** | Fathima | `fathima@student.edu` | `Student@1234` | Student portal: Take exams, view results, history |
| **Student** | Kamatchi Sundar | `kamatchi@student.edu` | `Student@1234` | Student portal: Take exams, view results, history |

---

## 📡 API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate and retrieve JWT token | Public |
| `GET` | `/api/auth/me` | Fetch current user profile | Authenticated |
| `GET` | `/api/exams` | Retrieve list of active exams | Students / Admins |
| `GET` | `/api/exams/{id}` | Get specific exam questions | Students |
| `POST` | `/api/submissions` | Submit exam answers and compute score | Students |
| `GET` | `/api/submissions/history` | View submission history | Students |
| `GET` | `/api/metrics/live` | Real-time Little's Law telemetry ($L, \lambda, W$) | Admin |
| `GET` | `/api/metrics/history` | 5-minute rolling performance data points | Admin |
| `POST` | `/api/metrics/simulator/start` | Start traffic load generator | Admin |
| `POST` | `/api/metrics/simulator/preset/{preset}` | Apply simulation scenario preset | Admin |
| `POST` | `/api/metrics/simulator/pause` | Pause traffic simulator | Admin |
| `POST` | `/api/metrics/simulator/reset` | Clear simulation state | Admin |

---

## 📄 License

This project is developed for educational and academic demonstration purposes in Computer Organization and Architecture (COA) / Computer Systems Performance Evaluation.
