# How to Run

## Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- An [OpenAI](https://platform.openai.com) API key

---

## 1. Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Once created: **SQL Editor → New query** → paste the entire contents of `backend/migrations/schema.sql` → **Run**
3. Go to **Project Settings → Database** and copy your connection strings

---

## 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create your .env file
copy .env.example .env
```

Open `backend/.env` and fill in:

```env
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
ASYNC_DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<ref>.supabase.co:5432/postgres
OPENAI_API_KEY=sk-...
```

Then run:

```bash
uvicorn app.main:app --reload
```

- API: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`

---

## 3. Frontend

```bash
cd frontend

# Create your .env.local
copy .env.example .env.local

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

- App: `http://localhost:3000`

---

## Running Both Together

Open two terminals — one for the backend, one for the frontend. Both must be running at the same time.
