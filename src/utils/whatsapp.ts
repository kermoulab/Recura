import { Language, WhatsAppTemplate } from '../types/erp';

export const DEFAULT_WHATSAPP_TEMPLATES: Record<Language, WhatsAppTemplate> = {
  AR: {
    language: 'AR',
    expiring3Days: 'مرحباً {{name}}، نود تذكيركم بأن اشتراككم {{plan}} سينتهي بتاريخ {{date}}. يمكنكم تجديد الاشتراك أو الترقية في أي وقت. شكراً لثقتكم بنا.',
    expired: 'مرحباً {{name}}، لقد انتهت صلاحية اشتراككم {{plan}} بتاريخ {{date}}. يرجى التواصل معنا لتجديد الخدمة في أقرب وقت.',
  },
  FR: {
    language: 'FR',
    expiring3Days: 'Bonjour {{name}}, votre abonnement {{plan}} expirera le {{date}}. Vous pouvez le renouveler ou passer à une offre supérieure à tout moment. Merci pour votre confiance.',
    expired: 'Bonjour {{name}}, votre abonnement {{plan}} a expiré le {{date}}. Merci de nous contacter afin de renouveler votre service.',
  },
  EN: {
    language: 'EN',
    expiring3Days: 'Hello {{name}}, your {{plan}} subscription will expire on {{date}}. You may renew or upgrade your subscription at any time. Thank you for your trust.',
    expired: 'Hello {{name}}, your {{plan}} subscription expired on {{date}}. Please contact us to renew your service.',
  },
};

export function renderWhatsAppMessage(
  templateText: string,
  variables: { name: string; plan: string; date: string }
): string {
  return templateText
    .replace(/\{\{name\}\}/g, variables.name)
    .replace(/\{\{plan\}\}/g, variables.plan)
    .replace(/\{\{date\}\}/g, variables.date);
}

export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

export function createWhatsAppWebUrl(phone: string, message: string): string {
  const cleanPhone = cleanWhatsAppNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}
