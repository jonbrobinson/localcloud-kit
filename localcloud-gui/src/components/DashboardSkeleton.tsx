"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import packageJson from "../../package.json";

/** Skeleton row matching the exact grid used by ResourceList */
function ResourceRowSkeleton({ opacity = 1 }: { opacity?: number }) {
  return (
    <div className="px-4 py-3 border-b border-divider" style={{ opacity }}>
      <div
        className="grid items-center gap-x-3"
        style={{ gridTemplateColumns: "1.25rem minmax(0,1fr) 8rem 6rem 6.5rem 5rem" }}
      >
        <div className="h-3.5 w-3.5 rounded bg-skeleton" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-40 bg-skeleton rounded" />
        </div>
        <div className="h-3 w-16 bg-skeleton rounded" />
        <div className="h-3 w-14 bg-skeleton rounded" />
        <div className="h-5 w-16 bg-skeleton rounded-full mx-auto" />
        <div className="h-6 w-12 bg-skeleton rounded-md mx-auto" />
      </div>
    </div>
  );
}

/** Service pill: real name + pulsing status badge */
export function ServicePillSkeleton({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5">
      <div className="h-1.5 w-1.5 rounded-full bg-faint shrink-0 animate-pulse" />
      <span className="text-xs font-medium text-ink-2">{name}</span>
      <div className="h-3.5 w-12 rounded bg-skeleton animate-pulse" />
    </div>
  );
}

/** Single-row services bar skeleton — matches Dashboard flat layout */
export function ServicesBarSkeleton() {
  return (
    <div className="mb-6 bg-surface rounded-lg shadow-e1 border border-border px-2 py-2 flex items-center flex-wrap gap-y-1">
      <ServicePillSkeleton name="Keycloak" />
      <div className="h-4 w-px bg-border" />
      <ServicePillSkeleton name="AWS Emulator" />
      <div className="h-4 w-px bg-border" />
      <ServicePillSkeleton name="Mailpit" />
      <div className="h-4 w-px bg-border" />
      <ServicePillSkeleton name="PostgreSQL" />
      <div className="h-4 w-px bg-border" />
      <ServicePillSkeleton name="Redis" />
    </div>
  );
}

/** Resources panel skeleton */
export function ResourcesPanelSkeleton() {
  return (
    <div className="mb-8 bg-surface rounded-xl shadow-e1 border border-border overflow-hidden animate-pulse">
      <div className="px-4 py-3.5 border-b border-divider flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-28 bg-skeleton rounded" />
          <div className="h-3 w-36 bg-skeleton rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-36 bg-skeleton rounded-lg" />
          <div className="h-8 w-8 bg-skeleton rounded-lg" />
          <div className="h-8 w-32 bg-skeleton rounded-lg" />
        </div>
      </div>
      <div
        className="grid items-center gap-x-3 px-4 py-2 bg-surface-2 border-b border-divider"
        style={{ gridTemplateColumns: "1.25rem minmax(0,1fr) 8rem 6rem 6.5rem 5rem" }}
      >
        <div />
        <div className="h-2.5 w-12 bg-skeleton rounded" />
        <div className="h-2.5 w-12 bg-skeleton rounded" />
        <div className="h-2.5 w-12 bg-skeleton rounded" />
        <div className="h-2.5 w-12 bg-skeleton rounded mx-auto" />
        <div />
      </div>
      <div className="px-4 py-1.5 bg-surface-2 border-b border-divider flex items-center gap-2">
        <div className="h-3 w-3.5 bg-skeleton rounded" />
        <div className="h-3 w-20 bg-skeleton rounded" />
        <div className="h-3 w-4 bg-skeleton rounded" />
      </div>
      <ResourceRowSkeleton opacity={1} />
      <ResourceRowSkeleton opacity={0.85} />
      <div className="px-4 py-1.5 bg-surface-2 border-b border-t border-divider flex items-center gap-2">
        <div className="h-3 w-3.5 bg-skeleton rounded" />
        <div className="h-3 w-24 bg-skeleton rounded" />
        <div className="h-3 w-4 bg-skeleton rounded" />
      </div>
      <ResourceRowSkeleton opacity={0.7} />
      <div className="px-4 py-1.5 bg-surface-2 border-b border-t border-divider flex items-center gap-2">
        <div className="h-3 w-3.5 bg-skeleton rounded" />
        <div className="h-3 w-16 bg-skeleton rounded" />
        <div className="h-3 w-4 bg-skeleton rounded" />
      </div>
      <ResourceRowSkeleton opacity={0.5} />
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-bg"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-surface shadow-e1 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">

            {/* Logo + title + subtitle — fully static, no shimmer */}
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="LocalCloud Kit" width={40} height={40} />
              <div>
                <h1 className="text-2xl font-bold text-ink">LocalCloud Kit</h1>
                <p className="text-xs text-muted">Local Cloud Development Environment • v{packageJson.version}</p>
              </div>
            </div>

            {/* Nav: Resources | Services | Docs | ─ | Project | Profile */}
            <div className="flex items-center gap-0.5 animate-pulse">
              <div className="h-7 w-24 bg-skeleton rounded-lg" />
              <div className="h-7 w-20 bg-skeleton rounded-lg" />
              <div className="h-7 w-16 bg-skeleton rounded-lg" />
              <div className="h-5 w-px bg-border mx-1.5" />
              <div className="h-7 w-24 bg-skeleton rounded-lg" />
              <div className="h-7 w-7 bg-skeleton rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Services status bar ─────────────────────────── */}
        <ServicesBarSkeleton />

        {/* ── AWS Resources panel ─────────────────────────── */}
        <ResourcesPanelSkeleton />

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="mt-8 text-center">
          <div className="h-3 w-72 bg-skeleton rounded mx-auto animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
