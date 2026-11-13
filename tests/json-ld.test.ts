import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { serializeJsonLd } from "../lib/json-ld";

describe("JSON-LD serialization", () => {
  it("escapes script-closing characters while preserving the original JSON value", () => {
    const headline = "</script><script>alert('xss')</script>";
    const serialized = serializeJsonLd({ headline });

    assert.equal(serialized.includes("<"), false);
    assert.deepEqual(JSON.parse(serialized), { headline });
  });
});
