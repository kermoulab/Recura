# Recura Mobile API Contract

## Base URL
`/api/mobile`

---

## 1. Device Pairing

### `POST /api/mobile/pair/generate`
**Auth**: Required (Web App Session)
**Description**: Generates a short-lived pairing token and QR code for a new Android device.
**Request Body**: None
**Response**:
```json
{
  "ok": true,
  "code": "A1B2C3D4",
  "expiresAt": "2023-12-01T12:00:00Z"
}
```

### `POST /api/mobile/pair`
**Auth**: None
**Description**: Exchanges the QR code/pairing token for a device registration.
**Request Body**:
```json
{
  "code": "A1B2C3D4",
  "deviceName": "Samsung Galaxy S23",
  "platform": "Android",
  "appVersion": "1.0.0"
}
```
**Response**:
```json
{
  "ok": true,
  "installation_id": "uuid",
  "device_id": "uuid"
}
```

---

## 2. Authentication

### `POST /api/mobile/login`
**Auth**: None
**Description**: Authenticates the user and issues a long-lived mobile session.
**Request Body**:
```json
{
  "device_id": "uuid",
  "username": "user",
  "password": "password"
}
```
**Response**:
```json
{
  "ok": true,
  "session_token": "token_string"
}
```

### `POST /api/mobile/logout`
**Auth**: Required (Mobile Session via `Authorization: Bearer <token>`)
**Description**: Invalidates the current mobile session.
**Request Body**: None
**Response**:
```json
{
  "ok": true
}
```

---

## 3. Device Management (Admin)

### `GET /api/mobile/devices`
**Auth**: Required (Web App Session)
**Description**: Lists all paired mobile devices.
**Response**:
```json
{
  "ok": true,
  "devices": [
    {
      "id": "uuid",
      "device_name": "Samsung Galaxy S23",
      "platform": "Android",
      "app_version": "1.0.0",
      "status": "active",
      "last_seen_at": "...",
      "created_at": "...",
      "user_name": "user"
    }
  ]
}
```

### `POST /api/mobile/devices`
**Auth**: Required (Web App Session)
**Description**: Revokes a specific device, invalidating all of its sessions.
**Request Body**:
```json
{
  "action": "revoke",
  "id": "device_uuid"
}
```
**Response**:
```json
{
  "ok": true
}
```
