# Certificate Troubleshooting

## "Not Secure" Warning in Browser

If you see a "Not Secure" warning even after running the setup script, the mkcert CA certificate is not installed in your system trust store.

### Quick Fix

**macOS:**

```bash
sudo mkcert -install
```

Then **completely quit and restart your browser** (don't just close tabs - fully quit the application).

### Manual Installation (macOS)

If the command above doesn't work:

1. **Open Keychain Access**

   - Applications → Utilities → Keychain Access

2. **Locate the CA certificate**

   - The certificate is at: `~/Library/Application Support/mkcert/rootCA.pem`
   - Or run: `mkcert -CAROOT` to see the path

3. **Install to System Keychain**

   - Drag `rootCA.pem` into the **System** keychain (not Login)
   - Or: File → Import Items → Select `rootCA.pem`

4. **Set Trust Settings**

   - Double-click the certificate in Keychain Access
   - Expand the **Trust** section
   - Set **"When using this certificate"** to **"Always Trust"**
   - Close the window and enter your password

5. **Restart Browser**
   - Completely quit your browser (Cmd+Q)
   - Reopen and navigate to `https://app-local.localcloudkit.com:3030`

### Verify Installation

**macOS:**

```bash
security find-certificate -c "mkcert" -a
```

If this returns certificate details, the CA is installed.

### Linux

```bash
sudo mkcert -install
```

The certificate will be installed to the system trust store automatically.

### Windows

The certificate should be installed automatically when you run `mkcert -install`. If not:

1. Run `mkcert -install` as Administrator
2. Restart your browser

### Still Not Working?

1. **Check certificate files exist:**

   ```bash
   ls -la traefik/certs/
   ```

   Should show `app-local.localcloudkit.com.pem` and `app-local.localcloudkit.com-key.pem`

2. **Regenerate certificates:**

   ```bash
   ./scripts/setup-mkcert.sh
   ```

3. **Restart Docker services:**

   ```bash
   docker compose restart traefik
   ```

4. **Clear browser cache:**

   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Safari: Develop → Empty Caches

5. **Check browser console:**
   - Open Developer Tools (F12)
   - Check Console tab for certificate errors

### Common Issues

**Issue:** Certificate shows as "Not Secure" even after installing CA

- **Solution:** Completely quit and restart your browser (not just close tabs)

**Issue:** "Failed to install CA" error

- **Solution:** Run `sudo mkcert -install` manually in terminal

**Issue:** Safari still shows warning

- **Solution:** Make sure CA is in **System** keychain, not Login keychain, and set to "Always Trust"

**Issue:** Chrome works but Safari doesn't

- **Solution:** Safari is stricter - ensure CA is properly installed in System keychain with "Always Trust"

---

## Mailpit Subdomain Certificate Issues

### `mailpit.localcloudkit.com` shows "Not Secure"

The Mailpit subdomain uses the **same certificate file** as the main app, but requires `mailpit.localcloudkit.com` to be listed as a Subject Alternative Name (SAN). If you set up LocalCloud Kit before Mailpit was added, your cert won't include it.

**Step 1: Verify the Mailpit SAN is present**

```bash
openssl x509 -in traefik/certs/app-local.localcloudkit.com.pem -noout -text \
  | grep -A2 "Subject Alternative Name"
```

You should see `DNS:mailpit.localcloudkit.com` in the output. If it's missing:

**Step 2: Regenerate the certificate**

```bash
./scripts/setup-mkcert.sh
```

This regenerates the cert with all three SANs: `app-local.localcloudkit.com`, `*.app-local.localcloudkit.com`, and `mailpit.localcloudkit.com`.

**Step 3: Verify the `/etc/hosts` entry exists**

```bash
grep mailpit /etc/hosts
```

If missing:

```bash
sudo ./scripts/setup-hosts.sh
```

**Step 4: Restart Traefik to pick up the new cert**

```bash
docker compose restart traefik
```

**Step 5: Restart your browser** (fully quit, don't just close the tab)

### Mailpit subdomain not found / DNS error

If the browser shows a DNS error (not a cert error) for `mailpit.localcloudkit.com`, the `/etc/hosts` entry is missing:

```bash
sudo ./scripts/setup-hosts.sh
```

Or add manually:

```bash
echo "127.0.0.1  mailpit.localcloudkit.com" | sudo tee -a /etc/hosts
```

### Run full verification

```bash
./scripts/verify-setup.sh
```

This checks both the main app and Mailpit: cert SANs, `/etc/hosts` entries, and HTTPS connectivity.
