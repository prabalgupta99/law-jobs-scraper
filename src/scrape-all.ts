import { chromium } from '@playwright/test';
import pLimit from 'p-limit';
import { setTimeout as wait } from 'node:timers/promises';
import { getActiveSources, logFailure, upsertJobsForSource } from './lib/supabase';
import { parseJobsFromHtml } from './lib/parser';

const RATE_PER_SEC = 1;
const PER_COLLEGE_DELAY_MS = 5000;
const MAX_CONCURRENCY = 5;

async function main() {
  const sources = await getActiveSources();
  console.log(`Found ${sources.length} active sources`);

  const browser = await chromium.launch({ headless: true });
  const limit = pLimit(MAX_CONCURRENCY);

  const byInstitution = new Map<string, typeof sources>();
  for (const s of sources) {
    const list = byInstitution.get(s.institution_id) ?? [];
    list.push(s);
    byInstitution.set(s.institution_id, list);
  }

  for (const [institutionId, instSources] of byInstitution.entries()) {
    console.log(`Scraping institution ${institutionId} with ${instSources.length} sources`);

    const tasks = instSources.map((source, idx) =>
      limit(async () => {
        await wait((1000 / RATE_PER_SEC) * idx);

        const page = await browser.newPage({
          userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
        });

        try {
          console.log(`Visiting ${source.url}`);
          await page.goto(source.url, {
            waitUntil: 'networkidle',
            timeout: 60000
          });

          const html = await page.content();
          const jobs = parseJobsFromHtml(html, source);
          console.log(`Parsed ${jobs.length} jobs from ${source.url}`);

          if (jobs.length) {
            await upsertJobsForSource(source, jobs);
          }
        } catch (err: any) {
          console.error('Scrape error', source.url, err?.message);
          await logFailure({
            institution_id: source.institution_id,
            source_id: source.id,
            url: source.url,
            error_message: String(err?.message || err)
          });
        } finally {
          await page.close();
        }
      })
    );

    await Promise.all(tasks);
    console.log(`Done institution ${institutionId}, waiting 5s...`);
    await wait(PER_COLLEGE_DELAY_MS);
  }

  await browser.close();
  console.log('All done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
