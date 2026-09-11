# Recura Mobile Authentication Architecture

## 1. Current Authentication Flow
- **Web App**: Uses a bearer token stored in memory (`appSessions`).
- **Endpoints**: `/api/auth/login` checks credentials against the `User` table, verifies using Argon2id, and issues a session token.
- **Data Access**: `/api/db` endpoint accepts operations (list, insert, etc.), validating requests using an allow-list schema and checking the bearer token.
- **Session Registry**: In-memory registry for active sessions.

## 2. Current Database Access Flow
- The frontend sends a structured JSON payload to `/api/db` containing the operation, table, columns, match, etc.
- The server validates the table and column names against `server/schema.js` and dynamically builds parameterized SQL queries.

## 3. Current Setup Flow
- The setup flow creates a `recura.state.json` to store the installation status and `recura.config.json` to store database credentials.
- An admin account is created during setup and verified.

## 4. Current Notification Flow
- `push_events`, `push_log`, and `push_tokens` tables exist in `004_mobile_push_tables.sql` for the companion mobile app.
- Currently, `push_tokens` are associated with `user_email` and `device_token`.

## 5. Proposed Architecture
We will introduce an architecture where the Android App connects to the existing Recura installation through a one-time 8-digit code pairing process.

### Entities
1. **Installation**: Represents the Recura backend. A single record in the `installation` table.
2. **Mobile Device**: Represents a paired Android device. Recorded in the `mobile_devices` table.
3. **Mobile Pairing Token**: A short-lived, single-use token used to link an Android device to the installation.
4. **User**: Standard Recura account.

### Auth Flow
1. **Pairing Phase**:
   - Web App generates a pairing token (8-digit code) in Settings -> Mobile App.
   - Android enters the 8-digit code and calls `POST /api/mobile/pair`.
   - Backend validates the token, registers the device in `mobile_devices`, and returns the `installation_id`.
2. **Login Phase**:
   - Android prompts user for Recura credentials.
   - Android calls `POST /api/mobile/login` providing `device_id`, `username`, `password`.
   - Backend validates the user credentials and the device's status. If valid, issues a session token specific to the device (or uses the existing `appSessions` but binds it).
3. **Revocation**:
   - Admin can revoke a device from the Web App.
   - Revoked devices have `status = 'revoked'` and cannot authenticate or access the API.

## 6. Affected Files
- `server/migrations/006_mobile_authentication.sql`: New database migration for mobile auth tables.
- `server/schema.js`: Update allow-lists to include `mobile_devices`, `mobile_pairing_tokens`, and `installation`.
- `server/index.js`: Route `/api/mobile/*` requests to a new mobile API handler.
- `server/mobileApi.js`: Implement endpoints for pair, login, revoke.
- `src/components/settings/SettingsView.tsx`: Add a new tab for "Mobile App" management.
- `src/types/erp.ts`: Add `MobileDevice` and `MobilePairingToken` types.
- `src/components/settings/MobileDevicesTab.tsx`: New component to list devices, revoke them, and show pairing 8-digit code.

## 7. Affected Database Tables
- `installation` (NEW)
- `mobile_devices` (NEW)
- `mobile_pairing_tokens` (NEW)
- `push_tokens` (MODIFIED: Add `installation_id` and `user_id` relations)

## 8. Migration Strategy
Create a new migration script (`006_mobile_authentication.sql`) to safely create the new tables. Update `push_tokens` by adding the new columns without dropping existing data.

## 9. Backwards-compatibility Considerations
- Existing session logic and web application endpoints remain unmodified.
- `recura_csrf` mechanism will continue working for the web app; mobile app will use a simpler bearer token without CSRF or it will be excluded from CSRF checks if it's an API route specifically for mobile (`/api/mobile/*`).
- `push_tokens` updates are purely additive.
