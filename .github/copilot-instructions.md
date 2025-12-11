# SKDCore Simulasi - Copilot Instructions

## Project Overview
**SKDCore Simulasi** is a Vite + React exam simulation platform for SKD (civil service exam) preparation. It's a fast MVP supporting user registration, multi-mode exam practice (TWK, TIU, TKP), score tracking, and admin management.

**Key Tech Stack:**
- Frontend: React 18 + React Router v6 + Tailwind CSS
- Storage: localStorage + Firebase (auth/Firestore optional, see `src/services/firebase.js`)
- Build: Vite (dev: `npm run dev` → http://localhost:5173)

---

## Architecture & Critical Data Flows

### 1. Authentication & Role System
**Location:** `src/utils/auth.js` (primary) + `src/services/auth.js` (Firebase fallback)

- **Default admin:** hardcoded `admin@skdcore.local` / `admin123` in `loginUser()`
- **User roles:** `"user"` (normal student) or `"admin"` (manages exams/users)
- **Session state:** Stored in `localStorage` under `skdcore_current_user` key
- **Route protection:** App.jsx uses `RequireAuth` wrapper to check `getCurrentUser()` and verify role
- **Flow:** Login → `setCurrentUser()` → stored in localStorage → used by Dashboard & AdminDashboard

**Important:** `getCurrentUser()` returns null-safe—always check before rendering user-specific content.

### 2. Question Bank & Exam Data
**Location:** `src/pages/Simulasi.jsx` (exam logic) + localStorage keys

- **Question storage key:** `skdcore_question_bank_v1` (JSON array in localStorage)
- **Question schema:** Each question has `id`, `category` (TWK/TIU/TKP), `question` text, `options` array with `{id, text, score}`
- **Fallback:** If no questions imported, `DEFAULT_QUESTIONS` (3 examples) loaded in Simulasi.jsx
- **Admin import:** AdminDashboard.jsx parses CSV and stores via `parseCSVFile()` utility
- **CSV parsing:** `src/utils/parseCSV.js` - handles quoted fields and escapes

### 3. Exam Flow & Scoring
**Location:** `src/pages/Simulasi.jsx` (main logic)

- **Time limits per mode:**
  - TWK: 28 minutes
  - TIU: 32 minutes
  - TKP: 41 minutes
  - Full exam (all): 100 minutes
- **Answer tracking:** In-memory state `answers: { [questionIndex]: selectedOptionId }`
- **Result calculation:** For each category, sum the `score` values from selected options
- **History storage key:** `skdcore_simulasi_history_v1` (array of results with userEmail, timestamps, scores)
- **Session save:** `skdcore_simulasi_state_v1_${mode}` persists current position & answers

### 4. Data Isolation & Multi-User
- **Users stored in:** `localStorage.skdcore_users` (JSON array)
- **Dashboard filters history:** Admins see all; regular users see only their own exams (filtered by `userEmail`)
- **Admin stats:** Aggregate all users' results; display in AdminDashboard tabs
- **Important:** When adding features, always filter results by `userEmail` for non-admins

---

## Project Structure & Key Files

```
src/
├── App.jsx                    # Routes & RequireAuth wrapper
├── main.jsx                   # React entry point
├── index.css                  # Tailwind directives
├── pages/
│   ├── Dashboard.jsx          # User home – shows exam history & averages
│   ├── Simulasi.jsx           # **Core exam logic** (565 lines)
│   ├── HasilSimulasi.jsx      # Results detail view
│   ├── AdminDashboard.jsx     # **Admin panel** (586 lines) – user mgmt, CSV import
│   ├── Login.jsx              # Auth page
│   └── Register.jsx           # User signup
├── components/
│   ├── ThemeToggle.jsx        # Dark mode (uses localStorage `skdcore_theme`)
│   ├── Navbar.jsx             # Navigation
│   └── UserDropdown.jsx       # User menu
├── services/
│   ├── firebase.js            # Firebase init (reads VITE_* env vars)
│   ├── auth.js                # Firebase auth functions
│   └── exam.js                # Placeholder for exam endpoints
├── utils/
│   ├── auth.js                # localStorage-based auth helpers
│   ├── scoring.js             # Score calculation (stub)
│   └── parseCSV.js            # CSV parsing for question import
└── assets/
    └── skdcore-logo.png       # Logo asset
```

---

## Developer Workflows

### 1. Setup & Development
```powershell
npm install
npm run dev  # Vite dev server on http://localhost:5173
npm run build
npm run preview
```

### 2. Adding Exam Questions
- **Via Admin UI - Import JSON:** AdminDashboard → "Import JSON soal" → parses with full structure → stores to `skdcore_question_bank_v1`
- **Via Admin UI - Import JSON per Mode:** AdminDashboard → "📁 Import JSON per mode" → select mode (TWK/TIU/TKP/all) → auto-filter soal by category
- **Via Admin UI - Manual Input 10 soal:** AdminDashboard → "+ Input 10 soal manual" → modal form dengan 10 baris untuk input soal
- **Manual localStorage:** Open DevTools console, paste: `localStorage.setItem("skdcore_question_bank_v1", JSON.stringify([...questions]))`
- **JSON format:** Lihat `public/PANDUAN_IMPORT.md` dan `public/sample-questions.json` untuk contoh lengkap
  - TWK/TIU: 1 opsi score=5 (benar), sisanya score=0
  - TKP: semua opsi score 1-5 sesuai tingkat kesesuaian

### 3. Extending Scoring Logic
- Edit `src/pages/Simulasi.jsx` in `saveResult()` function (around line 450)
- `result` object shape: `{ TWK: score, TIU: score, TKP: score, timestamp, userEmail, mode }`
- For TKP (variable scoring), option `score` field holds point value; for TWK/TIU, correct option has score=5

### 4. Adding New Pages
- Create in `src/pages/NewPage.jsx`
- Add route in `App.jsx` → wrap with `<RequireAuth>` if protected
- Link from `Navbar.jsx` or other nav components

### 5. Theme & Styling
- **CSS:** Tailwind + `src/index.css` (base utilities)
- **Dark mode:** Controlled by ThemeToggle.jsx, persists via `localStorage.skdcore_theme`
- **Dark classes:** Use `dark:` prefix (e.g., `dark:bg-slate-950`)
- **Config:** `tailwind.config.cjs` – `darkMode: "class"` requires `<html class="dark">`

---

## Critical Patterns & Conventions

### 1. localStorage Keys (Namespace: `skdcore_`)
Always prefix with `skdcore_` to avoid conflicts:
```javascript
const HISTORY_KEY = "skdcore_simulasi_history_v1";
const QUESTION_BANK_KEY = "skdcore_question_bank_v1";
const CURRENT_USER_KEY = "skdcore_current_user";
const USERS_KEY = "skdcore_users";
```

### 2. User Filtering in Aggregations
Default pattern in Dashboard.jsx:
```javascript
const filtered = u.role === "admin" 
  ? parsed 
  : parsed.filter((h) => !h.userEmail || h.userEmail === u.email);
```
Always apply this when aggregating history/results.

### 3. Time Formatting
Use `toLocaleString("id-ID", {...})` for Indonesian locale (e.g., dates in Dashboard).

### 4. Error Handling
All localStorage reads wrapped in try/catch returning sensible defaults (empty array/null).

### 5. SSR Safety
Always check `typeof window !== "undefined"` before accessing localStorage, DOM.

### 6. Environment Variables
Firebase config uses Vite's `import.meta.env.VITE_*` pattern. Create `.env.local`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
```

---

## Integration Points & External Dependencies

- **Firebase:** Optional; auth.js & firebase.js available but unused in current localStorage setup
- **dayjs:** Imported but not actively used yet (see package.json)
- **React Router:** Route params via `useParams()` (e.g., `/simulasi/:mode`)
- **Form handling:** Plain HTML forms + `useState` (no form libraries)

---

## Testing & Debugging

**Test accounts:**
- Admin: `admin@skdcore.local` / `admin123`
- Or register new user via Register page

**DevTools tips:**
- Inspect localStorage: `localStorage` in console
- Clear data: `localStorage.clear()` (resets all)
- Check network: Firebase calls in Network tab if enabled
- View current user: `JSON.parse(localStorage.getItem("skdcore_current_user"))`

---

## Common Pitfalls & Gotchas

1. **Forgetting to check `getCurrentUser()` in useEffect** → infinite redirects to /login
2. **Not filtering history by `userEmail` for non-admins** → users see others' results
3. **localStorage quota exceeded** → large question banks can hit 5-10MB limit; consider Firestore
4. **Timestamps without timezone** → always use `.toISOString()` for consistency
5. **Mode parameter case sensitivity** → normalize with `.toLowerCase()` in Simulasi.jsx
6. **CSV import without validation** → missing categories or malformed rows break scoring

---

## Next Steps for New Contributors

1. **Understand the exam flow:** Read Simulasi.jsx line-by-line (timer, answer tracking, result submission)
2. **Test user roles:** Log in as admin vs. regular user; verify data isolation
3. **Try CSV import:** AdminDashboard → upload test questions; verify parsing
4. **Extend scoring:** Add custom logic in `saveResult()` for new grading rules
5. **Add features:** Always check `getCurrentUser()` and apply role-based filtering
