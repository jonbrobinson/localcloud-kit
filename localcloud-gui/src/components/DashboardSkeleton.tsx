"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import packageJson from "../../package.json";

/** Skeleton row matching the exact grid used by ResourceList */
function ResourceRowSkeleton({ opacity = 1 }: { opacity?: number }) {
  return (
    <div className="px-6 py-3.5 border-b border-gray-100" style={{ opacity }}>
      <div
        className="grid items-center gap-x-4"
        style={{ gridTemplateColumns: "1.25rem 2.5rem 1fr 9rem 6rem 1.75rem" }}
      >
        <div className="h-4 w-4 rounded bg-gray-200" />
        <div className="h-6 w-6 rounded bg-gray-200 mx-auto" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
        <div className="h-6 w-16 bg-gray-100 rounded-md mx-auto" />
        <div className="h-4 w-4 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

/** Service pill: real name + pulsing status badge */
export function ServicePillSkeleton({ name }: { name: string }) {
  return (
    <div className="flex items-center space-x-2 px-3">
      <div className="h-2.5 w-2.5 rounded-full bg-gray-300 flex-shrink-0 animate-pulse" />
      <span className="text-sm font-medium text-gray-700">{name}</span>
      <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse" />
    </div>
  );
}

/** Single-row services bar skeleton — matches Dashboard flat layout */
export function ServicesBarSkeleton() {
  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center flex-wrap gap-y-2 gap-x-0">
      <ServicePillSkeleton name="Keycloak" />
      <div className="h-4 w-px bg-gray-200" />
      <ServicePillSkeleton name="LocalStack" />
      <div className="h-4 w-px bg-gray-200" />
      <ServicePillSkeleton name="Mailpit" />
      <div className="h-4 w-px bg-gray-200" />
      <ServicePillSkeleton name="PostgreSQL" />
      <div className="h-4 w-px bg-gray-200" />
      <ServicePillSkeleton name="Redis" />
    </div>
  );
}

/** Resources panel skeleton */
export function ResourcesPanelSkeleton() {
  return (
    <div className="mb-8 bg-white rounded-lg shadow animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-3 w-36 bg-gray-100 rounded" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gray-100 rounded-md" />
          <div className="h-8 w-20 bg-gray-200 rounded-md" />
        </div>
      </div>
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center space-x-2">
        <div className="h-3 w-14 bg-gray-200 rounded" />
        <div className="h-3 w-5 bg-gray-100 rounded" />
      </div>
      <div className="grid items-center gap-x-4 px-6 py-2 bg-white border-b border-gray-100" style={{ gridTemplateColumns: "1.25rem 2.5rem 1fr 9rem 6rem 1.75rem" }}>
        <div /><div />
        <div className="h-2.5 w-16 bg-gray-100 rounded" />
        <div className="h-2.5 w-12 bg-gray-100 rounded" />
        <div className="h-2.5 w-12 bg-gray-100 rounded mx-auto" />
        <div />
      </div>
      <ResourceRowSkeleton opacity={1} />
      <ResourceRowSkeleton opacity={0.85} />
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 border-t border-t-gray-200 flex items-center space-x-2">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-5 bg-gray-100 rounded" />
      </div>
      <ResourceRowSkeleton opacity={0.7} />
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 border-t border-t-gray-200 flex items-center space-x-2">
        <div className="h-3 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-5 bg-gray-100 rounded" />
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
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">

            {/* Logo + title + subtitle — fully static, no shimmer */}
            <div className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="LocalCloud Kit" width={40} height={40} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Local Cloud Development Environment • v{packageJson.version}</p>
              </div>
            </div>

            {/* Nav: Resources | Services | Docs | ─ | Project | Profile */}
            <div className="flex items-center gap-0.5 animate-pulse">
              <div className="h-7 w-24 bg-gray-100 rounded-lg" />
              <div className="h-7 w-20 bg-gray-100 rounded-lg" />
              <div className="h-7 w-16 bg-gray-100 rounded-lg" />
              <div className="h-5 w-px bg-gray-200 mx-1.5" />
              <div className="h-7 w-24 bg-gray-100 rounded-lg" />
              <div className="h-7 w-7 bg-gray-100 rounded-lg" />
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
          <div className="h-3 w-72 bg-gray-100 rounded mx-auto animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
