# MaxxGym — Full Project Plan
**Premium Gym Management Web Application**
*Yellow & Black Theme · React + Firebase · Mobile-First*

---

## 1. Project Overview

MaxxGym is a professional gym management SaaS product that replaces physical workout cards. Trainers manage clients and assign workout plans digitally; clients view their assigned workouts on their phones.

| Role | Platform Target | Primary Use |
|---|---|---|
| Trainer | Desktop + Mobile | Manage clients, assign workouts |
| Client | Mobile Only (portrait) | View assigned workout split |

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast, component-based |
| Styling | Tailwind CSS v3 | Utility-first, rapid responsive design |
| Auth & DB | Firebase (Auth + Firestore) | Free tier, real-time, easy setup |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` | Modern, touch-friendly, accessible |
| Routing | React Router v6 | SPA navigation |
| Notifications | react-hot-toast | Lightweight toast system |
| Icons | lucide-react | Clean, consistent icons |
| Fonts | Google Fonts — `Bebas Neue` (display) + `DM Sans` (body) | Gym/athletic feel |

---

## 3. Project File Structure

```
maxxgym/
├── public/
│   └── logo.svg                  # MaxxGym logo placeholder
├── src/
│   ├── main.jsx
│   ├── App.jsx                   # Root router
│   ├── firebase.js               # Firebase config & exports
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx       # Global auth state (user, role, loading)
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.jsx    # Role-based route guard
│   │   └── RoleRedirect.jsx      # Redirect by role after login
│   │
│   ├── pages/
│   │   ├── Landing.jsx           # Public landing / role selector
│   │   ├── TrainerAuth.jsx       # Trainer login + signup
│   │   ├── ClientAuth.jsx        # Client login + signup
│   │   ├── TrainerDashboard.jsx  # Trainer home — client list
│   │   ├── AssignWorkout.jsx     # Drag-and-drop workout builder
│   │   └── ClientDashboard.jsx   # Client workout viewer
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TrainerSidebar.jsx      # Collapsible sidebar (desktop + mobile)
│   │   │   ├── MobileNav.jsx           # Bottom nav bar for trainer mobile
│   │   │   └── TopBar.jsx              # Top header with logo + user avatar
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── SignupForm.jsx
│   │   │
│   │   ├── trainer/
│   │   │   ├── ClientCard.jsx          # Client summary card
│   │   │   └── ClientGrid.jsx          # Responsive grid of client cards
│   │   │
│   │   ├── workout/
│   │   │   ├── MuscleGroupTabs.jsx     # Tab bar: Chest / Back / etc.
│   │   │   ├── ExerciseLibraryPanel.jsx # Left panel — draggable exercises
│   │   │   ├── DraggableExercise.jsx   # Single draggable exercise chip
│   │   │   ├── WorkoutPlanDropzone.jsx # Right panel — drop zone + ordered plan
│   │   │   ├── WorkoutCard.jsx         # Card in the plan (sets/reps/notes)
│   │   │   └── SetRepEditor.jsx        # Inline set/rep/notes editor
│   │   │
│   │   └── client/
│   │       ├── MuscleGroupSection.jsx  # Collapsible section per muscle group
│   │       └── ExerciseDetailCard.jsx  # Exercise card shown to client
│   │
│   ├── data/
│   │   └── exercises.js          # Static exercise library by muscle group
│   │
│   ├── hooks/
│   │   ├── useClients.js         # Firestore — fetch trainer's clients
│   │   ├── useWorkoutPlan.js     # Firestore — get/set a client's plan
│   │   └── useAuth.js            # Shortcut to AuthContext
│   │
│   └── styles/
│       └── globals.css           # Tailwind directives + custom CSS variables
│
├── tailwind.config.js
├── vite.config.js
├── .env                          # VITE_FIREBASE_* keys
└── package.json
```

---

## 4. Firebase Setup

### 4.1 Authentication
- Enable **Email/Password** provider in Firebase Console
- Each user document stores a `role` field: `"trainer"` | `"client"`
- Trainers can optionally have a `gymCode` so clients join their gym

### 4.2 Firestore Collections

```
users/
  {uid}/
    displayName: string
    email: string
    role: "trainer" | "client"
    trainerId: string          # (client only) linked trainer uid
    createdAt: timestamp

