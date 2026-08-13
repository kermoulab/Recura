-- -----------------------------------------------------------------------------
-- Widen "Order"."pinCodeEncrypted"
--
-- PIN codes are stored AES-256-GCM encrypted ("enc_aes256_<iv>:<ct>"), which
-- exceeds the legacy VARCHAR(20) and made saving an order fail with
-- "value too long for type character varying(20)". TEXT matches the sibling
-- "accountPasswordEncrypted" column.
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS "Order" ALTER COLUMN "pinCodeEncrypted" TYPE TEXT;
