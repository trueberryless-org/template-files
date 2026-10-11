import { parse, stringify } from "yaml";

type JsonObject = Record<string, unknown>;

export function mergeDeep(base: JsonObject, override: JsonObject): JsonObject {
  const result: JsonObject = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = result[key];

    result[key] =
      isRecord(current) && isRecord(value) ? mergeDeep(current, value) : value;
  }

  return result;
}

export function mergeJsonText(existing: string | undefined, template: string) {
  const merged = mergeDeep(
    existing ? (JSON.parse(existing) as JsonObject) : {},
    JSON.parse(template) as JsonObject
  );

  return `${JSON.stringify(merged, undefined, 2)}\n`;
}

export function mergeYamlText(existing: string | undefined, template: string) {
  const merged = mergeYamlDefaults(
    existing ? parse(existing) : {},
    parse(template)
  );

  return stringify(merged, { lineWidth: 0 });
}

function mergeYamlDefaults(existing: unknown, defaults: unknown): unknown {
  if (Array.isArray(existing) && Array.isArray(defaults)) {
    return [
      ...defaults,
      ...existing.filter((item) => !defaults.includes(item)),
    ];
  }

  if (isRecord(existing) && isRecord(defaults)) {
    const result: JsonObject = { ...defaults };

    for (const [key, value] of Object.entries(existing)) {
      result[key] =
        key in defaults ? mergeYamlDefaults(value, defaults[key]) : value;
    }

    return result;
  }

  return existing ?? defaults;
}

export function addMissingLines(
  existing: string | undefined,
  template: string
) {
  if (existing === undefined) {
    return template;
  }

  const existingLines = new Set(
    existing.split("\n").map((line) => line.trimEnd())
  );
  const additions: string[] = [];
  let pendingComment: string | undefined;

  for (const rawLine of template.split("\n")) {
    const line = rawLine.trimEnd();

    if (line === "") {
      continue;
    }

    if (line.startsWith("#")) {
      pendingComment = existingLines.has(line) ? undefined : line;
      continue;
    }

    if (existingLines.has(line)) {
      continue;
    }

    if (pendingComment) {
      additions.push("", pendingComment);
      existingLines.add(pendingComment);
      pendingComment = undefined;
    }

    additions.push(line);
    existingLines.add(line);
  }

  if (additions.length === 0) {
    return existing;
  }

  return `${existing.trimEnd()}\n${additions.join("\n")}\n`;
}

export function replaceSection(
  existing: string | undefined,
  template: string,
  heading: string
) {
  if (existing === undefined) {
    return template;
  }

  const section = extractSection(template, heading);

  if (section === undefined) {
    return existing;
  }

  const lines = existing.split("\n");
  const start = lines.findIndex((line) => isHeading(line, heading));

  if (start === -1) {
    return `${existing.trimEnd()}\n\n${section}\n`;
  }

  const nextHeading = lines.findIndex(
    (line, index) => index > start && /^#{1,2} /.test(line)
  );
  const end = nextHeading === -1 ? lines.length : nextHeading;
  const replaced = [
    ...lines.slice(0, start),
    ...section.split("\n"),
    "",
    ...lines.slice(end),
  ];

  return `${replaced.join("\n").trimEnd()}\n`;
}

function extractSection(markdown: string, heading: string) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => isHeading(line, heading));

  if (start === -1) {
    return;
  }

  const nextHeading = lines.findIndex(
    (line, index) => index > start && /^#{1,2} /.test(line)
  );

  return lines
    .slice(start, nextHeading === -1 ? lines.length : nextHeading)
    .join("\n")
    .trimEnd();
}

function isHeading(line: string, heading: string) {
  return line.trim() === `## ${heading}`;
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
