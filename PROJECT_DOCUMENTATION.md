# 🚌 BusGo — Complete Project Documentation

> **BusGo** is a full-stack bus ticket booking web application built with a **React** frontend and a **Python Flask** backend. Users can search for buses, select seats on a visual map, book tickets, pay (simulated Razorpay), and download PDF e-tickets. Admins can manage the fleet, view analytics, and export reports.

---

## Table of Contents

1. [Technologies Used](#1-technologies-used)
2. [Project Architecture (How It All Fits Together)](#2-project-architecture)
3. [Folder Structure Explained](#3-folder-structure-explained)
4. [How to Run the Project](#4-how-to-run-the-project)
5. [Frontend Deep Dive](#5-frontend-deep-dive)
   - [Pages & Routes](#51-pages--routes)
   - [Components](#52-components)
   - [State Management & Data Fetching](#53-state-management--data-fetching)
   - [Styling System](#54-styling-system)
6. [Backend Deep Dive](#6-backend-deep-dive)
   - [Flask App Setup](#61-flask-app-setup)
   - [Database Models](#62-database-models)
   - [API Endpoints Reference](#63-api-endpoints-reference)
7. [Database Design](#7-database-design)
8. [Authentication Flow](#8-authentication-flow)
9. [Complete User Booking Journey](#9-complete-user-booking-journey)
10. [Key Concepts for Beginners](#10-key-concepts-for-beginners)
11. [Glossary](#11-glossary)

---

## 1. Technologies Used

### Frontend (What the User Sees)

| Technology | Version | What It Does |
|---|---|---|
| **React** | 19.x | The UI library — every page is built with React "components" (reusable building blocks of HTML + logic) |
| **TypeScript** | 5.x | A stricter version of JavaScript that catches errors before your code runs |
| **TanStack Router** | 1.x | Handles page navigation — when you click "Search", it loads the `/search` page without refreshing the browser |
| **TanStack React Query** | 5.x | Manages fetching data from the backend API and caching it |
| **TailwindCSS** | 4.x | A utility-first CSS framework — instead of writing CSS files, you add classes directly like `bg-blue-500 text-white rounded-xl` |
| **Vite** | 8.x | The build tool — it compiles your TypeScript/React code into plain JavaScript that browsers understand, and provides a fast dev server |
| **Radix UI** | Various | Pre-built accessible UI components (buttons, dialogs, dropdowns, etc.) |
| **Lucide React** | 0.575.x | Icon library — all the icons (bus, search, lock, etc.) come from here |
| **Zod** | 3.x | Validates data shapes — e.g., ensures the search query has `from`, `to`, and `date` fields |
| **Sonner** | 2.x | Toast notification library — the little popup messages like "Payment successful!" |
| **date-fns** | 4.x | Utility functions for working with dates |

### Backend (Server That Handles Data)

| Technology | Version | What It Does |
|---|---|---|
| **Python** | 3.x | The programming language for the server |
| **Flask** | 3.0.2 | A lightweight web framework — it receives HTTP requests and sends back JSON responses |
| **Flask-SQLAlchemy** | 3.1.1 | ORM (Object-Relational Mapper) — lets you interact with the database using Python classes instead of raw SQL |
| **SQLite** | Built-in | The database engine — stores all data in a single file (`bus_booking.db`) |
| **Flask-JWT-Extended** | 4.6.0 | Handles authentication tokens — after login, the server gives you a "pass" (JWT token) that proves who you are |
| **Flask-Bcrypt** | 1.0.1 | Securely hashes passwords — never stores them as plain text |
| **Flask-CORS** | 4.0.0 | Allows the frontend (port 8080) to make requests to the backend (port 5000) — browsers block this by default for security |
| **ReportLab** | 4.1.0 | Generates PDF ticket documents with QR codes |
| **qrcode** | 7.4.2 | Creates the QR code images embedded in ticket PDFs |
| **Pandas** | 2.2.0 | Data analysis library used to generate Excel/CSV revenue and occupancy reports |
| **openpyxl** | 3.1.2 | Engine that Pandas uses to write `.xlsx` (Excel) files |

### Development Tools

| Tool | What It Does |
|---|---|
| **npm** | Node.js package manager — installs frontend libraries |
| **pip** | Python package manager — installs backend libraries |
| **Lovable** | Cloud platform this project is connected to for deployment |

---

## 2. Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│   React App (Vite Dev Server — port 8080)                       │
│   ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│   │ Home    │  │ Search   │  │ Checkout │  │ Admin Dashboard│  │
│   │ Page    │  │ Page     │  │ Page     │  │ Page           │  │
│   └────┬────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│        │            │             │                 │            │
│        └────────────┴──────┬──────┴─────────────────┘            │
│                            │                                     │
│                    api-client.ts                                  │
│              (All API calls go through here)                     │
│                            │                                     │
│                  HTTP Requests (fetch)                            │
│                  Authorization: Bearer <token>                   │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                     Network (localhost)
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                            │                                     │
│               Flask API Server (port 5000)                       │
│                                                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│   │ Auth     │ │ Buses    │ │ Bookings │ │ Tickets/Reports  │   │
│   │ Routes   │ │ Routes   │ │ Routes   │ │ Routes           │   │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬──────────┘   │
│        │            │            │                │              │
│        └────────────┴─────┬──────┴────────────────┘              │
│                           │                                      │
│                    SQLAlchemy ORM                                 │
│                           │                                      │
│                   ┌───────┴────────┐                             │
│                   │  SQLite DB     │                             │
│                   │ bus_booking.db │                             │
│                   └────────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
```

### How the Frontend and Backend Communicate

1. The **frontend** runs on `http://localhost:8080` (Vite dev server)
2. The **backend** runs on `http://localhost:5000` (Flask server)
3. When the frontend needs data (e.g., search results), it sends an **HTTP request** to the backend using the `api-client.ts` helper
4. The backend processes the request, queries the database, and sends back **JSON** (JavaScript Object Notation — a structured text format)
5. The frontend receives the JSON and renders it into the UI

---

## 3. Folder Structure Explained

```
breezy-blue-interface/
│
├── backend/                    ← 🐍 THE PYTHON BACKEND (API SERVER)
│   ├── app.py                  ← Creates and configures the Flask app
│   ├── run.py                  ← Entry point: starts the Flask server on port 5000
│   ├── models.py               ← Database table definitions (User, Bus, Booking, etc.)
│   ├── schema.sql              ← SQL table creation scripts (reference/documentation)
│   ├── init_db.py              ← Seeds the database with sample data
│   ├── bus_booking.db          ← The actual SQLite database file (auto-generated)
│   ├── test_api.py             ← API test scripts
│   ├── requirements.txt        ← Python dependencies list
│   ├── static/uploads/         ← Uploaded files (e.g., profile pictures)
│   └── routes/                 ← 📂 API route handlers (organized by feature)
│       ├── auth.py             ← Login, register, profile, password reset
│       ├── buses.py            ← Search buses, seat maps, CRUD operations
│       ├── routes_schedules.py ← Bus routes & schedule management
│       ├── bookings_payments.py← Create bookings, process payments, cancel
│       ├── reviews.py          ← User reviews & ratings for buses
│       ├── tickets_reports.py  ← PDF ticket generation, revenue/occupancy reports
│       └── admin.py            ← Admin dashboard stats & charts data
│
├── src/                        ← ⚛️ THE REACT FRONTEND
│   ├── styles.css              ← Global CSS with color tokens and Tailwind config
│   ├── router.tsx              ← Creates the TanStack Router instance
│   ├── routeTree.gen.ts        ← Auto-generated route tree (don't edit manually!)
│   ├── start.ts                ← App entry point for TanStack Start
│   ├── server.ts               ← SSR (Server-Side Rendering) entry
│   │
│   ├── routes/                 ← 📂 Every file = one page in the app
│   │   ├── __root.tsx          ← Root layout: HTML shell, meta tags, fonts, error pages
│   │   ├── index.tsx           ← Home page (hero, search form, features, popular routes)
│   │   ├── search.tsx          ← Search results page (bus cards, filters, sorting)
│   │   ├── bus.$busId.tsx      ← Bus detail page with seat selection map
│   │   ├── checkout.tsx        ← Passenger details + payment method selection
│   │   ├── confirmation.$bookingId.tsx ← Booking confirmation with QR code
│   │   ├── bookings.tsx        ← "My Bookings" page (view, cancel, download tickets)
│   │   ├── login.tsx           ← Sign in page
│   │   ├── register.tsx        ← Sign up page
│   │   └── admin.tsx           ← Admin dashboard (stats, charts, fleet management)
│   │
│   ├── components/             ← 📂 Reusable UI building blocks
│   │   ├── layout.tsx          ← Header (nav bar) and Footer components
│   │   └── ui/                 ← 46 pre-built UI components (from shadcn/ui)
│   │       ├── button.tsx      ← Button component with variants (hero, ghost, etc.)
│   │       ├── card.tsx        ← Card container component
│   │       ├── dialog.tsx      ← Modal dialog component
│   │       ├── ... (44 more)   ← Inputs, tables, tooltips, tabs, etc.
│   │
│   ├── lib/                    ← 📂 Shared utilities
│   │   ├── api-client.ts       ← Central function for all HTTP requests to the backend
│   │   ├── bus-data.ts         ← Static bus data types and seat map generator
│   │   ├── utils.ts            ← Utility functions (e.g., class name merger)
│   │   ├── error-capture.ts    ← Error reporting utilities
│   │   └── error-page.ts       ← Error page rendering
│   │
│   └── hooks/                  ← 📂 Custom React hooks
│       └── use-mobile.tsx      ← Detects if user is on a mobile device
│
├── package.json                ← Frontend dependencies and npm scripts
├── tsconfig.json               ← TypeScript compiler configuration
├── vite.config.ts              ← Vite build tool configuration
├── components.json             ← shadcn/ui component configuration
└── AGENTS.md                   ← Lovable platform rules
```

---

## 4. How to Run the Project

### Prerequisites

- **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
- **Python** (v3.9 or higher) — [Download here](https://python.org/)

### Step 1: Start the Backend (API Server)

```bash
# Open a terminal in the project root
cd backend

# Install Python packages (first time only)
pip install -r requirements.txt

# Seed the database with sample data (first time only)
python init_db.py

# Start the Flask server
python run.py
```

The backend will start at `http://localhost:5000`. You can test it by visiting `http://localhost:5000/api/health` in your browser — you should see `{"status": "healthy"}`.

### Step 2: Start the Frontend (React App)

```bash
# Open another terminal in the project root
npm install        # Install packages (first time only)
npm run dev        # Start the Vite development server
```

The frontend will start at `http://localhost:8080`. Open it in your browser!

### Test Accounts (Pre-seeded)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@busgo.com` | `admin123` |
| **User** | `user@busgo.com` | `user123` |

---

## 5. Frontend Deep Dive

### 5.1 Pages & Routes

TanStack Router uses **file-based routing** — each file in `src/routes/` automatically becomes a URL path:

| File | URL Path | Description |
|---|---|---|
| `__root.tsx` | (wraps all pages) | HTML shell (`<html>`, `<head>`, `<body>`), loads fonts, provides error/404 fallbacks |
| `index.tsx` | `/` | **Home page** — hero banner with search form, "Why BusGo" features section, popular routes grid |
| `search.tsx` | `/search?from=X&to=Y&date=Z` | **Search results** — fetches schedules from backend, shows bus cards with filter sidebar (bus type, max price) and sorting |
| `bus.$busId.tsx` | `/bus/42` | **Seat selection** — fetches live seat map from backend, shows lower/upper deck grid, fare summary sidebar |
| `checkout.tsx` | `/checkout?busId=42&seats=L11,L12&date=...` | **Checkout** — passenger name/age/gender forms, contact details, payment method selector (UPI/Card/Wallet/Net Banking) |
| `confirmation.$bookingId.tsx` | `/confirmation/BG9X4K2A` | **Booking confirmed** — shows booking summary, QR code, download PDF / email ticket buttons |
| `bookings.tsx` | `/bookings` | **My Bookings** — tabbed view (Upcoming/Completed/Cancelled), cancel bookings, download PDF tickets |
| `login.tsx` | `/login` | **Sign in** — email + password form, calls `/api/auth/login` |
| `register.tsx` | `/register` | **Sign up** — name, email, mobile, password form, calls `/api/auth/register` |
| `admin.tsx` | `/admin` | **Admin dashboard** — stats cards, bookings trend chart, top routes chart, fleet management table, report exports |

#### How Does `$busId` Work?

The `$` prefix means it's a **dynamic parameter**. So `bus.$busId.tsx` matches any URL like `/bus/1`, `/bus/42`, `/bus/999`. Inside the component, you can read the value:

```tsx
const { busId } = Route.useParams();
// If URL is /bus/42, then busId === "42"
```

#### How Do Search Parameters Work?

Some pages accept **query strings** (the `?key=value` part of URLs). For example:

```
/search?from=Bengaluru&to=Mumbai&date=2026-07-10
```

In the component, you read them with:

```tsx
const { from, to, date } = Route.useSearch();
```

The `validateSearch` option uses **Zod** to define the expected shape and defaults.

---

### 5.2 Components

#### Layout Components (`components/layout.tsx`)

- **`<Header />`** — The sticky navigation bar at the top of every page
  - Shows the BusGo logo, navigation links (Home, Search)
  - If logged in: shows user name badge + Logout button
  - If admin: shows "Admin Dashboard" link
  - Responsive hamburger menu on mobile
  - Listens for `auth_change` events to update login state without refreshing

- **`<Footer />`** — The footer section with company/support/legal links

#### UI Components (`components/ui/`)

These 46 components come from **shadcn/ui** — a copy-paste component library built on Radix UI primitives. Key ones used in this project:

| Component | Where It's Used |
|---|---|
| `button.tsx` | Everywhere — has variants like `hero` (gradient), `ghost` (transparent), `outline` |
| `sonner.tsx` | Toast notifications wrapper |

> **Note**: shadcn/ui components are *copied into your project*, not imported from a package. This means you own the code and can customize it freely.

---

### 5.3 State Management & Data Fetching

#### The API Client (`lib/api-client.ts`)

This is the **single gateway** for all backend communication. Every API call goes through this file:

```typescript
// How it works internally:
export const api = {
  get:    (path) => apiRequest(path, { method: "GET" }),
  post:   (path, body) => apiRequest(path, { method: "POST", body }),
  put:    (path, body) => apiRequest(path, { method: "PUT", body }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
  getBlob: (path) => apiRequest(path, { method: "GET", isBlob: true }),
};
```

**What `apiRequest` does:**
1. Prepends `http://localhost:5000/api` to the path
2. Reads the JWT token from `localStorage` and adds the `Authorization: Bearer <token>` header
3. Sends the `fetch()` request
4. If the response is an error, parses the error message
5. If the token is expired, clears auth data and fires an `auth_change` event
6. Returns the JSON response

#### Authentication State

This project uses **localStorage** (browser storage) for auth:

- `busgo_token` — The JWT access token string
- `busgo_user` — A JSON string of the user object `{ full_name, email, role }`

When auth changes (login/logout), a custom DOM event `auth_change` is dispatched so the Header can update without a page reload:

```typescript
window.dispatchEvent(new Event("auth_change"));
```

---

### 5.4 Styling System

#### Color Design Tokens (`styles.css`)

The entire color scheme is defined using **CSS custom properties** (variables). This makes it easy to have a consistent look and support dark mode:

```
Brand Colors:
  Primary:   #2563EB (Deep Blue)    — buttons, links, highlights
  Secondary: #60A5FA (Sky Blue)     — lighter accent
  Accent:    #06B6D4 (Cyan)         — special highlights

Semantic Colors:
  Success:      #22C55E (Green)     — confirmed badges, positive actions
  Destructive:  #EF4444 (Red)       — errors, cancel buttons, delete actions

Gradients:
  Hero Gradient: Blue → Cyan (135°) — used in the hero banner, button "hero" variant
  Card Gradient: Very subtle blue-to-cyan wash — used on popular route cards
```

#### Custom Tailwind Utilities

Four custom utility classes are defined:

| Class | What It Does |
|---|---|
| `bg-gradient-hero` | Applies the blue-to-cyan gradient background |
| `bg-gradient-card` | Applies a very subtle blue-cyan gradient for cards |
| `shadow-soft` | A soft, blue-tinted box shadow |
| `shadow-elevated` | A more prominent blue-tinted shadow for hover states |

#### Typography

- **Headings**: Plus Jakarta Sans (Google Font) — bold, modern display font
- **Body text**: Inter (Google Font) — clean, highly readable body font

---

## 6. Backend Deep Dive

### 6.1 Flask App Setup (`app.py`)

The `create_app()` function is a **factory pattern** — it creates and configures the Flask app:

```
1. Set configuration (secret keys, database URL, upload folder)
2. Initialize extensions (CORS, SQLAlchemy, Bcrypt, JWT)
3. Register error handlers (404, 500, expired token, invalid token)
4. Register blueprints (route groups — see below)
5. Return the configured app
```

#### What are Blueprints?

Blueprints let you organize routes into separate files. Instead of putting all 30+ endpoints in one file, each feature has its own blueprint:

| Blueprint | URL Prefix | File |
|---|---|---|
| `auth_bp` | `/api/auth` | `routes/auth.py` |
| `buses_bp` | `/api/buses` | `routes/buses.py` |
| `rs_bp` | `/api` | `routes/routes_schedules.py` |
| `bookings_bp` | `/api` | `routes/bookings_payments.py` |
| `reports_bp` | `/api` | `routes/tickets_reports.py` |
| `admin_bp` | `/api/admin` | `routes/admin.py` |
| `reviews_bp` | `/api` | `routes/reviews.py` |

---

### 6.2 Database Models (`models.py`)

Each Python class maps to a **database table**. SQLAlchemy converts Python objects to SQL queries automatically:

#### User

```python
class User(db.Model):
    user_id        # Auto-incrementing ID
    full_name      # "John Doe"
    email          # Unique, indexed for fast lookups
    mobile_number  # "9876543210"
    password_hash  # Bcrypt hash (never plain text!)
    role           # "user" or "admin"
    created_at     # Timestamp
    updated_at     # Auto-updated timestamp
```

#### UserProfile

```python
class UserProfile(db.Model):
    profile_id           # ID
    user_id              # Links to User (one-to-one)
    profile_picture_url  # URL to uploaded image
    bio                  # Short text bio
    address              # Address text
```

#### Bus

```python
class Bus(db.Model):
    bus_id       # ID
    bus_name     # "VRL Travels"
    bus_number   # "KA-01-3456" (unique)
    bus_type     # "AC Sleeper", "Non-AC Seater", "Luxury Coach", etc.
    total_seats  # 36 (default)
    amenities    # JSON string: '["WiFi", "Charging Point", "Blanket"]'
    status       # "Active" or "Inactive"
```

#### Route

```python
class Route(db.Model):
    route_id     # ID
    source       # "Bengaluru"
    destination  # "Mumbai"
    distance     # 980.0 (km)
    duration     # 840 (minutes)
```

#### Schedule

```python
class Schedule(db.Model):
    schedule_id     # ID
    bus_id          # Which bus (FK → buses)
    route_id        # Which route (FK → routes)
    departure_time  # "21:30"
    arrival_time    # "06:45"
    travel_date     # "2026-07-10"
    fare            # 1499 (in ₹)
    available_seats # 36 (decremented on booking)
```

> **Key concept**: A **Schedule** combines a Bus + Route + Date + Time + Price. The same bus can run the same route on different days.

#### Booking

```python
class Booking(db.Model):
    booking_id     # "BG9X4K2A" (random 8-char string)
    user_id        # Who booked (FK → users)
    schedule_id    # Which schedule (FK → schedules)
    total_amount   # 3148 (fare × seats + 5% tax)
    booking_status # "Pending" → "Confirmed" or "Cancelled" or "Refunded"
    created_at     # Timestamp
```

#### Passenger

```python
class Passenger(db.Model):
    passenger_id    # ID
    booking_id      # Which booking (FK → bookings)
    passenger_name  # "Aarav Sharma"
    age             # 25
    gender          # "M" or "F"
    seat_number     # "L11" (Lower deck, Row 1, Seat 1)
```

#### Payment

```python
class Payment(db.Model):
    payment_id      # ID
    booking_id      # Which booking (FK → bookings)
    transaction_id  # "txn_abc123..." (unique)
    amount          # 3148
    payment_status  # "Pending", "Success", "Failed", "Refunded"
    payment_method  # "UPI", "Card", "Wallet", "Net Banking"
    created_at      # Timestamp
```

#### Review

```python
class Review(db.Model):
    review_id    # ID
    user_id      # Who reviewed (FK → users)
    bus_id       # Which bus (FK → buses)
    rating       # 1–5 stars
    review_text  # "Excellent travel experience!"
    created_at   # Timestamp
```

---

### 6.3 API Endpoints Reference

#### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create a new account. Body: `{ full_name, email, mobile_number, password }`. Returns JWT token + user object |
| `POST` | `/api/auth/login` | No | Sign in. Body: `{ email, password }`. Returns JWT token + user object |
| `GET` | `/api/auth/profile` | Yes | Get current user's profile details |
| `PUT` | `/api/auth/profile` | Yes | Update profile (name, mobile, bio, address, password change) |
| `POST` | `/api/auth/reset-password` | No | Two-stage password reset (simulated OTP flow) |

#### 🚌 Buses (`/api/buses`)

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| `GET` | `/api/buses/search?from=X&to=Y&date=Z` | No | **Main search endpoint**. Also accepts `types`, `max_price`, `sort` parameters. Returns matching schedules with live seat counts |
| `GET` | `/api/buses` | No | List all buses in the fleet |
| `GET` | `/api/buses/:bus_id` | No | Get details for a specific bus |
| `GET` | `/api/buses/schedule/:schedule_id/seats` | No | **Seat map endpoint**. Returns the full seat grid with status (available/booked/female) for a specific schedule |
| `POST` | `/api/buses` | Admin | Add a new bus to the fleet |
| `PUT` | `/api/buses/:bus_id` | Admin | Update bus details |
| `DELETE` | `/api/buses/:bus_id` | Admin | Delete a bus (cascades to schedules) |

#### 🗺️ Routes & Schedules (`/api`)

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| `GET` | `/api/routes` | No | List all travel routes |
| `POST` | `/api/routes` | Admin | Create a new route. Auto-calculates distance/duration |
| `PUT` | `/api/routes/:route_id` | Admin | Update a route |
| `DELETE` | `/api/routes/:route_id` | Admin | Delete a route |
| `GET` | `/api/schedules` | No | List all schedules |
| `POST` | `/api/schedules` | Admin | Create a new schedule. Body: `{ bus_id, route_id, departure_time, arrival_time, travel_date, fare }` |
| `PUT` | `/api/schedules/:schedule_id` | Admin | Update a schedule |
| `DELETE` | `/api/schedules/:schedule_id` | Admin | Delete a schedule |

#### 🎫 Bookings & Payments (`/api`)

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | Yes | **Create a booking**. Body: `{ schedule_id, seats: ["L11","L12"], passengers: [{name, age, gender}] }`. Checks seat availability, calculates total with 5% tax, returns `booking_id` + simulated Razorpay order |
| `POST` | `/api/payments/verify` | Yes | **Verify payment**. Body: `{ booking_id, payment_method, status }`. On success: confirms booking, creates Payment record, updates seat count |
| `GET` | `/api/bookings/my` | Yes | List current user's bookings (sorted newest first) |
| `GET` | `/api/bookings/:booking_id` | Yes | Get full booking details (with passengers and schedule info) |
| `POST` | `/api/bookings/:booking_id/cancel` | Yes | Cancel a booking, initiate refund, release seats |

#### 🎟️ Tickets & Reports (`/api`)

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| `GET` | `/api/tickets/:booking_id/pdf` | Yes | **Download PDF ticket** with QR code, passenger list, travel details |
| `POST` | `/api/tickets/:booking_id/email` | Yes | Send ticket to user's email (simulated) |
| `GET` | `/api/admin/reports/revenue?format=excel` | Admin | Export revenue report as Excel or CSV |
| `GET` | `/api/admin/reports/occupancy?format=csv` | Admin | Export fleet occupancy report |

#### ⭐ Reviews (`/api`)

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| `POST` | `/api/buses/:bus_id/reviews` | Yes | Add a review (rating 1-5 + text) |
| `GET` | `/api/buses/:bus_id/reviews` | No | Get all reviews for a bus with average rating |
| `DELETE` | `/api/admin/reviews/:review_id` | Admin | Delete/moderate a review |

#### 📊 Admin (`/api/admin`)

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Dashboard numbers: total users, buses, routes, bookings, revenue |
| `GET` | `/api/admin/charts` | Admin | Chart data: daily bookings trend (7 days), popular routes with booking counts |

---

## 7. Database Design

### Entity-Relationship Diagram

```
┌──────────┐     1:1      ┌──────────────┐
│  Users   │─────────────▸│ UserProfiles  │
└────┬─────┘              └──────────────┘
     │
     │ 1:Many
     │
     ├────────────────────────────────────┐
     │                                    │
     ▼                                    ▼
┌──────────┐                       ┌───────────┐
│ Bookings │◂──────────────────────│  Reviews   │
└────┬─────┘                       └───────────┘
     │                                    ▲
     │ 1:Many                             │
     │                                    │
     ├──────────────┐                     │
     │              │                     │
     ▼              ▼                     │
┌────────────┐ ┌──────────┐              │
│ Passengers │ │ Payments │              │
└────────────┘ └──────────┘              │
                                         │
     ┌──────────┐   1:Many  ┌───────────┐│
     │  Buses   │──────────▸│ Schedules ││
     └──────┬───┘           └─────┬─────┘│
            │                     │       │
            │ 1:Many              │ 1:Many│
            │                     │       │
            └────────────────▸    │       │
                Reviews ◂─────────┘       │
                  ▲                       │
                  └───────────────────────┘

     ┌──────────┐   1:Many  ┌───────────┐
     │  Routes  │──────────▸│ Schedules │
     └──────────┘           └───────────┘
```

### Relationships Summary

| Relationship | Type | Explanation |
|---|---|---|
| User → UserProfile | One-to-One | Each user has exactly one profile |
| User → Bookings | One-to-Many | One user can have many bookings |
| User → Reviews | One-to-Many | One user can write many reviews |
| Bus → Schedules | One-to-Many | One bus can have many scheduled trips |
| Bus → Reviews | One-to-Many | One bus can receive many reviews |
| Route → Schedules | One-to-Many | One route can have many scheduled trips |
| Schedule → Bookings | One-to-Many | One schedule can have many bookings |
| Booking → Passengers | One-to-Many | One booking can have multiple passengers |
| Booking → Payments | One-to-Many | One booking can have payment records |

### Seat Naming Convention

Seats follow a specific naming pattern: `{Deck}{Row}{Column}`

```
Deck: L = Lower, U = Upper
Row:  1, 2, 3, 4, 5, 6
Col:  1, 2 (paired side), S (single side — across the aisle)

Example seat layout (Lower Deck):
  Col 1  Col 2   Aisle   Col S
  ─────  ─────   ─────   ─────
  [L11]  [L12]     │     [L1S]    Row 1
  [L21]  [L22]     │     [L2S]    Row 2
  [L31]  [L32]     │     [L3S]    Row 3
  [L41]  [L42]     │     [L4S]    Row 4
  [L51]  [L52]     │     [L5S]    Row 5
  [L61]  [L62]     │     [L6S]    Row 6
```

---

## 8. Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        REGISTRATION FLOW                                │
│                                                                         │
│  User fills form ──▸ POST /api/auth/register ──▸ Server:               │
│  {name, email,         │                          1. Check email unique  │
│   mobile, password}    │                          2. Hash password       │
│                        │                          3. Create User row     │
│                        │                          4. Create UserProfile  │
│                        │                          5. Generate JWT token  │
│                        │                                                │
│                        ◂── Response: { token, user }                    │
│                                                                         │
│  Frontend stores in localStorage:                                       │
│    busgo_token = "eyJhbG..."                                           │
│    busgo_user  = '{"full_name":"John","email":"..."}'                  │
│                                                                         │
│  Dispatches: window.dispatchEvent(new Event("auth_change"))            │
│  Header component updates to show user name + logout button             │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         SUBSEQUENT REQUESTS                             │
│                                                                         │
│  api-client.ts automatically adds:                                      │
│    Authorization: Bearer eyJhbGciOiJIUzI1NiIs...                       │
│                                                                         │
│  Backend verifies the token with @jwt_required() decorator              │
│  Extracts user_id from token with get_jwt_identity()                   │
│                                                                         │
│  Token expires after 24 hours (JWT_ACCESS_TOKEN_EXPIRES = 86400)       │
│  On expiry: frontend clears localStorage, fires auth_change event       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Complete User Booking Journey

Here's the step-by-step flow of booking a bus ticket, showing what happens on both the frontend and backend:

### Step 1: Search for Buses

```
User action:  Selects "Bengaluru → Mumbai" + date, clicks "Search Buses"
Frontend:     Navigates to /search?from=Bengaluru&to=Mumbai&date=2026-07-10
              Calls api.get("/buses/search?from=Bengaluru&to=Mumbai&date=2026-07-10")
Backend:      Joins Schedule + Route + Bus tables
              Filters by source, destination, date, bus status = Active
              Calculates live available seats (total - booked passengers)
              Returns sorted JSON array of matching schedules
Frontend:     Renders BusCard components for each result
```

### Step 2: Select Seats

```
User action:  Clicks "Select seats" on a bus card
Frontend:     Navigates to /bus/42 (where 42 = schedule_id)
              Calls api.get("/buses/schedule/42/seats")
Backend:      Generates full seat grid (lower + upper deck, 6 rows × 3 cols each)
              Checks which seats are booked by querying Passenger table
              Returns seat map + bus details + fare
Frontend:     Renders visual seat map with Available/Booked/Female/Selected states
              User clicks seats to select (max 6)
              Fare summary updates in real-time
```

### Step 3: Checkout

```
User action:  Clicks "Continue · ₹3148"
Frontend:     Navigates to /checkout?busId=42&seats=L11,L12&date=...
              Fetches schedule details for sidebar
              Pre-fills contact email/phone from stored user data
              Shows passenger form (name/age/gender for each seat)
              Shows payment method selector (UPI, Card, Wallet, Net Banking)
```

### Step 4: Payment & Confirmation

```
User action:  Fills passenger details, clicks "Pay ₹3148 securely"
Frontend:     Step 1 — POST /api/bookings
                Body: { schedule_id, seats, passengers, email, phone }
Backend:      Creates Booking (status: Pending)
              Creates Passenger records
              Returns booking_id + simulated Razorpay order ID

Frontend:     Step 2 — Simulates 1.5s Razorpay payment gateway interaction

Frontend:     Step 3 — POST /api/payments/verify
                Body: { booking_id, payment_method: "UPI", status: "Success" }
Backend:      Updates Booking status → "Confirmed"
              Creates Payment record (status: Success)
              Updates schedule available_seats count

Frontend:     Navigates to /confirmation/BG9X4K2A
              Shows booking details, QR code, download/email ticket buttons
```

### Step 5: Download Ticket

```
User action:  Clicks "Download PDF"
Frontend:     Calls api.getBlob("/tickets/BG9X4K2A/pdf")
Backend:      Generates PDF using ReportLab:
              - Blue header banner
              - Booking & travel details table
              - Route direction (departure → arrival)
              - Passenger list with seat numbers
              - QR code generated with booking data
              Returns PDF as binary blob
Frontend:     Creates download link, triggers browser download
```

---

## 10. Key Concepts for Beginners

### What is an API?

An **API** (Application Programming Interface) is a set of rules for how software communicates. In this project, the frontend sends HTTP requests to URLs like `/api/buses/search`, and the backend sends back structured data (JSON).

### What is JSON?

**JSON** (JavaScript Object Notation) is a text format for structured data. Example:

```json
{
  "bus_name": "VRL Travels",
  "bus_type": "AC Sleeper",
  "fare": 1499,
  "amenities": ["WiFi", "Blanket", "Water Bottle"]
}
```

### What is a JWT Token?

A **JWT** (JSON Web Token) is a signed string that proves your identity. After login, the server creates a token containing your `user_id`. On every subsequent request, you send this token in the `Authorization` header. The server verifies the signature to ensure it's genuine and hasn't been tampered with.

### What is an ORM?

An **ORM** (Object-Relational Mapper) like SQLAlchemy lets you work with databases using Python objects instead of writing SQL:

```python
# Instead of: SELECT * FROM users WHERE email = 'john@example.com'
# You write:
user = User.query.filter_by(email='john@example.com').first()
```

### What is CORS?

**CORS** (Cross-Origin Resource Sharing) is a browser security feature. By default, a page at `localhost:8080` can't make requests to `localhost:5000` (different ports = different "origins"). Flask-CORS tells the browser "it's OK, I trust this frontend."

### What are React Components?

Components are **reusable building blocks**. Instead of copying HTML for every bus card, you write one `BusCard` component and render it many times with different data:

```tsx
// One component definition...
function BusCard({ bus }) {
  return <div>{bus.operator} — ₹{bus.fare}</div>;
}

// ...used many times with different data
{results.map(bus => <BusCard key={bus.id} bus={bus} />)}
```

### What is State in React?

**State** is data that changes over time. When state changes, React re-renders the UI automatically:

```tsx
const [selected, setSelected] = useState<string[]>([]);
// When user clicks a seat:
setSelected([...selected, "L11"]);
// React automatically updates the UI to show the seat as selected
```

### What is a Responsive Design?

The app adapts to different screen sizes using Tailwind's responsive prefixes:

```
md:grid-cols-2   → On medium screens: 2 columns
lg:grid-cols-4   → On large screens: 4 columns
hidden md:flex   → Hidden on small screens, visible on medium+
```

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **Blueprint** | Flask's way of organizing routes into separate files |
| **Component** | A reusable UI building block in React |
| **CRUD** | Create, Read, Update, Delete — the four basic database operations |
| **Decorator** | A `@` annotation in Python that wraps a function (e.g., `@jwt_required()` checks auth before running the endpoint) |
| **Endpoint** | A specific URL + HTTP method that the backend responds to |
| **FK (Foreign Key)** | A column that references another table's primary key, creating a relationship |
| **Hook** | React functions that start with `use` — they let you "hook into" React features (state, effects, etc.) |
| **JWT** | JSON Web Token — a signed string used for authentication |
| **Middleware** | Code that runs between receiving a request and sending a response |
| **ORM** | Object-Relational Mapper — translates between Python objects and database rows |
| **Props** | Data passed from a parent component to a child component |
| **Query String** | The `?key=value&key2=value2` part of a URL |
| **REST API** | An API design style using HTTP methods (GET, POST, PUT, DELETE) on resource URLs |
| **Seed Data** | Pre-loaded sample data for development/testing |
| **SSR** | Server-Side Rendering — generating HTML on the server before sending to the browser |
| **State** | Data in a component that can change and triggers re-renders |
| **Token** | A credential string (JWT) sent with requests to prove identity |

---

> **Last updated**: July 2026 · Generated from full source code analysis
