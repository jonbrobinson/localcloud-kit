"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { Modal } from "@/components/ui";

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

const actionClassName =
  "inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium text-primary-ink bg-primary-soft hover:brightness-95 transition-[filter] cursor-pointer";

export default function QuickInspectModal({
  isOpen,
  onClose,
  title,
  subtitle,
  quickChecks,
  actions,
}: QuickInspectModalProps) {
  const handleActionClick = (callback?: () => void) => {
    onClose();
    if (callback) {
      setTimeout(() => callback(), 0);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Modal.Header icon="lucide:list-checks" title={title} subtitle={subtitle} onClose={onClose} />

      <Modal.Body>
        <span className="text-xs font-medium text-ink-2">Quick verification checklist</span>
        <ul className="flex flex-col gap-2">
          {quickChecks.map((item, idx) => (
            <li key={`${item}-${idx}`} className="flex items-start gap-2 text-[13px] text-ink-2">
              <Icon icon="lucide:check-circle" width={15} className="mt-0.5 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex flex-wrap items-center gap-1.5">
          {actions.map((action, idx) => {
            if (action.href && action.external) {
              return (
                <a
                  key={`${action.label}-${idx}`}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className={actionClassName}
                >
                  {action.label}
                  <Icon icon="lucide:arrow-up-right" width={13} />
                </a>
              );
            }

            if (action.href) {
              return (
                <Link key={`${action.label}-${idx}`} href={action.href} onClick={onClose} className={actionClassName}>
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={`${action.label}-${idx}`}
                type="button"
                onClick={() => handleActionClick(action.onClick)}
                className={actionClassName}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
