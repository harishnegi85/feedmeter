# FeedMeter — Setup Guide

A free Mentimeter-like app built with Next.js + Supabase.

## Stack
- **Frontend + API**: Next.js 16 (App Router) — deployed on Vercel (free)
- **Database + Realtime + Auth**: Supabase (free tier)

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New project**, choose a name and region
3. Wait ~2 minutes for it to provision

---

## 2. Run the database schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy-paste the entire contents of `supabase/schema.sql`
4. Click **Run**

---

## 3. Get your API keys

In your Supabase dashboard go to **Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 4. Set up environment variables

### Local development
```bash
cp .env.example .env.local
# Then edit .env.local with your values
```

### Vercel (production)
In your Vercel project → **Settings → Environment Variables**, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 5. Enable Email Auth in Supabase

1. Go to **Authentication → Providers**
2. Confirm **Email** is enabled
3. For local dev you can disable "Confirm email" under **Authentication → Settings** so you can sign up instantly without email confirmation

---

## 6. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 7. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or push to GitHub and import the repo on [vercel.com](https://vercel.com) — it auto-detects Next.js.

---

## How to use

### As a presenter
1. Go to `/auth/login` and create an account
2. Click **+ New Session** on your dashboard
3. Add questions (MCQ, Rating, Word Cloud, or Open Text)
4. Click **Create & Start Session**
5. Share the 6-letter code or the `/join/CODE` URL with your audience
6. Click **Present Live** to see results in real-time

### As an audience member
1. Go to `/join` and enter the session code
2. Answer each question as the presenter advances slides
3. No account or app needed

---

## Free tier limits

| Service | Limit |
|---|---|
| Vercel | 100 GB bandwidth/month, unlimited deploys |
| Supabase DB | 500 MB storage |
| Supabase Realtime | 200 concurrent connections |
| Supabase Auth | Unlimited users |

Supabase projects pause after **1 week of inactivity** on the free tier. To prevent this, ping your app at least once a week, or upgrade to the $25/month Pro plan.
