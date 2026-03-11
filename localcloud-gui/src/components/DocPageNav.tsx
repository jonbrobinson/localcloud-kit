"use client";

import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChevronDownIcon,
  CircleStackIcon,
  EnvelopeIcon,
  FolderIcon,
  KeyIcon,
  ServerIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface DocPageNavProps {
  title: string;
  subtitle: string;
  /** Optional right-side action button(s) rendered before the nav icons */
  children?: React.ReactNode;
}

/**
 * Shared navigation header for all documentation pages.
 * Includes: ← Dashboard link, logo + title, optional action buttons,
 * the Docs dropdown, and the Profile icon — matching the Dashboard nav.
 */
export default function DocPageNav({ title, subtitle, children }: DocPageNavProps) {
  const [showDocsMenu, setShowDocsMenu] = useState(false);
  const docsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (docsMenuRef.current && !docsMenuRef.current.contains(e.target as Node)) {
        setShowDocsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Left: back link + logo + title */}
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
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Right: custom actions + Docs dropdown + Profile */}
          <div className="flex items-center gap-1">
            {/* Custom action slot (e.g. "Manage Buckets" button) */}
            {children}

            {/* Divider before nav items */}
            <div className="h-5 w-px bg-gray-200 mx-1" />

            {/* Docs dropdown */}
            <div className="relative" ref={docsMenuRef}>
              <button
                onClick={() => setShowDocsMenu((v) => !v)}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BookOpenIcon className="h-4 w-4 mr-2" />
                Docs
                <ChevronDownIcon
                  className={`h-4 w-4 ml-2 transition-transform ${showDocsMenu ? "rotate-180" : ""}`}
                />
              </button>
              {showDocsMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                  {/* Infrastructure */}
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Infrastructure
                  </p>
                  <Link
                    href="/localstack"
                    onClick={() => setShowDocsMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Squares2X2Icon className="h-4 w-4 mr-3 text-gray-400" />
                    LocalStack
                  </Link>

                  {/* AWS Resources */}
                  <div className="border-t border-gray-100 mt-1" />
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    AWS Resources
                  </p>
                  <Link
                    href="/s3"
                    onClick={() => setShowDocsMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FolderIcon className="h-4 w-4 mr-3 text-gray-400" />
                    S3 Buckets
                  </Link>
                  <Link
                    href="/dynamodb"
                    onClick={() => setShowDocsMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CircleStackIcon className="h-4 w-4 mr-3 text-gray-400" />
                    DynamoDB
                  </Link>
                  <Link
                    href="/secrets"
                    onClick={() => setShowDocsMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <KeyIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Secrets Manager
                  </Link>

                  {/* Services */}
                  <div className="border-t border-gray-100 mt-1" />
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Services
                  </p>
                  <Link
                    href="/redis"
                    onClick={() => setShowDocsMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ServerIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Redis Cache
                  </Link>
                  <Link
                    href="/mailpit"
                    onClick={() => setShowDocsMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Inbox
                  </Link>
                  <Link
                    href="/postgres"
                    onClick={() => setShowDocsMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CircleStackIcon className="h-4 w-4 mr-3 text-gray-400" />
                    PostgreSQL
                  </Link>
                  <Link
                    href="/keycloak"
                    onClick={() => setShowDocsMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <KeyIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Keycloak
                  </Link>
                </div>
              )}
            </div>

            {/* Profile icon */}
            <Link
              href="/profile"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Profile & Preferences"
            >
              <UserCircleIcon className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
