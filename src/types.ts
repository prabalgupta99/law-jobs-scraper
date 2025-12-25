export type SourceType = 'CAREERS' | 'NEWS' | 'LINKEDIN';

export interface Institution {
  id: string;
  name: string;
  state: string | null;
  city: string | null;
  website_url: string | null;
  careers_url: string | null;
  news_url: string | null;
  linkedin_url: string | null;
  nirf_rank: number | null;
  active: boolean;
}

export interface Source {
  id: string;
  institution_id: string;
  type: SourceType;
  url: string;
  title_selector: string | null;
  date_selector: string | null;
  link_selector: string | null;
  active: boolean;
}

export interface ParsedJob {
  title: string;
  apply_url: string;
  posted_date?: Date | null;
  last_date?: Date | null;
  role_type?: string | null;
  location?: string | null;
  department?: string | null;
  description?: string | null;
}
