"use client";

import { parseCompoundKey } from "@/lib/dynamodbCompoundKey";

interface DynamoDBCompoundKeyCellProps {
  value: string;
}

export default function DynamoDBCompoundKeyCell({ value }: DynamoDBCompoundKeyCellProps) {
  const { line1, line2 } = parseCompoundKey(value);

  return (
    <div className="min-w-0 max-w-[220px]">
      {line1 ? (
        <span className="mb-1 inline-block rounded bg-primary-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-ink">
          {line1}
        </span>
      ) : null}
      <span className="block break-all font-mono text-xs leading-snug text-ink">
        {line2 || value}
      </span>
    </div>
  );
}
