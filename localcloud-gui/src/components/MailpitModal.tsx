"use client";

import { useMailpitStats } from "@/hooks/useMailpitStats";
import { mailpitApi } from "@/services/api";
import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  TrashIcon,
  XMarkIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

const MAILPIT_UI_URL = "https://mailpit.localcloudkit.com:3030";

interface MailMessage {
  ID: string;
  Subject: string;
  From: { Address: string; Name: string };
  To: Array<{ Address: string; Name: string }>;
  Date: string;
  Read: boolean;
}

interface MailpitModalProps {
  onClose: () => void;
}


export default function MailpitModal({ onClose }: MailpitModalProps) {
  const { stats, refetch } = useMailpitStats();

  const [form, setForm] = useState({
    from: "sender@example.com",
    to: "test@example.com",
    subject: "Test Email from LocalCloud Kit",
    body: "Hello! This is a test email sent from the LocalCloud Kit dashboard.",
  });
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
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

  // Close on Escape + lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSend = async () => {
    setSending(true);
    try {
      const result = await mailpitApi.sendTest(form);
      if (result.success) {
        toast.success("Email sent — check the inbox below");
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📬</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mailpit Inbox</h2>
              <p className="text-xs text-gray-500">Local email testing</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={MAILPIT_UI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1" />
              Open Mailpit UI
            </a>
            <Link
              href="/mailpit"
              onClick={onClose}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            >
              <BookOpenIcon className="h-3.5 w-3.5 mr-1" />
              Documentation
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">

          {/* Stats bar */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
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
                    stats.status === "healthy" ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  }`} />
                  {stats.status === "healthy" ? "Running" : "Unavailable"}
                </span>
              </div>
            </div>
            <button
              onClick={handleClear}
              disabled={clearing || stats.total === 0}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-40 transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-1.5" />
              {clearing ? "Clearing…" : "Clear All"}
            </button>
          </div>

          {/* Recent Messages */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Recent Messages</h3>
              <span className="text-xs text-gray-400">Auto-refreshes every 5s</span>
            </div>
            {messages.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <EnvelopeIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No messages yet. Send a test email below.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Subject</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">From</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">To</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {messages.map((msg) => (
                      <tr key={msg.ID} className={msg.Read ? "" : "bg-blue-50"}>
                        <td className="px-3 py-2 font-medium text-gray-900 max-w-[180px] truncate">
                          {msg.Subject || "(no subject)"}
                        </td>
                        <td className="px-3 py-2 text-gray-600 font-mono truncate max-w-[140px]">
                          {msg.From?.Address || "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-600 font-mono truncate max-w-[140px]">
                          {msg.To?.[0]?.Address || "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                          {msg.Date ? new Date(msg.Date).toLocaleString() : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {msg.Read ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Read</span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Unread</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Send Test Email */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Send Test Email</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input
                  type="email"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Body</label>
              <textarea
                rows={3}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? "Sending…" : "Send Test Email"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
