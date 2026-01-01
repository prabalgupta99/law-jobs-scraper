# Law Jobs Scraper

Daily, fully automated scraper for job openings from Indian law colleges into Supabase.

## Tech stack

- Node.js 20 + TypeScript
- Playwright (headless Chromium)
- Cheerio for HTML parsing
- Supabase Postgres (free tier)
- GitHub Actions (public repo → unlimited minutes)

## Setup

### 1. Create Supabase project

- Go to [supabase.com](https://supabase.com) and create a free project
- Run this SQL in the SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT,
  city TEXT,
  website_url TEXT,
  careers_url TEXT,
  news_url TEXT,
  linkedin_url TEXT,
  nirf_rank INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  type TEXT CHECK (type IN ('CAREERS', 'NEWS', 'LINKEDIN')),
  url TEXT NOT NULL,
  title_selector TEXT,
  date_selector TEXT,
  link_selector TEXT,
  active BOOLEAN DEFAULT true
);

CREATE TABLE job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  source_id UUID REFERENCES sources(id),
  title TEXT,
  role_type TEXT,
  location TEXT,
  department TEXT,
  description TEXT,
  apply_url TEXT,
  posted_date TIMESTAMP,
  last_date TIMESTAMP,
  hash TEXT UNIQUE,
  raw_source_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX ON job_openings(institution_id, hash);
CREATE INDEX ON job_openings(created_at);
CREATE INDEX ON job_openings(status, last_date);

CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID,
  source_id UUID,
  url TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### 2. Get Supabase credentials

- Project URL: Settings → API Settings → URL (e.g., `https://xxxxx.supabase.co`)
- Anon Key: Settings → API Keys → Publishable key

### 3. Add GitHub Secrets

Go to repo Settings → Secrets and variables → Actions:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 4. Run locally

```bash
npm install
export SUPABASE_URL=your_url
export SUPABASE_ANON_KEY=your_key
npm run bootstrap   # seed sample institutions
npm run scrape-all  # run scraper
```

### 5. Enable workflow

- Repo must be PUBLIC for unlimited GitHub Actions minutes
- Go to Actions tab → Daily Law Jobs Scraper → Run workflow
- Scraper runs daily at 4:00 AM UTC

## Architecture

- `src/scrape-all.ts` - Main scraper that reads sources from DB, scrapes, dedupes
- `src/bootstrap.ts` - Seed institutions and sources
- `src/lib/supabase.ts` - Database utilities
- `src/lib/parser.ts` - HTML parsing with CSS selectors
- `src/types.ts` - TypeScript interfaces

## Features

✓ Playwright headless browser (handles JS sites)
✓ CSS selector-based parsing
✓ SHA256 deduplication
✓ Rate limiting (1 req/sec)
✓ Error logging
✓ Concurrent scraping (max 5)
✓ Free tier (GitHub Actions + Supabase)

## Extending to 1,500+ colleges

Edit `src/bootstrap.ts` and add rows to the `seed` array with:
- College name
- Careers/news URL
- CSS selectors (title, date, link)


# Workflow YAML syntax fixed - Jan 1, 2026
Then run `npm run bootstrap` to load into Supabase.
