"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@iconify/react";
import { ProjectConfig, CreateResourceRequest } from "@/types";
import { Modal, Field, Input, Button } from "@/components/ui";

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateResourceRequest) => void;
  config: ProjectConfig;
  loading?: boolean;
}

const RESOURCE_OPTIONS = [
  { key: "s3", label: "S3 Bucket", icon: "logos:aws-s3" },
  { key: "dynamodb", label: "DynamoDB Table", icon: "logos:aws-dynamodb" },
  { key: "lambda", label: "Lambda Function", icon: "logos:aws-lambda" },
  { key: "apigateway", label: "API Gateway", icon: "logos:aws-api-gateway" },
  { key: "secretsmanager", label: "Secrets Manager", icon: "logos:aws-secrets-manager" },
] as const;

const defaultResources = {
  s3: true,
  dynamodb: true,
  lambda: false,
  apigateway: false,
  secretsmanager: false,
};

export default function CreateResourceModal({
  isOpen,
  onClose,
  onSubmit,
  config,
  loading = false,
}: CreateResourceModalProps) {
  const [projectName, setProjectName] = useState(config.projectName);
  const [resources, setResources] = useState({ ...defaultResources });

  const handleResourceToggle = (resourceType: keyof typeof resources) => {
    setResources((prev) => ({ ...prev, [resourceType]: !prev[resourceType] }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ projectName, resources });
  };

  const selectedCount = Object.values(resources).filter(Boolean).length;

  return (
    <Modal open={isOpen} onClose={onClose} size="form">
      <form onSubmit={handleSubmit}>
        <Modal.Header
          icon="lucide:layers"
          title="Create resources"
          subtitle="Provisioned in the AWS emulator"
          onClose={onClose}
        />
        <Modal.Body>
          <Field label="Project name" required htmlFor="create-resource-project-name">
            <Input
              id="create-resource-project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-2">Resources to create</span>
            <div className="grid grid-cols-2 gap-2">
              {RESOURCE_OPTIONS.map(({ key, label, icon }) => {
                const checked = resources[key];
                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-2.5 py-2 transition-colors hover:bg-surface-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleResourceToggle(key)}
                      className="sr-only"
                    />
                    <span
                      className={
                        checked
                          ? "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-primary text-white"
                          : "h-4 w-4 shrink-0 rounded-[5px] border border-border-strong bg-surface-2"
                      }
                    >
                      {checked && <Icon icon="lucide:check" width={12} />}
                    </span>
                    <Icon icon={icon} width={16} className="shrink-0" />
                    <span className="truncate text-[13px] text-ink">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon="lucide:plus" loading={loading} disabled={selectedCount === 0}>
            {loading ? "Creating…" : `Create ${selectedCount} resource${selectedCount === 1 ? "" : "s"}`}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
