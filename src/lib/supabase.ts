import { createClient } from '@supabase/supabase-js';
import type { ParsedJob, Source } from '../types';
import crypto from 'node:crypto';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

export async function getActiveSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('active', true);

  if (error) throw error;
  return data as Source[];
}

export function computeJobHash(params: {
  institution_id: string;
  title: string;
  last_date?: Date | null;
  url: string;
}): string {
  const payload = [
    params.institution_id,
    params.title.trim().toLowerCase(),
    params.last_date ? params.last_date.toISOString().slice(0, 10) : '',
    params.url.trim().toLowerCase()
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function upsertJobsForSource(
  source: Source,
  jobs: ParsedJob[]
): Promise<void> {
  if (!jobs.length) return;

  const rows = jobs.map((job) => {
    const hash = computeJobHash({
      institution_id: source.institution_id,
      title: job.title,
      last_date: job.last_date ?? null,
      url: job.apply_url
    });

    return {
      institution_id: source.institution_id,
      source_id: source.id,
      title: job.title,
      role_type: job.role_type ?? null,
      location: job.location ?? null,
      department: job.department ?? null,
      description: job.description ?? null,
      apply_url: job.apply_url,
      posted_date: job.posted_date ?? null,
      last_date: job.last_date ?? null,
      hash,
      raw_source_url: source.url,
      status: 'active'
    };
  });

  const { error } = await supabase
    .from('job_openings')
    .insert(rows, { upsert: false });

  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function logFailure(params: {
  institution_id: string | null;
  source_id: string | null;
  url: string;
  error_message: string;
}) {
  try {
    await supabase.from('logs').insert({
      institution_id: params.institution_id,
      source_id: params.source_id,
      url: params.url,
      error_message: params.error_message,
      created_at: new Date().toISOString()
    } as any);
  } catch {
    // swallow
  }
}
