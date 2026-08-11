import { Language, WhatsAppTemplate } from '../types/erp';

export const DEFAULT_WHATSAPP_TEMPLATES: Record<Language, WhatsAppTemplate> = {
  AR: {
    language: 'AR',
    expiring3Days: 'مرحباً {{name}}، نود تذكيركم بأن اشتراككم {{plan}} سينتهي بتاريخ {{date}}. يمكنكم تجديد الاشتراك أو الترقية في أي وقت. شكراً لثقتكم بنا.',
    expired: 'مرحباً {{name}}، لقد انتهت صلاحية اشتراككم {{plan}} بتاريخ {{date}}. يرجى التواصل معنا لتجديد الخدمة في أقرب وقت.',
    thanksClient:
      '🎉 مرحباً بك في {STORE_NAME}!\n\n' +
      'تم تفعيل اشتراكك بنجاح.\n\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '📧 البريد الإلكتروني: {EMAIL}\n' +
      '🔑 كلمة المرور: {PASSWORD}\n' +
      '👤 الملف الشخصي: الملف {PROFILE_NUMBER}\n' +
      '🔐 رمز PIN: {PIN_CODE}\n' +
      '━━━━━━━━━━━━━━━━━━\n\n' +
      '⚠️ إرشادات مهمة\n\n' +
      '• يرجى استخدام الملف الشخصي المخصص لك فقط.\n' +
      '• لا تقم بتغيير البريد الإلكتروني أو كلمة المرور.\n' +
      '• لا تقم بتغيير اسم الملف الشخصي أو صورته.\n' +
      '• لا تقم بتغيير رمز PIN.\n' +
      '• لا تقم بإنشاء ملفات شخصية إضافية.\n' +
      '• حافظ على سرية معلومات تسجيل الدخول الخاصة بك.',
  },
  FR: {
    language: 'FR',
    expiring3Days: 'Bonjour {{name}}, votre abonnement {{plan}} expirera le {{date}}. Vous pouvez le renouveler ou passer à une offre supérieure à tout moment. Merci pour votre confiance.',
    expired: 'Bonjour {{name}}, votre abonnement {{plan}} a expiré le {{date}}. Merci de nous contacter afin de renouveler votre service.',
    thanksClient:
      '🎉 Bienvenue chez {STORE_NAME} !\n\n' +
      'Votre abonnement a été activé avec succès.\n\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '📧 Email : {EMAIL}\n' +
      '🔑 Mot de passe : {PASSWORD}\n' +
      '👤 Profil : Profil {PROFILE_NUMBER}\n' +
      '🔐 PIN : {PIN_CODE}\n' +
      '━━━━━━━━━━━━━━━━━━\n\n' +
      '⚠️ Consignes importantes\n\n' +
      '• Utilisez UNIQUEMENT le profil qui vous a été attribué.\n' +
      '• Ne modifiez PAS l\u0027adresse e-mail ni le mot de passe.\n' +
      '• Ne modifiez PAS le nom ou l\u0027avatar du profil.\n' +
      '• Ne modifiez PAS le code PIN.\n' +
      '• Ne créez PAS de profils supplémentaires.\n' +
      '• Gardez vos informations de connexion privées.',
  },
  EN: {
    language: 'EN',
    expiring3Days: 'Hello {{name}}, your {{plan}} subscription will expire on {{date}}. You may renew or upgrade your subscription at any time. Thank you for your trust.',
    expired: 'Hello {{name}}, your {{plan}} subscription expired on {{date}}. Please contact us to renew your service.',
    thanksClient:
      '🎉 Welcome to {STORE_NAME}!\n\n' +
      'Your subscription has been successfully activated.\n\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '📧 Email: {EMAIL}\n' +
      '🔑 Password: {PASSWORD}\n' +
      '👤 Profile: Profile {PROFILE_NUMBER}\n' +
      '🔐 PIN: {PIN_CODE}\n' +
      '━━━━━━━━━━━━━━━━━━\n\n' +
      '⚠️ Important Guidelines\n\n' +
      '• Please use ONLY your assigned profile.\n' +
      '• Do NOT change the email or password.\n' +
      '• Do NOT change the profile name or avatar.\n' +
      '• Do NOT modify the PIN.\n' +
      '• Do NOT create additional profiles.\n' +
      '• Keep your login information private.',
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

export function renderThanksClientMessage(
  templateText: string,
  variables: {
    storeName: string;
    email: string;
    password: string;
    profileNumber: string | number;
    pinCode: string;
  }
): string {
  return templateText
    .replace(/\{STORE_NAME\}/g, variables.storeName)
    .replace(/\{EMAIL\}/g, variables.email)
    .replace(/\{PASSWORD\}/g, variables.password)
    .replace(/\{PROFILE_NUMBER\}/g, String(variables.profileNumber))
    .replace(/\{PIN_CODE\}/g, variables.pinCode);
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
