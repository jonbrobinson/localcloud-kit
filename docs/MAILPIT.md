# Mailpit — Local Email Testing

Mailpit is a lightweight local SMTP server and web UI for catching and inspecting outgoing emails during development. No real emails are sent.

## Existing Users — Required One-Time Steps

If you already have LocalCloud Kit running and are adding Mailpit for the first time, two quick steps are needed before `make start`:

**1. Regenerate your TLS certificate** (covers all LocalCloud Kit subdomains: `mailpit`, `pgadmin`, `keycloak`):

```bash
sudo ./scripts/setup-mkcert.sh
```

**2. Add subdomains to `/etc/hosts`** (also adds `pgadmin` and `keycloak` subdomains):

```bash
sudo ./scripts/setup-hosts.sh
```

Then restart:

```bash
make restart
```

The Mailpit badge will appear in the dashboard header and the web UI will be available at `https://mailpit.localcloudkit.com:3030`.

---

## Access

| Interface | URL |
|-----------|-----|
| Web UI (via Traefik) | https://mailpit.localcloudkit.com:3030 |
| Web UI (direct) | http://localhost:8025 |
| SMTP server | localhost:1025 |

The **Mailpit badge** in the LocalCloud Kit dashboard shows live email counts and links directly to the web UI in a new tab.

## Sending a Test Email

Verify Mailpit is working by sending a test email from the command line — no app setup required.

**Option 1: `swaks`** (install with `brew install swaks`)

```bash
swaks --to test@example.com --from sender@example.com \
  --server localhost:1025 \
  --subject "Test Email" \
  --body "Hello from the CLI"
```

**Option 2: `curl`** (macOS/Linux)

```bash
curl smtp://localhost:1025 \
  --mail-from "sender@example.com" \
  --mail-rcpt "test@example.com" \
  --upload-file - <<EOF
From: sender@example.com
To: test@example.com
Subject: Test Email

Hello from curl!
EOF
```

**Option 3: `curl`** (Windows CMD)

```cmd
echo From: sender@example.com> msg.txt
echo To: test@example.com>> msg.txt
echo Subject: Test Email>> msg.txt
echo.>> msg.txt
echo Hello from curl!>> msg.txt
curl smtp://localhost:1025 --mail-from "sender@example.com" --mail-rcpt "test@example.com" --upload-file msg.txt
del msg.txt
```

**Option 4: Python** (cross-platform, no extra installs needed)

```bash
python3 -c "
import smtplib
from email.message import EmailMessage
msg = EmailMessage()
msg['From'] = 'sender@example.com'
msg['To'] = 'test@example.com'
msg['Subject'] = 'Test Email'
msg.set_content('Hello from the CLI!')
with smtplib.SMTP('localhost', 1025) as s:
    s.send_message(msg)
print('Sent!')
"
```

The email will appear immediately in the Mailpit UI at [http://localhost:8025](http://localhost:8025).

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