workoutPlans/
  {clientUid}/
    assignedBy: trainerUid
    lastUpdated: timestamp
    plan: [
      {
        id: string             # unique exercise instance id
        exerciseId: string     # reference to static library
        name: string
        muscleGroup: string
        sets: number
        reps: string           # e.g. "8-12" or "15"
        notes: string
        order: number
      }
    ]
```

### 4.3 Firestore Security Rules (summary)
- Trainers can read/write `workoutPlans/{clientUid}` only if `users/{clientUid}.trainerId == request.auth.uid`
- Clients can only read `workoutPlans/{their own uid}`
- Users can only read/write their own `users/{uid}` document

---

## 5. Page-by-Page Breakdown

### 5.1 Landing Page (`/`)
- Full-screen black hero
- MaxxGym logo + tagline: *"Train Smarter. Track Everything."*
- Two CTA buttons: **"I'm a Trainer"** → `/trainer/auth` | **"I'm a Client"** → `/client/auth`
- Subtle animated background (repeating diagonal stripe / noise texture)

---

### 5.2 Trainer Auth (`/trainer/auth`)

**Desktop:** Split-screen — left: branding/graphic panel, right: form card  
**Mobile:** Single centered card, scrollable

- Toggle: Login / Sign Up
- Fields: Name (signup only), Email, Password, Confirm Password (signup)
- On signup: creates `users/{uid}` with `role: "trainer"`
- On login: validates role === "trainer", else shows error toast
- Yellow submit button, black inputs, gray placeholder text
- Animated form transition between login ↔ signup

---

### 5.3 Client Auth (`/client/auth`)

**Mobile only** (max-width: 430px centered layout, mimics a phone app screen)

- Toggle: Login / Sign Up  
- Sign Up extra field: **Trainer Code** (trainer's uid or a short code) → sets `trainerId`
- Same visual style as trainer auth but taller/narrower card
- Yellow accents, smooth slide animation

---

### 5.4 Trainer Dashboard (`/trainer/dashboard`)

**Layout (Desktop):**
```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (240px)  │  Main Content Area                  │
│  - MaxxGym Logo   │  Header: "My Clients"  + search bar │
│  - Dashboard      │                                     │
│  - Clients        │  Grid of Client Cards (3 columns)   │
│  - Settings       │                                     │
└─────────────────────────────────────────────────────────┘
```

**Layout (Mobile):**
- Top bar with hamburger menu
- Drawer sidebar (slides in from left)
- Bottom navigation bar: Home | Clients | Profile
- Single column client cards

**Client Card contains:**
- Avatar (initials-based colored circle)
- Client name + email
- "Workout Assigned" badge (yellow) or "No Plan Yet" (gray)
- **"Assign Workout"** button → navigates to `/trainer/assign/{clientId}`

---

### 5.5 Workout Assignment (`/trainer/assign/:clientId`)

**The core feature. Desktop-optimized with mobile fallback.**

**Desktop Layout (two-panel):**
```
┌──────────────────────────────┬──────────────────────────┐
│  Exercise Library            │  Client's Workout Plan   │
│  [Muscle Group Tabs]         │  [Chest] [Back] [Legs]…  │
│                              │                          │
│  • Bench Press        [drag] │  1. Bench Press          │
│  • Incline DB Press   [drag] │     Sets: 4  Reps: 8-12  │
│  • Chest Fly          [drag] │     Notes: ___           │
│  • Push Ups           [drag] │                          │
│                              │  2. Incline DB Press     │
│                              │     Sets: 3  Reps: 10    │
│                              │     [drag to reorder]    │
│                              │                          │
│                              │  [Save Plan] button      │
└──────────────────────────────┴──────────────────────────┘
```

**Mobile Layout (stacked, tab-switched):**
- Tab 1: "Library" — scrollable exercise list with **+ Add** buttons
- Tab 2: "Plan" — reorderable list with sets/reps editors
- Sticky **Save** button at bottom

**DnD behavior:**
- Library → Plan: copy exercise into plan
- Plan → Plan: reorder (sortable)
- Each plan card: inline number inputs for Sets, Reps + text Notes
- Pressing ✕ removes exercise from plan

**On Save:**
- Writes to `workoutPlans/{clientId}` in Firestore
- Shows success toast: *"Workout plan saved for [Name]!"*

---

### 5.6 Client Dashboard (`/client/dashboard`)

**Mobile-only layout (max 430px, centered, portrait)**

Mimics a native fitness app:

```
┌──────────────────────────┐
│  MaxxGym     [Avatar]    │  ← Top bar
├──────────────────────────┤
│  Hey, Marcus 💪          │
│  Your workout plan       │
├──────────────────────────┤
│  [CHEST]                 │  ← Collapsible section
│  ┌────────────────────┐  │
│  │ Bench Press        │  │  ← Exercise card
│  │ 4 sets × 8-12 reps │  │
│  │ Note: Full ROM     │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ Incline DB Press   │  │
│  │ 3 sets × 10 reps   │  │
│  └────────────────────┘  │
├──────────────────────────┤
│  [BACK] ▸                │  ← Collapsed
│  [SHOULDER] ▸            │
│  [BICEPS] ▸              │
│  [TRICEPS] ▸             │
│  [LEGS] ▸                │
└──────────────────────────┘
```

- Yellow section headers
- Smooth expand/collapse animation
- Card shows: exercise name, sets × reps, trainer notes (if any)
- Empty state: *"No workout assigned yet. Ask your trainer!"*

---

## 6. Exercise Library (Static Data)

```js
// src/data/exercises.js
export const exerciseLibrary = {
  chest: [
    { id: 'ch1', name: 'Bench Press', muscleGroup: 'chest' },
    { id: 'ch2', name: 'Incline Dumbbell Press', muscleGroup: 'chest' },
    { id: 'ch3', name: 'Chest Fly', muscleGroup: 'chest' },
    { id: 'ch4', name: 'Push Ups', muscleGroup: 'chest' },
  ],
  back: [
    { id: 'bk1', name: 'Lat Pulldown', muscleGroup: 'back' },
    { id: 'bk2', name: 'Barbell Row', muscleGroup: 'back' },
    { id: 'bk3', name: 'Seated Cable Row', muscleGroup: 'back' },
    { id: 'bk4', name: 'Pull Ups', muscleGroup: 'back' },
  ],
  shoulder: [
    { id: 'sh1', name: 'Shoulder Press', muscleGroup: 'shoulder' },
    { id: 'sh2', name: 'Lateral Raise', muscleGroup: 'shoulder' },
    { id: 'sh3', name: 'Rear Delt Fly', muscleGroup: 'shoulder' },
    { id: 'sh4', name: 'Front Raise', muscleGroup: 'shoulder' },
  ],
  biceps: [
    { id: 'bi1', name: 'Barbell Curl', muscleGroup: 'biceps' },
    { id: 'bi2', name: 'Hammer Curl', muscleGroup: 'biceps' },
    { id: 'bi3', name: 'Preacher Curl', muscleGroup: 'biceps' },
  ],
  triceps: [
    { id: 'tr1', name: 'Rope Pushdown', muscleGroup: 'triceps' },
    { id: 'tr2', name: 'Skull Crushers', muscleGroup: 'triceps' },
    { id: 'tr3', name: 'Dips', muscleGroup: 'triceps' },
  ],
  legs: [
    { id: 'lg1', name: 'Squats', muscleGroup: 'legs' },
    { id: 'lg2', name: 'Leg Press', muscleGroup: 'legs' },
    { id: 'lg3', name: 'Romanian Deadlift', muscleGroup: 'legs' },
    { id: 'lg4', name: 'Leg Curl', muscleGroup: 'legs' },
    { id: 'lg5', name: 'Calf Raise', muscleGroup: 'legs' },
  ],
};
```

---

## 7. Design System

### Colors
```css
--color-primary:     #FFD000;   /* Yellow — buttons, highlights, accents */
--color-primary-dim: #C9A200;   /* Darker yellow for hover */
--color-bg:          #0B0B0B;   /* Main background */
--color-surface:     #141414;   /* Card background */
--color-surface-2:   #1E1E1E;   /* Elevated surface */
--color-border:      #2A2A2A;   /* Subtle borders */
--color-text:        #F5F5F5;   /* Primary text */
--color-muted:       #888888;   /* Secondary text */
```

### Typography
- **Display / Headings:** `Bebas Neue` — bold, condensed, gym aesthetic
- **Body / UI:** `DM Sans` — clean, readable, modern

### Component Tokens
- Border radius: `8px` (cards), `4px` (inputs), `9999px` (pills/badges)
- Card shadow: `0 0 0 1px var(--color-border)`
- Primary button: yellow bg, black text, bold, uppercase, letter-spacing
- Hover lift: `transform: translateY(-2px)` + shadow increase

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Trainer UI | Client UI |
|---|---|---|---|
| Mobile | < 640px | Drawer sidebar + bottom nav | Full layout |
| Tablet | 640–1024px | Collapsed sidebar | N/A |
| Desktop | > 1024px | Full sidebar | N/A |

Client dashboard is **locked to mobile** with `max-width: 430px` centered on desktop — intentional, simulates app feel.

---

## 9. Setup & Deployment Steps

### Step 1 — Create Project
```bash
npm create vite@latest maxxgym -- --template react
cd maxxgym
npm install
```

### Step 2 — Install Dependencies
```bash
npm install tailwindcss @tailwindcss/vite
npm install firebase
npm install react-router-dom
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-hot-toast
npm install lucide-react
```

### Step 3 — Firebase Project
1. Go to https://console.firebase.google.com
2. Create project: `maxxgym`
3. Enable **Authentication → Email/Password**
4. Create **Firestore Database** (start in test mode, add rules later)
5. Copy config to `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Step 4 — Build & Deploy
```bash
npm run build
# Deploy to Firebase Hosting or Vercel
firebase deploy   # or: vercel --prod
```

