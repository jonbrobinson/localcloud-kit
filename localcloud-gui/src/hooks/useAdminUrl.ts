import { useEffect, useState } from "react";

/**
 * Picks the admin-tool URL that matches how the GUI is being accessed.
 * On the app domain (via Traefik) returns `traefikUrl`; on localhost/127.0.0.1
 * returns `directUrl` (the host-mapped port). Defaults to `traefikUrl` during SSR.
 */
export function useAdminUrl(traefikUrl: string, directUrl: string): string {
  const [url, setUrl] = useState(traefikUrl);
  useEffect(() => {
    const { hostname } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    setUrl(isLocalhost ? directUrl : traefikUrl);
  }, [traefikUrl, directUrl]);
  return url;
}
