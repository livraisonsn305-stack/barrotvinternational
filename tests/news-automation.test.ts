import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createFallbackArticle,
  createNewsFingerprint,
  generateArticleFromSource,
  getConfiguredAiProvider,
  isCronRequestAuthorized,
  validateNewsCandidate,
  verifyAllowedSource,
  type NewsCandidate,
} from "../lib/news-automation";

describe("news automation validations", () => {
  it("accepts an authorized source domain and rejects a non-whitelisted source", () => {
    const source = {
      id: "aps-senegal",
      name: "Agence de Presse Sénégalaise",
      url: "https://www.aps.sn/rss.xml",
      category: "ACTUALITÉ SÉNÉGAL" as const,
      type: "rss" as const,
      enabled: true,
      allowedDomains: ["aps.sn"],
    };

    assert.equal(verifyAllowedSource(source, "https://www.aps.sn/actualite/essai"), true);
    assert.equal(verifyAllowedSource(source, "https://example.com/nonsens"), false);
  });

  it("detects duplicate news fingerprints consistently", () => {
    const candidate: Pick<NewsCandidate, "sourceId" | "title" | "canonicalUrl"> = {
      sourceId: "aps-senegal",
      title: "Le Sénégal lance un programme historique",
      canonicalUrl: "https://www.aps.sn/actualite/programme-historique",
    };

    const first = createNewsFingerprint(candidate);
    const second = createNewsFingerprint(candidate);
    assert.equal(first, second);
  });

  it("blocks unauthorized cron requests and accepts a valid secret", async () => {
    const validRequest = new Request("https://example.com/api/cron/news", {
      headers: { Authorization: "Bearer secret-123" },
    });

    const invalidRequest = new Request("https://example.com/api/cron/news", {
      headers: { Authorization: "Bearer wrong" },
    });

    assert.equal(isCronRequestAuthorized(validRequest, "secret-123"), true);
    assert.equal(
      isCronRequestAuthorized(
        new Request("https://example.com/api/cron/news", {
          headers: { Authorization: "bearer secret-123" },
        }),
        "secret-123"
      ),
      true
    );
    assert.equal(isCronRequestAuthorized(invalidRequest, "secret-123"), false);
    assert.equal(
      isCronRequestAuthorized(
        new Request("https://example.com/api/cron/news", {
          headers: { Authorization: "Bearer secret-123-extra" },
        }),
        "secret-123"
      ),
      false
    );
    assert.equal(isCronRequestAuthorized(new Request("https://example.com/api/cron/news"), "secret-123"), false);
  });

  it("marks incomplete or invalid article data as rejected", () => {
    const reasons = validateNewsCandidate({
      title: "Titre court",
      description: "Très court",
      content: "Contenu insuffisant",
      category: "INCONNU" as unknown as "ACTUALITÉ SÉNÉGAL",
      canonicalUrl: "https://example.com/article",
    });

    assert.ok(reasons.includes("titre insuffisant"));
    assert.ok(reasons.includes("contenu incomplet"));
    assert.ok(reasons.includes("description insuffisante"));
    assert.ok(reasons.includes("catégorie non reconnue"));
  });

  it("falls back safely when no AI provider is configured", async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_URL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const provider = getConfiguredAiProvider();
    assert.equal(provider.provider, "none");

    const candidate: NewsCandidate = {
      sourceId: "aps-senegal",
      sourceName: "Agence de Presse Sénégalaise",
      sourceUrl: "https://www.aps.sn/rss.xml",
      canonicalUrl: "https://www.aps.sn/actualite/programme-historique",
      title: "Le Sénégal lance un programme historique pour l’emploi local",
      description: "Le gouvernement sénégalais publie un programme visant à étendre l’emploi local et la formation professionnelle.",
      content: "Le gouvernement sénégalais a annoncé un programme de développement des compétences locales afin de renforcer l’emploi rural et urbain.",
      imageUrl: "https://example.com/image.jpg",
      publishedAt: new Date("2026-11-07T10:00:00Z"),
      type: "rss",
      category: "ACTUALITÉ SÉNÉGAL",
      rawUrl: "https://www.aps.sn/actualite/programme-historique",
      sourceIdValue: "aps-001",
    };

    const generated = await generateArticleFromSource(candidate);
    assert.equal(generated.title, candidate.title);
    assert.equal(generated.status, "draft");
    assert.equal(generated.published, false);
    assert.ok(generated.content.length > 100);
    assert.ok(generated.content.includes("vérification éditoriale"));
    assert.ok(generated.references.some((entry) => entry.url === candidate.canonicalUrl));
  });

  it("keeps successfully AI-generated articles unpublished", async () => {
    const envKeys = ["AI_PROVIDER", "OPENAI_API_URL", "OPENAI_API_KEY", "OPENAI_MODEL"] as const;
    const previousEnv = new Map(envKeys.map((key) => [key, process.env[key]]));
    const previousFetch = globalThis.fetch;
    let requestCount = 0;

    try {
      process.env.AI_PROVIDER = "openai";
      process.env.OPENAI_API_URL = "https://example.com/v1/chat/completions";
      process.env.OPENAI_API_KEY = "test-key";
      process.env.OPENAI_MODEL = "test-model";
      globalThis.fetch = async () => {
        requestCount += 1;
        return new Response(
          JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify({
                  title: "Article généré pour validation",
                  description: "Description de test",
                  category: "SOCIÉTÉ",
                  content: "<p>Contenu de test à vérifier par la rédaction.</p>",
                  references: [{ label: "Source de test", url: "https://example.com/article" }],
                }),
              },
            }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      const generated = await generateArticleFromSource({
        sourceId: "test-source",
        sourceName: "Source de test",
        sourceUrl: "https://example.com/rss.xml",
        canonicalUrl: "https://example.com/article",
        title: "Titre original de test",
        description: "Description de test suffisamment complète pour être utilisée.",
        content: "Contenu source de test suffisamment long pour passer les validations éditoriales.",
        imageUrl: "",
        publishedAt: new Date("2026-11-07T10:00:00Z"),
        type: "rss",
        category: "SOCIÉTÉ",
        rawUrl: "https://example.com/article",
        sourceIdValue: "test-article-001",
      });

      assert.equal(requestCount, 1);
      assert.equal(generated.title, "Article généré pour validation");
      assert.equal(generated.status, "draft");
      assert.equal(generated.published, false);
    } finally {
      globalThis.fetch = previousFetch;
      for (const key of envKeys) {
        const value = previousEnv.get(key);
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });

  it("keeps the fallback article consistent and safe", () => {
    const article = createFallbackArticle({
      sourceId: "aps-senegal",
      sourceName: "Agence de Presse Sénégalaise",
      sourceUrl: "https://www.aps.sn/rss.xml",
      canonicalUrl: "https://www.aps.sn/actualite/programme-historique",
      title: "Le Sénégal lance un programme historique pour l’emploi local",
      description: "Le gouvernement sénégalais publie un programme visant à étendre l’emploi local et la formation professionnelle.",
      content: "Le gouvernement sénégalais a annoncé un programme de développement des compétences locales afin de renforcer l’emploi rural et urbain.",
      imageUrl: "https://example.com/image.jpg",
      publishedAt: new Date("2026-11-07T10:00:00Z"),
      type: "rss",
      category: "ACTUALITÉ SÉNÉGAL",
      rawUrl: "https://www.aps.sn/actualite/programme-historique",
      sourceIdValue: "aps-001",
    });

    assert.ok(article.slug.length > 5);
    assert.equal(article.category, "ACTUALITÉ SÉNÉGAL");
    assert.equal(article.status, "draft");
    assert.equal(article.published, false);
    assert.ok(!article.content.includes("a vérifié"));
    assert.ok(article.content.includes("Référence"));
  });
});
