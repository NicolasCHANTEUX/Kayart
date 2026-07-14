import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

const shellEnvKeys = new Set(Object.keys(process.env));

loadEnvFile(".env", shellEnvKeys);
loadEnvFile(".env.local", shellEnvKeys, true);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? ""
  }
});

function loadEnvFile(fileName: string, protectedKeys: Set<string>, overridePrevious = false) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = /^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i.exec(trimmed);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (!key || protectedKeys.has(key)) {
      continue;
    }

    if (!overridePrevious && process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = parseEnvValue(rawValue ?? "");
  }
}

function parseEnvValue(value: string) {
  const trimmed = value.trim();
  const isDoubleQuoted = trimmed.startsWith("\"") && trimmed.endsWith("\"");
  const isSingleQuoted = trimmed.startsWith("'") && trimmed.endsWith("'");

  if (isDoubleQuoted || isSingleQuoted) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}
