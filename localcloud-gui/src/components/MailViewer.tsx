"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { Button, Modal, SegmentedControl, cn, type SegmentedOption } from "@/components/ui";
import { mailpitApi } from "@/services/api";
import type { MailpitAddress, MailpitMessage } from "@/types";

const MAILPIT_UI_URL = "https://mailpit.localcloudkit.com:3030";

type MailView = "html" | "text" | "source";
type PreviewWidth = "desktop" | "mobile";

const WIDTH_OPTIONS: SegmentedOption<PreviewWidth>[] = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
];

const formatAddress = (a: MailpitAddress) => (a.Name ? `${a.Name} <${a.Address}>` : a.Address);
const formatAddresses = (list: MailpitAddress[] | null | undefined) =>
  list && list.length ? list.map(formatAddress).join(", ") : "—";

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;

/**
 * Links in the email open in a new tab instead of navigating the preview frame.
 * The iframe is sandboxed without allow-scripts, so email markup can't run code or touch the app.
 */
const withLinkTarget = (html: string) => `<base target="_blank">${html}`;

interface MailViewerProps {
  messageId: string | null;
  onClose: () => void;
}

export default function MailViewer({ messageId, onClose }: MailViewerProps) {
  const [message, setMessage] = useState<MailpitMessage | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<MailView>("html");
  const [width, setWidth] = useState<PreviewWidth>("desktop");

  useEffect(() => {
    if (!messageId) return;
    let cancelled = false;
    setMessage(null);
    setRaw(null);
    setError(null);
    mailpitApi
      .getMessage(messageId)
      .then((msg) => {
        if (cancelled) return;
        setMessage(msg);
        setView(msg.HTML ? "html" : "text");
      })
      .catch(() => !cancelled && setError("Couldn't load this email. It may have been deleted."));
    return () => {
      cancelled = true;
    };
  }, [messageId]);

  useEffect(() => {
    if (view !== "source" || !messageId || raw !== null) return;
    mailpitApi
      .getRawMessage(messageId)
      .then(setRaw)
      .catch(() => setRaw("Couldn't load the message source."));
  }, [view, messageId, raw]);

  const hasHtml = Boolean(message?.HTML);
  const viewOptions: SegmentedOption<MailView>[] = [
    { value: "html", label: "HTML", disabled: !hasHtml, title: hasHtml ? undefined : "This email has no HTML part" },
    { value: "text", label: "Text" },
    { value: "source", label: "Source" },
  ];

  const copyCurrent = async () => {
    if (!message) return;
    const content = view === "html" ? message.HTML : view === "text" ? message.Text : raw ?? "";
    try {
      await navigator.clipboard.writeText(content);
      toast.success(`Copied ${view === "html" ? "HTML" : view === "text" ? "text" : "source"}`);
    } catch {
      toast.error("Clipboard access was blocked");
    }
  };

  return (
    <Modal open={Boolean(messageId)} onClose={onClose} className="max-w-[860px]">
      <Modal.Header
        icon="lucide:mail"
        title={message?.Subject || (error ? "Email not found" : "Loading…")}
        subtitle={message ? `${formatSize(message.Size)}${message.Attachments?.length ? ` · ${message.Attachments.length} attachment${message.Attachments.length > 1 ? "s" : ""}` : ""}` : undefined}
        onClose={onClose}
      />

      {error ? (
        <div className="px-[18px] py-10 text-center text-sm text-muted">{error}</div>
      ) : !message ? (
        <div className="px-[18px] py-6 space-y-2" aria-hidden>
          <div className="h-3 w-1/2 rounded bg-skeleton animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-skeleton animate-pulse" />
          <div className="mt-4 h-64 rounded-lg bg-skeleton animate-pulse" />
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 px-[18px] py-3 border-b border-divider text-xs">
            <dt className="text-muted">From</dt>
            <dd className="font-mono text-[11.5px] text-ink-2 break-all">{formatAddress(message.From)}</dd>
            <dt className="text-muted">To</dt>
            <dd className="font-mono text-[11.5px] text-ink-2 break-all">{formatAddresses(message.To)}</dd>
            {message.Cc && message.Cc.length > 0 && (
              <>
                <dt className="text-muted">Cc</dt>
                <dd className="font-mono text-[11.5px] text-ink-2 break-all">{formatAddresses(message.Cc)}</dd>
              </>
            )}
            <dt className="text-muted">Date</dt>
            <dd className="text-ink-2">{new Date(message.Date).toLocaleString()}</dd>
            {message.Attachments?.length > 0 && (
              <>
                <dt className="text-muted">Files</dt>
                <dd className="font-mono text-[11.5px] text-ink-2 break-all">
                  {message.Attachments.map((a) => a.FileName).join(", ")}
                </dd>
              </>
            )}
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-2 px-[18px] py-2 border-b border-divider bg-surface-2">
            <SegmentedControl options={viewOptions} value={view} onChange={setView} />
            <div className="flex items-center gap-2">
              {view === "html" && <SegmentedControl options={WIDTH_OPTIONS} value={width} onChange={setWidth} />}
              <Button size="sm" icon="lucide:copy" onClick={copyCurrent}>
                Copy
              </Button>
              <a
                href={`${MAILPIT_UI_URL}/view/${message.ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs text-muted hover:bg-surface-3 hover:text-ink transition-colors"
              >
                <Icon icon="lucide:external-link" width={14} />
                Mailpit
              </a>
            </div>
          </div>

          {!hasHtml && (
            <p className="mx-[18px] mt-3 rounded-md bg-warn-soft px-3 py-1.5 text-xs text-warn-ink">
              This email has no HTML part. Showing plain text.
            </p>
          )}

          <div className="bg-surface-2 p-[18px] max-h-[65vh] overflow-auto">
            {/* Emails are authored for a white page, so the frame stays white in dark mode. */}
            {view === "html" && hasHtml && (
              <iframe
                title={`HTML preview of ${message.Subject}`}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                srcDoc={withLinkTarget(message.HTML)}
                className={cn(
                  "block mx-auto h-[60vh] rounded-lg border border-border bg-white transition-[width] duration-200",
                  width === "mobile" ? "w-[375px] max-w-full" : "w-full"
                )}
              />
            )}
            {view === "text" && (
              <pre className="max-w-[72ch] whitespace-pre-wrap break-words rounded-lg border border-border bg-surface p-4 font-mono text-[12.5px] text-ink-2">
                {message.Text || "(This email has no plain-text part.)"}
              </pre>
            )}
            {view === "source" && (
              <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs text-ink-2">
                {raw ?? "Loading source…"}
              </pre>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
