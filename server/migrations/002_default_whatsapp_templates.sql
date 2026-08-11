-- =============================================================================
-- Recura — Migration 002: default WhatsApp templates (required config seed)
-- Derived from scripts/migrate_order_number_and_templates.sql and
-- scripts/migrate_add_thanks_client.sql. NOT demo/business data — these are the
-- default notification templates the app depends on. Idempotent.
-- =============================================================================

INSERT INTO "WhatsAppTemplate" ("language", "expiring3Days", "expired", "thanksClient") VALUES
('AR',
 'مرحباً {{name}}، نود تذكيركم بأن اشتراككم {{plan}} سينتهي بتاريخ {{date}}. يمكنكم تجديد الاشتراك أو الترقية في أي وقت. شكراً لثقتكم بنا.',
 'مرحباً {{name}}، لقد انتهت صلاحية اشتراككم {{plan}} بتاريخ {{date}}. يرجى التواصل معنا لتجديد الخدمة في أقرب وقت.',
 E'🎉 مرحباً بك في {STORE_NAME}!\n\nعزيزي {NAME}،\n\nتم تفعيل اشتراكك بنجاح.\n\n━━━━━━━━━━━━━━━━━━\n📧 البريد الإلكتروني: {EMAIL}\n🔑 كلمة المرور: {PASSWORD}\n👤 الملف الشخصي: الملف {PROFILE_NUMBER}\n🔐 رمز PIN: {PIN_CODE}\n━━━━━━━━━━━━━━━━━━\n📝 ملاحظات: {NOTES}\n\n⚠️ إرشادات مهمة\n\n• يرجى استخدام الملف الشخصي المخصص لك فقط.\n• لا تقم بتغيير البريد الإلكتروني أو كلمة المرور.\n• لا تقم بتغيير اسم الملف الشخصي أو صورته.\n• لا تقم بتغيير رمز PIN.\n• لا تقم بإنشاء ملفات شخصية إضافية.\n• حافظ على سرية معلومات تسجيل الدخول الخاصة بك.'),
('FR',
 'Bonjour {{name}}, votre abonnement {{plan}} expirera le {{date}}. Vous pouvez le renouveler ou passer à une offre supérieure à tout moment. Merci pour votre confiance.',
 'Bonjour {{name}}, votre abonnement {{plan}} a expiré le {{date}}. Merci de nous contacter afin de renouveler votre service.',
 E'🎉 Bienvenue chez {STORE_NAME} !\n\nCher/Chère {NAME},\n\nVotre abonnement a été activé avec succès.\n\n━━━━━━━━━━━━━━━━━━\n📧 Email : {EMAIL}\n🔑 Mot de passe : {PASSWORD}\n👤 Profil : Profil {PROFILE_NUMBER}\n🔐 PIN : {PIN_CODE}\n━━━━━━━━━━━━━━━━━━\n📝 Notes : {NOTES}\n\n⚠️ Consignes importantes\n\n• Utilisez UNIQUEMENT le profil qui vous a été attribué.\n• Ne modifiez PAS l''adresse e-mail ni le mot de passe.\n• Ne modifiez PAS le nom ou l''avatar du profil.\n• Ne modifiez PAS le code PIN.\n• Ne créez PAS de profils supplémentaires.\n• Gardez vos informations de connexion privées.'),
('EN',
 'Hello {{name}}, your {{plan}} subscription will expire on {{date}}. You may renew or upgrade your subscription at any time. Thank you for your trust.',
 'Hello {{name}}, your {{plan}} subscription expired on {{date}}. Please contact us to renew your service.',
 E'🎉 Welcome to {STORE_NAME}!\n\nHello {NAME},\n\nYour subscription has been successfully activated.\n\n━━━━━━━━━━━━━━━━━━\n📧 Email: {EMAIL}\n🔑 Password: {PASSWORD}\n👤 Profile: Profile {PROFILE_NUMBER}\n🔐 PIN: {PIN_CODE}\n━━━━━━━━━━━━━━━━━━\n📝 Notes: {NOTES}\n\n⚠️ Important Guidelines\n\n• Please use ONLY your assigned profile.\n• Do NOT change the email or password.\n• Do NOT change the profile name or avatar.\n• Do NOT modify the PIN.\n• Do NOT create additional profiles.\n• Keep your login information private.')
ON CONFLICT ("language") DO NOTHING;
