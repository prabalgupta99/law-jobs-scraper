import * as cheerio from 'cheerio';
import type { ParsedJob, Source } from '../types';

export function parseJobsFromHtml(html: string, source: Source): ParsedJob[] {
  const $ = cheerio.load(html);
  const jobs: ParsedJob[] = [];

  if (!source.title_selector) return jobs;

  $(source.title_selector).each((_, el) => {
    const title = $(el).text().trim();
    if (!title) return;

    let applyUrl = '';
    if (source.link_selector) {
      const linkEl = $(el).closest(source.link_selector).length
        ? $(el).closest(source.link_selector)
        : $(el).find(source.link_selector);
      const href = linkEl.attr('href') || $(el).attr('href');
      applyUrl = href ? new URL(href, source.url).href : source.url;
    } else {
      const href = $(el).attr('href');
      applyUrl = href ? new URL(href, source.url).href : source.url;
    }

    let postedDate: Date | null = null;
    if (source.date_selector) {
      const dateText =
        $(el).closest(source.date_selector).text().trim() ||
        $(el).siblings(source.date_selector).text().trim();
      postedDate = parseDateLoose(dateText);
    }

    jobs.push({
      title,
      apply_url: applyUrl,
      posted_date: postedDate,
      last_date: null
    });
  });

  return jobs;
}

function parseDateLoose(text: string | undefined | null): Date | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const parsed = Date.parse(cleaned);
  if (!Number.isNaN(parsed)) return new Date(parsed);

  const m = cleaned.match(
    /(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})/
  );
  if (m) {
    const [_, d, mo, y] = m;
    const year = y.length === 2 ? `20${y}` : y;
    const iso = `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const p2 = Date.parse(iso);
    if (!Number.isNaN(p2)) return new Date(p2);
  }
  return null;
}
