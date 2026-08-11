-- =============================================================================
-- Recura ERP - Add "Thanks Client" WhatsApp template (additive, backward-compatible)
-- Run this in the Supabase SQL Editor once.
--
-- SAFETY:
--   * Adds ONE new column to "WhatsAppTemplate".
--   * Does NOT drop/rename/alter any existing column.
--   * Does NOT delete or update existing template records' message values.
--   * Existing Android app reads are unaffected (it ignores unknown columns).
--   * The column defaults to '' so existing rows stay valid.
-- =============================================================================

ALTER TABLE "WhatsAppTemplate"
    ADD COLUMN IF NOT EXISTS "thanksClient" TEXT NOT NULL DEFAULT '';

-- Backfill the default multilingual "Thanks Client" message for the standard
-- language rows. This only touches the NEW column and is a no-op for rows
-- that already contain a value (idempotent; re-runnable).
UPDATE "WhatsAppTemplate"
SET "thanksClient" = CASE "language"
    WHEN 'AR' THEN E'🎉 مرحباً بك في {STORE_NAME}!\n\nعزيزي {NAME}،\n\nتم تفعيل اشتراكك بنجاح.\n\n━━━━━━━━━━━━━━━━━━\n📧 البريد الإلكتروني: {EMAIL}\n🔑 كلمة المرور: {PASSWORD}\n👤 الملف الشخصي: الملف {PROFILE_NUMBER}\n🔐 رمز PIN: {PIN_CODE}\n━━━━━━━━━━━━━━━━━━\n📝 ملاحظات: {NOTES}\n\n⚠️ إرشادات مهمة\n\n• يرجى استخدام الملف الشخصي المخصص لك فقط.\n• لا تقم بتغيير البريد الإلكتروني أو كلمة المرور.\n• لا تقم بتغيير اسم الملف الشخصي أو صورته.\n• لا تقم بتغيير رمز PIN.\n• لا تقم بإنشاء ملفات شخصية إضافية.\n• حافظ على سرية معلومات تسجيل الدخول الخاصة بك.'
    WHEN 'FR' THEN E'🎉 Bienvenue chez {STORE_NAME} !\n\nCher/Chère {NAME},\n\nVotre abonnement a été activé avec succès.\n\n━━━━━━━━━━━━━━━━━━\n📧 Email : {EMAIL}\n🔑 Mot de passe : {PASSWORD}\n👤 Profil : Profil {PROFILE_NUMBER}\n🔐 PIN : {PIN_CODE}\n━━━━━━━━━━━━━━━━━━\n📝 Notes : {NOTES}\n\n⚠️ Consignes importantes\n\n• Utilisez UNIQUEMENT le profil qui vous a été attribué.\n• Ne modifiez PAS l''adresse e-mail ni le mot de passe.\n• Ne modifiez PAS le nom ou l''avatar du profil.\n• Ne modifiez PAS le code PIN.\n• Ne créez PAS de profils supplémentaires.\n• Gardez vos informations de connexion privées.'
    WHEN 'EN' THEN E'🎉 Welcome to {STORE_NAME}!\n\nHello {NAME},\n\nYour subscription has been successfully activated.\n\n━━━━━━━━━━━━━━━━━━\n📧 Email: {EMAIL}\n🔑 Password: {PASSWORD}\n👤 Profile: Profile {PROFILE_NUMBER}\n🔐 PIN: {PIN_CODE}\n━━━━━━━━━━━━━━━━━━\n📝 Notes: {NOTES}\n\n⚠️ Important Guidelines\n\n• Please use ONLY your assigned profile.\n• Do NOT change the email or password.\n• Do NOT change the profile name or avatar.\n• Do NOT modify the PIN.\n• Do NOT create additional profiles.\n• Keep your login information private.'
    ELSE ''
END
WHERE ("thanksClient" IS NULL OR "thanksClient" = '');

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
