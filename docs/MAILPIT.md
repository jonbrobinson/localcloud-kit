# Mailpit — Local Email Testing

Mailpit is a lightweight local SMTP server and web UI for catching and inspecting outgoing emails during development. No real emails are sent.

## Access

| Interface | URL |
|-----------|-----|
| Web UI (via Traefik) | https://mailpit.localcloudkit.com:3030 |
| Web UI (direct) | http://localhost:8025 |
| SMTP server | localhost:1025 |

The **Mailpit badge** in the LocalCloud Kit dashboard shows live email counts and links directly to the web UI in a new tab.

## Configuring Your App to Use Mailpit

Point your app's SMTP settings at Mailpit:

| Setting | Value |
|---------|-------|
| Host | `localhost` (host) or `mailpit` (inside Docker) |
| Port | `1025` |
| Username | *(any or blank)* |
| Password | *(any or blank)* |
| TLS/SSL | Off |

### Node.js (Nodemailer)

```js
const transporter = nodemailer.createTransport({
  host: "mailpit",   // or "localhost" from the host
  port: 1025,
  secure: false,
});
```

### Python (smtplib)

```python
import smtplib
smtp = smtplib.SMTP("localhost", 1025)
smtp.sendmail("from@example.com", "to@example.com", msg.as_string())
```

### Django

```python
# settings.py
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "localhost"
EMAIL_PORT = 1025
```

## Make Commands

```bash
make mailpit-logs    # Tail Mailpit container logs
make mailpit-clear   # Delete all captured messages via API
```

## API

Mailpit exposes a REST API at `http://localhost:8025/api/v1/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/info` | GET | Total and unread message counts |
| `/api/v1/messages` | GET | List all messages (paginated) |
| `/api/v1/messages` | DELETE | Delete all messages |
| `/api/v1/message/{id}` | GET | Get a single message |
| `/api/v1/message/{id}/html` | GET | HTML body of a message |

The LocalCloud API proxies `/api/mailpit/stats` and `/api/mailpit/messages` (DELETE) for use by the dashboard badge.

## Environment Variables

```
MAILPIT_INTERNAL_URL=http://mailpit:8025   # Used by the API container
MAILPIT_SMTP_PORT=1025                     # SMTP port reference
```
