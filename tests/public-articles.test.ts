import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toPublicArticle } from "../lib/public-articles";

describe("public article filtering", () => {
  it("only exposes articles with both published flags set", () => {
    assert.equal(
      toPublicArticle("published-flag-missing", {
        status: "published",
      }),
      null
    );
    assert.equal(
      toPublicArticle("draft", {
        status: "draft",
        published: true,
      }),
      null
    );
    assert.equal(
      toPublicArticle("unpublished", {
        status: "published",
        published: false,
      }),
      null
    );
  });

  it("preserves public article fields without exposing private fields", () => {
    const article = toPublicArticle("article-1", {
      status: "published",
      published: true,
      title: "Article de test",
      slug: "article-de-test",
      category: "SOCIÉTÉ",
      description: "Description",
      content: "Contenu",
      image: "https://example.com/image.jpg",
      authorEmail: "private@example.com",
    });

    assert.deepEqual(article, {
      id: "article-1",
      status: "published",
      published: true,
      title: "Article de test",
      slug: "article-de-test",
      category: "SOCIÉTÉ",
      description: "Description",
      content: "Contenu",
      image: "https://example.com/image.jpg",
    });
  });
});
