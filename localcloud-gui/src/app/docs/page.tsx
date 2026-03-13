"use client";

import QuickInspectModal, { QuickInspectAction } from "@/components/QuickInspectModal";
import {
  DOCS_CATEGORY_LABEL,
  DOCS_CATEGORY_ORDER,
  DOCS_HUB_ENTRIES,
  EXTERNAL_DOCS_LINKS,
  type DocsHubEntry,
} from "@/constants/docsHub";
import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CircleStackIcon,
  ServerIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useMemo, useState } from "react";

type InspectEntryId = DocsHubEntry["id"] | null;

function CategoryIcon({ category }: { category: DocsHubEntry["category"] }) {
  if (category === "infrastructure") return <Squares2X2Icon className="h-5 w-5 text-gray-500" />;
  if (category === "platform-services") return <ServerIcon className="h-5 w-5 text-gray-500" />;
  return <CircleStackIcon className="h-5 w-5 text-gray-500" />;
}

export default function DocsHubPage() {
  const [selectedInspect, setSelectedInspect] = useState<InspectEntryId>(null);

  const selectedEntry = useMemo(
    () => DOCS_HUB_ENTRIES.find((entry) => entry.id === selectedInspect) ?? null,
    [selectedInspect]
  );

  const inspectActions: QuickInspectAction[] = useMemo(() => {
    if (!selectedEntry) return [];
    const actions: QuickInspectAction[] = [
      { label: "Open Docs", href: selectedEntry.docsPath },
    ];
    if (selectedEntry.managerPath) {
      actions.push({
        label: selectedEntry.managerLabel || "Open Manager",
        href: selectedEntry.managerPath,
      });
    }
    if (selectedEntry.adminUrl) {
      actions.push({
        label: selectedEntry.adminLabel || "Open Admin UI",
        href: selectedEntry.adminUrl,
        external: true,
      });
    }
    return actions;
  }, [selectedEntry]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpenIcon className="h-7 w-7 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Documentation Hub</h1>
                <p className="text-xs text-gray-500">Quick verification + docs + manager/admin links</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Smoke Checks</h2>
          <p className="text-sm text-gray-600">
            Pick any resource/service to open an inspect modal with verification checks and direct links
            to docs and manager/admin tools.
          </p>
        </section>

        {DOCS_CATEGORY_ORDER.map((category) => {
          const entries = DOCS_HUB_ENTRIES.filter((entry) => entry.category === category);
          return (
            <section key={category} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">{DOCS_CATEGORY_LABEL[category]}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {entries.map((entry) => (
                  <article key={entry.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {entry.icon ? (
                          <Icon icon={entry.icon} className="w-5 h-5" />
                        ) : (
                          <CategoryIcon category={entry.category} />
                        )}
                        <h3 className="text-base font-semibold text-gray-900">{entry.title}</h3>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{entry.summary}</p>

                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1.5">
                        Verify quickly
                      </p>
                      <ul className="space-y-1">
                        {entry.quickChecks.map((check, idx) => (
                          <li key={`${entry.id}-check-${idx}`} className="text-sm text-gray-700">
                            • {check}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedInspect(entry.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Inspect
                      </button>
                      <Link
                        href={entry.docsPath}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        Docs
                      </Link>
                      {entry.managerPath && (
                        <Link
                          href={entry.managerPath}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          {entry.managerLabel || "Open Manager"}
                        </Link>
                      )}
                      {entry.adminUrl && (
                        <a
                          href={entry.adminUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          {entry.adminLabel || "Open Admin UI"}
                          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-1.5" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">External references</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Link</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {EXTERNAL_DOCS_LINKS.map((link) => (
                  <tr key={link.href}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center font-medium text-blue-600 hover:underline"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1.5" />
                        {link.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{link.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <QuickInspectModal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedInspect(null)}
        title={selectedEntry?.title || "Inspect"}
        subtitle="Verification checklist and quick links"
        quickChecks={selectedEntry?.quickChecks || []}
        actions={inspectActions}
      />
    </main>
  );
}
