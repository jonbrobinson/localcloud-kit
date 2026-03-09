"use client";

import MailpitModal from "@/components/MailpitModal";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
// Swap the transport for local dev — no API key needed.
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

const resources = [
  {
    name: "Mailpit Documentation",
    url: "https://mailpit.axllent.org/docs/",
    description: "Official Mailpit docs — configuration, API reference, and advanced usage.",
  },
  {
    name: "Mailpit Web UI (via Traefik)",
    url: MAILPIT_UI_URL,
    description: "Access the Mailpit inbox through the Traefik reverse proxy with a friendly domain.",
  },
  {
    name: "Mailpit Web UI (direct)",
    url: MAILPIT_UI_DIRECT,
    description: "Direct access to the Mailpit inbox on localhost port 8025.",
  },
  {
    name: "Nodemailer",
    url: "https://nodemailer.com/",
    description: "The de-facto Node.js library for sending email over SMTP.",
  },
  {
    name: "Flask-Mail",
    url: "https://flask-mail.readthedocs.io/",
    description: "Flask extension that integrates with Python's smtplib for easy email sending.",
  },
  {
    name: "Laravel Mail",
    url: "https://laravel.com/docs/mail",
    description: "Laravel's Mailable classes and Mail facade built on top of Symfony Mailer.",
  },
];

export default function MailpitIntegrationPage() {
  const [showModal, setShowModal] = useState(false);
  const [activeFrameworkTab, setActiveFrameworkTab] = useState<
    "nodemailer" | "sendgrid" | "laravel" | "django" | "flask"
  >("nodemailer");

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
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
            >
              <InboxIcon className="h-4 w-4 mr-1.5" />
              Manage Inbox
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About Mailpit</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit includes <strong>Mailpit</strong> — a lightweight, local SMTP server and web inbox built for development.
            All outbound emails sent by your application are captured by Mailpit instead of being delivered to real recipients,
            making it safe to test email flows without any risk of sending to real addresses.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            The <strong>Inbox</strong> resource card on your dashboard reflects the live Mailpit state.
            Click <em>Manage</em> on that card — or the button above — to view messages, send test emails, and clear the inbox.
          </p>
        </section>

        {/* SMTP Settings */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SMTP Settings</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Setting</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Host machine</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Docker network</th>
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
                      className="font-mono text-blue-600 hover:underline text-xs">{MAILPIT_UI_DIRECT}</a>
                  </td>
                  <td className="px-4 py-2.5">
                    <a href={MAILPIT_UI_URL} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline text-xs">{MAILPIT_UI_URL}</a>
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

        {/* Framework Integration */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Framework Integration</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure your framework to route outbound email through Mailpit during local development.
          </p>
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
              <p className="text-sm text-gray-500 mb-2">Use Nodemailer as a local transport swap — no SendGrid API key needed in dev.</p>
              <CodeBlock code={frameworkExamples.sendgrid} />
            </div>
          )}
          {activeFrameworkTab === "laravel" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Set the mail driver in <code className="bg-gray-100 px-1 rounded">.env</code> and use the Mail facade normally.</p>
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

        {/* Resources */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Link</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {resources.map((r) => (
                  <tr key={r.url}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline font-medium"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        {r.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {showModal && <MailpitModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