---

## 10. Future Features Roadmap

| Phase | Feature | Notes |
|---|---|---|
| v1.1 | Progress Tracking | Log sets completed, weight used per session |
| v1.2 | In-App Messaging | Trainer ↔ Client chat via Firestore |
| v1.3 | Achievement Badges | Milestone system (7-day streak, 50 workouts, etc.) |
| v2.0 | Diet Plans | Trainer assigns meal plans alongside workouts |
| v2.1 | Subscription/Payments | Stripe integration, trainer subscription tiers |
| v2.2 | Multiple Gyms | Gym owner role above trainer |
| v3.0 | Native App | React Native port of client dashboard |

---

## 11. Security Checklist

- [ ] Firestore rules: trainers only write to their clients' plans
- [ ] Firestore rules: clients only read their own plan
- [ ] Email verification on signup
- [ ] Role stored server-side (Firestore), not just client state
- [ ] `.env` not committed to git (add to `.gitignore`)
- [ ] API keys restricted in Firebase console to your domain

---

## 12. Build Order (Recommended)

Build in this sequence to always have a working app at each step:

1. **Firebase setup + AuthContext** — auth works, roles stored
2. **Landing page + Auth pages** — login/signup for both roles
3. **Protected routes + role redirect** — routing works end-to-end
4. **Trainer Dashboard** — client list renders from Firestore
5. **Exercise library data** — static file ready
6. **Workout Assignment page** — drag-and-drop builder + save to Firestore
7. **Client Dashboard** — reads and displays plan
8. **Polish** — animations, skeletons, toasts, responsive fixes

---

*MaxxGym Project Plan — v1.0*  
*Prepared for development handoff*
