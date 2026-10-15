export function isMissingInvoicingSchemaError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "P2021";
}

