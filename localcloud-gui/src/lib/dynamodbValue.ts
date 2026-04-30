type DynamoRecord = Record<string, unknown>;

function isRecord(value: unknown): value is DynamoRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNumber(raw: unknown): number | string {
  const asString = String(raw);
  const numeric = Number(asString);
  return Number.isFinite(numeric) ? numeric : asString;
}

export function parseDynamoDBAttributeValue(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  if ("S" in value) return value.S ?? "";
  if ("N" in value) return parseNumber(value.N);
  if ("BOOL" in value) return Boolean(value.BOOL);
  if ("NULL" in value) return null;
  if ("SS" in value && Array.isArray(value.SS)) return value.SS.map((entry) => String(entry));
  if ("NS" in value && Array.isArray(value.NS)) return value.NS.map((entry) => parseNumber(entry));
  if ("BS" in value && Array.isArray(value.BS)) return value.BS.map((entry) => String(entry));
  if ("B" in value) return value.B ?? "";

  if ("L" in value && Array.isArray(value.L)) {
    return value.L.map((entry) => parseDynamoDBAttributeValue(entry));
  }

  if ("M" in value && isRecord(value.M)) {
    const mapped: DynamoRecord = {};
    Object.entries(value.M).forEach(([key, child]) => {
      mapped[key] = parseDynamoDBAttributeValue(child);
    });
    return mapped;
  }

  const parsedObject: DynamoRecord = {};
  Object.entries(value).forEach(([key, child]) => {
    parsedObject[key] = parseDynamoDBAttributeValue(child);
  });
  return parsedObject;
}

export function parseDynamoDBItem(item: unknown): Record<string, unknown> {
  if (!isRecord(item)) {
    return {};
  }

  const parsed: Record<string, unknown> = {};
  Object.entries(item).forEach(([key, value]) => {
    parsed[key] = parseDynamoDBAttributeValue(value);
  });
  return parsed;
}
