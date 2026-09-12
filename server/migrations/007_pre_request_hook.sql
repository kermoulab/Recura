-- 007_pre_request_hook.sql
-- Enforces server-side device revocation for Android API requests made directly to PostgREST.

CREATE OR REPLACE FUNCTION public.pre_request()
RETURNS void AS $$
DECLARE
    v_device_id text;
    v_device_token text;
    v_device_status text;
BEGIN
    -- Extract headers provided by the Android App (RecuraApiProvider.kt)
    v_device_id := current_setting('request.headers', true)::json->>'x-device-id';
    v_device_token := current_setting('request.headers', true)::json->>'x-device-token';
    
    -- If neither header is present, this is a web app request or unauthenticated, allow it.
    -- Web app handles its own auth via /api/db and session tokens.
    IF v_device_id IS NULL AND v_device_token IS NULL THEN
        RETURN;
    END IF;

    -- Validate device
    SELECT status INTO v_device_status
    FROM public.mobile_devices
    WHERE device_id = v_device_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'device_revoked' USING ERRCODE = '42501';
    END IF;
    
    IF v_device_status = 'revoked' THEN
        RAISE EXCEPTION 'device_revoked' USING ERRCODE = '42501';
    END IF;
    
    -- In this architecture, device_id acts as the secure token (it is a crypto.randomUUID).
    -- We ensure the device_token provided matches the device_id to satisfy the Android app's requirement.
    IF v_device_id != v_device_token THEN
        RAISE EXCEPTION 'device_revoked' USING ERRCODE = '42501';
    END IF;

    -- Update last_seen_at (Best effort, ignore if fails)
    -- PostgREST handles transactions, this is safe.
    UPDATE public.mobile_devices
    SET last_seen_at = now()
    WHERE device_id = v_device_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configure PostgREST to run this function before every request
-- Note: Requires PostgREST restart or schema cache reload in Supabase
-- ALTER ROLE authenticator SET pgrst.db_pre_request TO 'public.pre_request';
