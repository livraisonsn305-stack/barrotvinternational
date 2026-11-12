export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (typeof serialized !== "string") {
    throw new TypeError("JSON-LD data could not be serialized.");
  }

  return serialized.replace(/</g, "\\u003c");
}
