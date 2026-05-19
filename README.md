# Hackathon Backend Starter

Express + Supabase. Full CRUD. Ready to adapt.

## Quick Start

```bash
npm install
cp .env.example .env   # then fill in your Supabase keys
npm run dev
```

## Endpoints (default: items table)

| Method | Route               | What it does       |
|--------|---------------------|--------------------|
| GET    | /api/example        | Get all items      |
| GET    | /api/example/:id    | Get one item       |
| POST   | /api/example        | Create item        |
| PATCH  | /api/example/:id    | Update item        |
| DELETE | /api/example/:id    | Delete item        |

## Supabase Table Setup

Run this SQL in your Supabase SQL editor:

```sql
create table items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);
```

## Adapting for a New Feature

1. Create `/src/controllers/yourFeature.js`
2. Create `/src/routes/yourFeature.js`
3. Mount it in `index.js`:
   ```js
   const yourFeatureRoutes = require("./src/routes/yourFeature");
   app.use("/api/your-feature", yourFeatureRoutes);
   ```

That's the whole pattern. Repeat for every feature.

## Deploy to Railway

1. Push to GitHub
2. New project on Railway → Deploy from GitHub
3. Add env variables (SUPABASE_URL, SUPABASE_ANON_KEY)
4. Done — live URL in under 5 minutes
