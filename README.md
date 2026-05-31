<div align="center">

# Study Logger

### Track Your Learning Journey

A beautifully crafted web application for logging daily study sessions, visualizing progress, and building consistent learning habits.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2+-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

*Built with Django · Vanilla JS · Custom Canvas Charts · Zero Dependencies*

</div>

<br>

##  Key Features

###  Daily Task Logging with Categorization
- Log study sessions with **name, category, duration, and notes**
- **7 built-in categories** —  Reading,  Coding,  Exercises,  Lectures,  Writing,  Research,  Other
- Filter tasks by category with interactive filter chips
- Mark tasks complete and track daily progress

###  Progress Tracking & Analytics
- Track your **day streak**, **hours logged**, and **completion rate**
- Weekly study hours trends over the past 7 days
- Per-category progress tracking for the current day
- Configurable **daily task goals** with visual progress indicator

###  Statistical Summaries & Reports
- **Lifetime stats** — total tasks completed, total hours studied, best streak
- **Category breakdown** — see how your time is distributed across subjects
- **Daily goal tracking** — monitor your consistency at a glance

###  Responsive Web Design
- Mobile-friendly layout with hamburger navigation
- Smooth animations and scroll-triggered transitions
- Light and dark theme support with persistent preference

###  User Authentication & Profiles
- User registration with email
- Secure login/logout with session management
- Editable profile with display name, email, and daily goal settings
- Protected routes — all pages require authentication

###  Data Visualization Dashboards
- **Weekly line chart** — smooth gradient chart with study hours per day
- **Category donut chart** — color-coded breakdown with legend
- **Goal ring** — circular SVG progress indicator
- **Category progress bars** — per-category completion for today

<br>

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 4.2+ · Python 3.10+ |
| **Database** | SQLite |
| **Frontend** | Vanilla JavaScript · HTML5 · CSS3 |
| **Charts** | Custom Canvas 2D (no Chart.js — fully hand-built) |
| **Styling** | CSS Custom Properties · Glass-morphism · Inter font |
| **API** | JSON REST endpoints (no DRF — lightweight manual views) |

> **Zero external JS libraries.** All charts, animations, and interactions are built from scratch.

<br>

##  Getting Started

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/HaymiG/study-logger.git
cd study-logger
```

**2. Create a virtual environment**
```bash
python -m venv .venv
```

**3. Activate the virtual environment**

Windows:
```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

**4. Install dependencies**
```bash
pip install -r requirements.txt
```

**5. Run database migrations**
```bash
python manage.py migrate
```

**6. Create a superuser** *(optional — for admin panel access)*
```bash
python manage.py createsuperuser
```

**7. Start the development server**
```bash
python manage.py runserver
```

**8. Open in your browser**
```
http://127.0.0.1:8000
```

<br>

##  Project Structure

```
study-logger/
├── core/                   # Main application
│   ├── models.py           # Task & Profile models
│   ├── views.py            # Page views & JSON API endpoints
│   ├── urls.py             # URL routing
│   ├── forms.py            # Task, Profile & Registration forms
│   ├── admin.py            # Admin panel configuration
│   └── context_processors.py
├── templates/              # Django HTML templates
│   ├── base.html           # Base layout with navbar & theme
│   ├── dashboard.html      # Analytics dashboard
│   ├── tasks.html          # Task management page
│   ├── profile.html        # User profile & settings
│   ├── login.html          # Login page
│   └── register.html       # Registration page
├── static/
│   ├── css/style.css       # Full styling with dark mode
│   └── js/app.js           # All frontend logic & charts
├── studylogger/            # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── manage.py
├── requirements.txt
└── db.sqlite3
```

<br>

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks/` | List all tasks (supports `?filter=category`) |
| `POST` | `/api/tasks/` | Create a new task |
| `POST` | `/api/tasks/<id>/toggle/` | Toggle task completion |
| `DELETE` | `/api/tasks/<id>/` | Delete a task |
| `GET` | `/api/dashboard/` | Dashboard stats, charts & progress data |
| `GET` | `/api/profile/info/` | Get profile info & lifetime stats |
| `POST` | `/api/profile/` | Update display name, email & daily goal |
| `POST` | `/api/theme/` | Toggle light/dark theme |

<br>

##  Design Highlights

- **Glass-morphism UI** — Semi-transparent surfaces with subtle backdrop blur
- **Soft pastel palette** — Indigo primary, teal secondary, rose accent
- **Animated counters** — Smooth eased number animations on stat cards
- **Scroll-triggered reveals** — Elements fade in as you scroll via IntersectionObserver
- **Responsive layout** — Mobile-friendly with hamburger navigation
- **Toast notifications** — Ephemeral feedback messages with auto-dismiss

<br>

##  License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built for better study habits**

</div>
