import { useState, useEffect, useCallback } from "react";
import { MailpitMessageSummary } from "@/types";
import { mailpitApi } from "@/services/api";

/** Polls the newest Mailpit messages every 5s while `enabled` (pause it when Mailpit is down). */
export function useMailpitMessages(limit = 3, enabled = true) {
  const [messages, setMessages] = useState<MailpitMessageSummary[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const data = await mailpitApi.getMessages(limit);
    setMessages(data.messages || []);
    setTotal(data.total || 0);
  }, [limit]);

  useEffect(() => {
    if (!enabled) return;
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load, enabled]);

  return { messages, total, refetch: load };
}
