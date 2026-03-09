import { useState, useEffect, useCallback } from "react";
import { MailpitStats } from "@/types";
import { mailpitApi } from "@/services/api";

export function useMailpitStats() {
  const [stats, setStats] = useState<MailpitStats>({
    total: 0,
    unread: 0,
    status: "unknown",
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const data = await mailpitApi.stats();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return { stats, loading, refetch: loadStats };
}
