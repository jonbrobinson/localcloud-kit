"use client";

import { type ReactNode, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Icon } from "@iconify/react";
import { cn } from "./cn";
import { Button } from "./Button";
import { Field } from "./Field";
import { Input } from "./Input";

export type ModalSize = "form" | "confirm" | "default";

const sizeClasses: Record<ModalSize, string> = {
  form: "max-w-[520px]",
  confirm: "max-w-[440px]",
  default: "max-w-[480px]",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: ReactNode;
  className?: string;
}

/** One shell, three body types — form, destructive confirm, or plain content. */
export function Modal({ open, onClose, size = "default", children, className }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} transition className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-scrim transition duration-150 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto px-6 py-10">
        <DialogPanel
          transition
          className={cn(
            "w-full overflow-hidden rounded-xl border border-border bg-surface shadow-e3",
            "transition duration-150 data-[closed]:translate-y-[-8px] data-[closed]:scale-[0.98] data-[closed]:opacity-0",
            sizeClasses[size],
            className
          )}
        >
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function ModalHeader({
  icon,
  iconTone = "brand",
  title,
  subtitle,
  onClose,
  bordered = true,
}: {
  icon?: string;
  iconTone?: "brand" | "danger";
  title: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-[18px] py-4",
        bordered ? "border-b border-divider" : "pb-3"
      )}
    >
      {icon &&
        (iconTone === "danger" ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <Icon icon={icon} width={17} />
          </span>
        ) : (
          <Icon icon={icon} width={22} className="mt-px shrink-0" />
        ))}
      <div className="flex min-w-0 flex-col gap-0.5">
        <DialogTitle className="text-[15px] font-semibold text-ink">{title}</DialogTitle>
        {subtitle && <span className="text-[11px] text-muted">{subtitle}</span>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <Icon icon="lucide:x" width={16} />
        </button>
      )}
    </div>
  );
}

function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3.5 p-[18px]", className)}>{children}</div>;
}

function ModalFooter({ hint, children }: { hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-t border-divider bg-surface-2 px-[18px] py-3">
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description: ReactNode;
  /** The exact string the user must type to enable the destroy action. */
  confirmText: string;
  confirmLabel: string;
  loading?: boolean;
}

/** Destructive modal — names what will be lost, primary stays disabled until the typed value matches. */
export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmLabel,
  loading = false,
}: ConfirmDeleteModalProps) {
  const [typed, setTyped] = useState("");
  const matches = typed === confirmText;

  const handleClose = () => {
    setTyped("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="confirm">
      <Modal.Header icon="lucide:alert-triangle" iconTone="danger" title={title} bordered={false} />
      <div className="px-[18px] pb-4 text-[12px] leading-relaxed text-muted">{description}</div>
      <div className="flex flex-col gap-1.5 px-[18px] pb-4">
        <Field
          label={
            <>
              Type <span className="font-mono text-danger">{confirmText}</span> to confirm
            </>
          }
        >
          <Input
            mono
            autoFocus
            placeholder={confirmText}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            invalid={typed.length > 0 && !matches}
          />
        </Field>
      </div>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Keep resources
        </Button>
        <Button
          variant="danger"
          icon="lucide:trash-2"
          onClick={onConfirm}
          disabled={!matches || loading}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
