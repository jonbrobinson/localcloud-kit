"use client";

import { useMailpitStats } from "@/hooks/useMailpitStats";
import MailpitBadge from "@/components/MailpitBadge";
import { mailpitApi } from "@/services/api";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

const MAILPIT_UI_URL = "https://mailpit.localcloudkit.com:3030";
const MAILPIT_UI_DIRECT = "http://localhost:8025";

function CodeBlock({ code }: { code: string }) {
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy"
      >
        <ClipboardDocumentIcon className="h-4 w-4 text-gray-300" />
      </button>
    </div>
  );
}

interface MailMessage {
  ID: string;
  Subject: string;
  From: { Address: string; Name: string };
  To: Array<{ Address: string; Name: string }>;
  Date: string;
  Read: boolean;
}

export default function MailpitIntegrationPage() {
  const { stats, refetch } = useMailpitStats();

  const [form, setForm] = useState({
    from: "sender@example.com",
    to: "test@example.com",
    subject: "Test Email from LocalCloud Kit",
    body: "Hello! This is a test email sent from the LocalCloud Kit dashboard.",
  });
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [activeCliTab, setActiveCliTab] = useState<"swaks" | "curl" | "python">("swaks");
  const [activeFrameworkTab, setActiveFrameworkTab] = useState<"nodemailer" | "sendgrid" | "laravel" | "django" | "flask">("nodemailer");
  const [messages, setMessages] = useState<MailMessage[]>([]);

  const fetchMessages = useCallback(async () => {
    const data = await mailpitApi.getMessages(10);
    setMessages(data.messages || []);
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSend = async () => {
    setSending(true);
    try {
      const result = await mailpitApi.sendTest(form);
      if (result.success) {
        toast.success("Email sent — check the Mailpit inbox");
        refetch();
        fetchMessages();
      } else {
        toast.error(result.error || "Failed to send email");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await mailpitApi.clearMessages();
      toast.success("All messages cleared");
      refetch();
      fetchMessages();
    } catch {
      toast.error("Failed to clear messages");
    } finally {
      setClearing(false);
    }
  };

  const cliExamples = {
    swaks: `# Install: brew install swaks
swaks --to test@example.com --from sender@example.com \\
  --server localhost:1025 \\
  --subject "Test Email" \\
  --body "Hello from the CLI"`,
    curl: `# macOS / Linux
curl smtp://localhost:1025 \\
  --mail-from "sender@example.com" \\
  --mail-rcpt "test@example.com" \\
  --upload-file - <<EOF
From: sender@example.com
To: test@example.com
Subject: Test Email

Hello from curl!
EOF`,
    python: `python3 -c "
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
"`,
  };

  const frameworkExamples = {
    nodemailer: `// npm install nodemailer
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 1025,
  secure: false,
  // No auth required for Mailpit
});

async function sendEmail() {
  await transporter.sendMail({
    from: "sender@example.com",
    to: "test@example.com",
    subject: "Hello from Nodemailer",
    text: "Plain text body",
    html: "<p>HTML body — <strong>works too!</strong></p>",
  });
  console.log("Email sent!");
}

sendEmail();`,
    sendgrid: `// npm install @sendgrid/mail
// Swap the transport for local dev — no API key needed
const sgMail = require("@sendgrid/mail");

// In production: sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// For local dev, override the transport to point at Mailpit:
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 1025,
  secure: false,
});

async function send() {
  await transporter.sendMail({
    from: "sender@example.com",
    to: "test@example.com",
    subject: "SendGrid-style email via Mailpit",
    html: "<p>Testing locally with Mailpit</p>",
  });
}

send();`,
    laravel: `# .env
MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

# Send via Mail facade
use Illuminate\\Support\\Facades\\Mail;
use App\\Mail\\WelcomeMail;

Mail::to("test@example.com")->send(new WelcomeMail());

# Or inline without a Mailable:
Mail::raw("Hello from Laravel!", function ($message) {
    $message->to("test@example.com")
            ->subject("Test from Laravel");
});`,
    django: `# settings.py
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "localhost"
EMAIL_PORT = 1025
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False
DEFAULT_FROM_EMAIL = "sender@example.com"

# Send an email
from django.core.mail import send_mail

send_mail(
    subject="Hello from Django",
    message="Plain text body",
    from_email="sender@example.com",
    recipient_list=["test@example.com"],
    html_message="<p>HTML body</p>",
    fail_silently=False,
)`,
    flask: `# pip install Flask-Mail
from flask import Flask
from flask_mail import Mail, Message

app = Flask(__name__)

app.config.update(
    MAIL_SERVER="localhost",
    MAIL_PORT=1025,
    MAIL_USE_TLS=False,
    MAIL_USE_SSL=False,
)

mail = Mail(app)

@app.route("/send")
def send_email():
    msg = Message(
        "Hello from Flask",
        sender="sender@example.com",
        recipients=["test@example.com"],
    )
    msg.body = "Plain text body"
    msg.html = "<p>HTML body</p>"
    mail.send(msg)
    return "Email sent!"`,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <Image src="/logo.svg" alt="LocalCloud Kit" width={36} height={36} />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Mailpit Integration</h1>
                  <p className="text-xs text-gray-500">Local email testing for development</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MailpitBadge stats={stats} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats bar */}
        <section className="bg-white rounded-lg shadow p-4 border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Unread</p>
              <p className={`text-2xl font-bold ${stats.unread > 0 ? "text-red-600" : "text-gray-900"}`}>
                {stats.unread}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <span className={`inline-flex items-center text-sm font-medium ${
                stats.status === "healthy" ? "text-green-700" : "text-gray-500"
              }`}>
                <span className={`h-2 w-2 rounded-full mr-1.5 ${
                  stats.status === "healthy" ? "bg-green-500" : "bg-gray-300"
                }`} />
                {stats.status === "healthy" ? "Running" : "Unavailable"}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClear}
              disabled={clearing || stats.total === 0}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-40 transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-1.5" />
              {clearing ? "Clearing…" : "Clear All"}
            </button>
            <a
              href={MAILPIT_UI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
              Open Mailpit UI
            </a>
          </div>
        </section>

        {/* Recent Messages */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
            <span className="text-xs text-gray-400">Auto-refreshes every 5s</span>
          </div>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <EnvelopeIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No messages yet. Send a test email below.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Subject</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">From</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">To</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {messages.map((msg) => (
                    <tr key={msg.ID} className={msg.Read ? "" : "bg-blue-50"}>
                      <td className="px-4 py-2.5 font-medium text-gray-900 max-w-xs truncate">
                        {msg.Subject || "(no subject)"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">
                        {msg.From?.Address || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">
                        {msg.To?.[0]?.Address || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                        {msg.Date ? new Date(msg.Date).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {msg.Read ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Read</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Unread</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SMTP Settings */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SMTP Settings</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Setting</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Host</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Docker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Host</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">localhost</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">mailpit</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">SMTP Port</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">1025</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">1025</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Web UI</td>
                  <td className="px-4 py-2.5">
                    <a href={MAILPIT_UI_DIRECT} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline">{MAILPIT_UI_DIRECT}</a>
                  </td>
                  <td className="px-4 py-2.5">
                    <a href={MAILPIT_UI_URL} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline">{MAILPIT_UI_URL}</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Username / Password</td>
                  <td className="px-4 py-2.5 font-mono text-gray-400 italic" colSpan={2}>none required</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">TLS / SSL</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900" colSpan={2}>Off</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Test Email Form */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Test Email</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="email"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="email"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? "Sending…" : "Send Test Email"}
            </button>
            <a
              href={MAILPIT_UI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 hover:underline"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
              View in Mailpit
            </a>
          </div>
        </section>

        {/* CLI Examples */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CLI Test Commands</h2>
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            {(["swaks", "curl", "python"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCliTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeCliTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "swaks" ? "swaks" : tab === "curl" ? "curl" : "Python"}
              </button>
            ))}
          </div>
          {activeCliTab === "swaks" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">macOS/Linux — install with <code className="bg-gray-100 px-1 rounded">brew install swaks</code></p>
              <CodeBlock code={cliExamples.swaks} />
            </div>
          )}
          {activeCliTab === "curl" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">macOS/Linux — uses bash heredoc</p>
              <CodeBlock code={cliExamples.curl} />
            </div>
          )}
          {activeCliTab === "python" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Cross-platform — no extra installs needed</p>
              <CodeBlock code={cliExamples.python} />
            </div>
          )}
        </section>

        {/* Framework Integration */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Framework Integration</h2>
          <p className="text-sm text-gray-500 mb-4">Configure your framework to send through Mailpit during local development.</p>
          <div className="flex space-x-1 mb-4 border-b border-gray-200 flex-wrap gap-y-1">
            {([
              { key: "nodemailer", label: "Nodemailer" },
              { key: "sendgrid", label: "SendGrid (Node)" },
              { key: "laravel", label: "Laravel" },
              { key: "django", label: "Django" },
              { key: "flask", label: "Flask" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFrameworkTab(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeFrameworkTab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeFrameworkTab === "nodemailer" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Node.js — <code className="bg-gray-100 px-1 rounded">npm install nodemailer</code></p>
              <CodeBlock code={frameworkExamples.nodemailer} />
            </div>
          )}
          {activeFrameworkTab === "sendgrid" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Swap the SendGrid transport for Nodemailer+Mailpit in local dev — no API key needed.</p>
              <CodeBlock code={frameworkExamples.sendgrid} />
            </div>
          )}
          {activeFrameworkTab === "laravel" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Set the mail driver in your <code className="bg-gray-100 px-1 rounded">.env</code> and use the Mail facade normally.</p>
              <CodeBlock code={frameworkExamples.laravel} />
            </div>
          )}
          {activeFrameworkTab === "django" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Configure <code className="bg-gray-100 px-1 rounded">settings.py</code> and use Django's built-in <code className="bg-gray-100 px-1 rounded">send_mail</code>.</p>
              <CodeBlock code={frameworkExamples.django} />
            </div>
          )}
          {activeFrameworkTab === "flask" && (
            <div>
              <p className="text-sm text-gray-500 mb-2"><code className="bg-gray-100 px-1 rounded">pip install Flask-Mail</code> — configure once, send anywhere in your app.</p>
              <CodeBlock code={frameworkExamples.flask} />
            </div>
          )}
        </section>

        {/* External Docs */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Resources</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://mailpit.axllent.org/docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
                Mailpit Documentation
              </a>
            </li>
            <li>
              <a
                href={MAILPIT_UI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
                Mailpit Web UI (via Traefik)
              </a>
            </li>
            <li>
              <a
                href={MAILPIT_UI_DIRECT}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
                Mailpit Web UI (direct)
              </a>
            </li>
          </ul>
        </section>

      </div>
    </main>
  );
}
