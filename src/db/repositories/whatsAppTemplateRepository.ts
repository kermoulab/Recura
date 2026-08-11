import { Language, WhatsAppTemplate } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../../utils/whatsapp';

export interface WhatsAppTemplateRepository {
  /** Returns a complete set for all languages, or null when the database has no template rows. */
  fetchAll(): Promise<Record<Language, WhatsAppTemplate> | null>;
  save(templates: Record<Language, WhatsAppTemplate>): Promise<void>;
}

/** Raw row shape for the "WhatsAppTemplate" table. */
type WhatsAppTemplateRow = Record<string, any>;

export function createWhatsAppTemplateRepository(adapter: DatabaseAdapter): WhatsAppTemplateRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<WhatsAppTemplateRow>('WhatsAppTemplate');
        if (rows.length === 0) {
          return null;
        }

        const templates = {} as Record<Language, WhatsAppTemplate>;
        for (const row of rows) {
          const lang = row.language as Language;
          if (!lang) continue;
          templates[lang] = {
            language: lang,
            expiring3Days: row.expiring3Days || row.expiring_3_days || '',
            expired: row.expired || '',
            thanksClient:
              row.thanksClient || row.thanks_client || DEFAULT_WHATSAPP_TEMPLATES[lang]?.thanksClient || '',
          };
        }

        // Always return a complete set so all languages are available even if a
        // database row is missing (defaults are used as a safe fallback).
        const merged = {} as Record<Language, WhatsAppTemplate>;
        (['AR', 'FR', 'EN'] as Language[]).forEach((lang) => {
          merged[lang] = templates[lang] || { ...DEFAULT_WHATSAPP_TEMPLATES[lang] };
        });
        return merged;
      } catch (err) {
        console.warn('Failed to fetch WhatsApp templates:', err);
        return null;
      }
    },

    async save(templates) {
      const rows = (Object.keys(templates) as Language[]).map((lang) => ({
        language: lang,
        expiring3Days: templates[lang].expiring3Days,
        expired: templates[lang].expired,
        thanksClient: templates[lang].thanksClient,
        updatedAt: new Date().toISOString(),
      }));

      try {
        await adapter.upsert('WhatsAppTemplate', rows, 'language');
      } catch (err) {
        throw contextualizeError(err, 'Failed to save WhatsApp templates to database', 'WhatsAppTemplate', 'upsert');
      }
    },
  };
}
