-- 008_pair_device_rpc.sql
-- Provides an RPC for the Android app to securely pair and register itself.

CREATE OR REPLACE FUNCTION public.pair_device(
    p_code_hash text,
    p_device_name text,
    p_platform text,
    p_app_version text
)
RETURNS json AS $$
DECLARE
    v_installation_id uuid;
    v_token_id uuid;
    v_device_id text;
    v_device_token text;
    v_result json;
BEGIN
    -- 1. Get current installation
    SELECT id INTO v_installation_id FROM public.installation LIMIT 1;
    IF v_installation_id IS NULL THEN
        RAISE EXCEPTION 'installation_not_found' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Find valid pairing token
    SELECT id INTO v_token_id
    FROM public.mobile_pairing_tokens
    WHERE token_hash = p_code_hash
      AND expires_at > now()
      AND used_at IS NULL
      AND installation_id = v_installation_id
    FOR UPDATE; -- Lock to prevent race conditions

    IF v_token_id IS NULL THEN
        RAISE EXCEPTION 'invalid_or_expired_token' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Mark token as used
    UPDATE public.mobile_pairing_tokens
    SET used_at = now()
    WHERE id = v_token_id;

    -- 4. Generate device ID and Token
    v_device_id := gen_random_uuid()::text;
    v_device_token := v_device_id; -- Same as device_id to align with web app expectations

    -- 5. Insert new mobile device
    INSERT INTO public.mobile_devices (
        installation_id,
        device_id,
        device_name,
        platform,
        app_version,
        status
    ) VALUES (
        v_installation_id,
        v_device_id,
        p_device_name,
        p_platform,
        p_app_version,
        'active'
    );

    -- 6. Return credentials
    v_result := json_build_object(
        'ok', true,
        'installation_id', v_installation_id,
        'device_id', v_device_id,
        'device_token', v_device_token
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
