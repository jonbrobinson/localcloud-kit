"use client";

import { ArrowTopRightOnSquareIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect } from "react";

export interface QuickInspectAction {
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}

interface QuickInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  quickChecks: string[];
  actions: QuickInspectAction[];
}

export default function QuickInspectModal({
  isOpen,
  onClose,
  title,
  subtitle,
  quickChecks,
  actions,
}: QuickInspectModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleActionClick = (callback?: () => void) => {
    onClose();
    if (callback) {
      setTimeout(() => callback(), 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close inspect modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick verification checklist</h3>
          <ul className="space-y-2">
            {quickChecks.map((item, idx) => (
              <li key={`${item}-${idx}`} className="flex items-start text-sm text-gray-700">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center flex-wrap gap-2">
          {actions.map((action, idx) => {
            if (action.href && action.external) {
              return (
                <a
                  key={`${action.label}-${idx}`}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  {action.label}
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-1.5" />
                </a>
              );
            }

            if (action.href) {
              return (
                <Link
                  key={`${action.label}-${idx}`}
                  href={action.href}
                  onClick={onClose}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={`${action.label}-${idx}`}
                onClick={() => handleActionClick(action.onClick)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
