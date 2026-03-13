import {
  CircleStackIcon,
  EnvelopeIcon,
  KeyIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { ComponentType } from "react";
import { ServiceKind, ModalKey } from "@/types";

export interface PlatformServiceEntry {
  id: "keycloak" | "mailpit" | "postgres" | "redis";
  label: string;
  kind: ServiceKind;
  icon: ComponentType<{ className?: string }>;
  action: { type: "link"; href: string } | { type: "modal"; modalKey: ModalKey };
}

// Ordered: instance-services first (what your app connects to), admin tools second.
export const PLATFORM_SERVICES: PlatformServiceEntry[] = [
  {
    id: "postgres",
    label: "PostgreSQL",
    kind: "instance-service",
    icon: CircleStackIcon,
    action: { type: "link", href: "/postgres" },
  },
  {
    id: "redis",
    label: "Redis Cache",
    kind: "instance-service",
    icon: ServerIcon,
    action: { type: "modal", modalKey: "redis" },
  },
  {
    id: "keycloak",
    label: "Keycloak",
    kind: "admin-tool",
    icon: KeyIcon,
    action: { type: "link", href: "/keycloak" },
  },
  {
    id: "mailpit",
    label: "Mailpit",
    kind: "admin-tool",
    icon: EnvelopeIcon,
    action: { type: "modal", modalKey: "mailpit" },
  },
];

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  "instance-service": "Infrastructure",
  "admin-tool": "Admin Tools",
};

export const PLATFORM_SERVICE_KINDS: ServiceKind[] = ["instance-service", "admin-tool"];
