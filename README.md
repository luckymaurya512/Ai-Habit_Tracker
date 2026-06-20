# AI Habit Tracker 🎯🤖

A modern, premium Habit Tracking application powered by AI (Google Gemini) to help users build consistency, analyze their patterns, and get personalized advice.

## 🚀 Key Features

*   **Habit Logging & Streaks**: Mark habits complete daily, view streaks, and see visual progress.
*   **AI Insights (Gemini)**:
    *   **Morning Motivation**: A personalized morning message based on your active habits and current streaks.
    *   **Weekly Reports**: A detailed analysis of what went well, struggles, and actionable feedback.
    *   **Recovery Plans**: Warm, 3-day recovery checklists suggested by AI when you break a habit streak.
    *   **Habit Suggestions**: Custom habit recommendations based on your goals, struggles, and peak productive times.
    *   **AI Coach Chat**: A conversational chat interface to query your habit history (e.g., *"Which day of the week am I most consistent?"*).
*   **Rich Analytics**: Beautiful interactive dashboards featuring completions charts, monthly trend bars, and interactive activity heatmaps.
*   **Premium UI**: Glassmorphism aesthetic, sleek animations, responsive layout, dark/light mode toggle, and celebratory confetti.

---

## 🛠️ Tech Stack

### Frontend (`/AiHabitTracker`)
*   **React (Vite)**
*   **Axios** (Configured with automated token refresh & 401 interception)
*   **TailwindCSS / Vanilla CSS**
*   **Lucide React** (Icons)
*   **Date-fns** (Date management)

### Backend (`/server`)
*   **Node.js / Express** (ES Modules)
*   **MongoDB (Mongoose)**
*   **JSON Web Tokens (JWT)** & **Bcrypt** (Secure authentication)
*   **Google Gen AI SDK** (`@google/genai`)

---

## ⚙️ Installation & Setup

### 1. Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or Atlas)
*   Google Gemini API Key

### 2. Backend Setup
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` directory and add the following:
    ```env
    PORT=8080
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    JWT_EXPIRES_IN=30d
    GEMINI_API_KEY=your_gemini_api_key
    GEMINI_MODEL=gemini-2.5-flash
    CLIENT_URL=http://localhost:5173
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

### 3. Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd ../AiHabitTracker
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `AiHabitTracker` directory:
    ```env
    VITE_API_URL=http://localhost:8080/api
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

---

## 📡 API Endpoints

### Auth
*   `POST /api/auth/register` - Create user
*   `POST /api/auth/login` - Authenticate user
*   `GET /api/auth/me` - Get profile

### Habits
*   `GET /api/habits` - Retrieve habits
*   `POST /api/habits` - Create habit
*   `PUT /api/habits/:id` - Edit habit
*   `DELETE /api/habits/:id` - Delete habit
*   `PUT /api/habits/:id/archive` - Archive habit

### Logs
*   `POST /api/logs` - Log habit completion
*   `DELETE /api/logs` - Remove completion
*   `GET /api/logs/today` - Today's logs
*   `GET /api/logs/range` - Logs in date range
*   `GET /api/logs/stats` - 30d completions stats

### AI
*   `POST /api/ai/weekly-report` - Generate weekly insight
*   `POST /api/ai/suggest-habits` - Custom suggestions
*   `POST /api/ai/recovery-plan` - Get 3-day streak recovery plan
*   `POST /api/ai/chat` - Chat with AI habit analyst
*   `GET /api/ai/morning` - Get morning motivation message
