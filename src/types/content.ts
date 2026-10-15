export type Locale = 'pt-BR' | 'en';

export interface PublicContentItem {
  claim_id: string;
  site_section_id: string;
  content_type: string;
  translations: Record<Locale, { text: string }>;
  url?: string;
}

export interface PublicContent {
  schema_version: '1.1';
  items: PublicContentItem[];
}
