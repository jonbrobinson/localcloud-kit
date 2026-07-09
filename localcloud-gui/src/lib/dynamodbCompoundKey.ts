/** Common compound-key delimiters, longest-first so `::` wins over `:`. */
const COMPOUND_KEY_DELIMITERS = ["::", "#", ":", "|", "/"] as const;

export interface CompoundKeyParts {
  /** Prefix segment including the delimiter (e.g. `distribution#`). Empty when no delimiter. */
  line1: string;
  /** Remainder after the first delimiter (e.g. UUID suffix). */
  line2: string;
}

/**
 * Split a compound DynamoDB key at the first supported delimiter.
 * Line 1 retains the delimiter so callers are not tied to `#` only.
 */
export function parseCompoundKey(value: string): CompoundKeyParts {
  let splitAt = -1;
  let delimiterLength = 0;

  for (const delimiter of COMPOUND_KEY_DELIMITERS) {
    const index = value.indexOf(delimiter);
    if (index > 0 && (splitAt === -1 || index < splitAt)) {
      splitAt = index;
      delimiterLength = delimiter.length;
    }
  }

  if (splitAt === -1) {
    return { line1: "", line2: value };
  }

  return {
    line1: value.slice(0, splitAt + delimiterLength),
    line2: value.slice(splitAt + delimiterLength),
  };
}
