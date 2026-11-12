import crypto from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "./firebase-admin";

export const VALID_NEWS_CATEGORIES = [
  "ACTUALITÉ SÉNÉGAL",
  "POLITIQUE",
  "SOCIÉTÉ",
  "ÉCONOMIE",
  "FAITS-DIVERS",
  "JUSTICE",
  "SPORT",
  "AFRIQUE",
  "INTERNATIONAL",
  "PERSONNES",
  "CULTURE",
  "TECHNOLOGIE",
] as const;

export type NewsCategory = (typeof VALID_NEWS_CATEGORIES)[number];

export type NewsSource = {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
  type: "rss" | "api";
  enabled: boolean;
  allowedDomains: string[];
};

export type NewsCandidate = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  canonicalUrl: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  publishedAt?: Date;
  type: "rss" | "api";
  category: NewsCategory;
  rawUrl: string;
  sourceIdValue?: string;
};

export type NewsAutomationResult = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  sourcesChecked: number;
  detected: number;
  duplicates: number;
  published: number;
  pending: number;
  rejected: number;
  sourceErrors: Array<{ sourceId: string; message: string }>;
  status: "ok" | "partial" | "skipped";
};

const DEFAULT_NEWS_SOURCES: NewsSource[] = [
  {
    id: "aps-senegal",
    name: "Agence de Presse Sénégalaise",
    url: "https://www.aps.sn/rss.xml",
    category: "ACTUALITÉ SÉNÉGAL",
    type: "rss",
    enabled: true,
    allowedDomains: ["aps.sn"],
  },
  {
    id: "le-monde-senegal",
    name: "Le Monde - Sénégal",
    url: "https://www.lemonde.fr/senegal/rss_full.xml",
    category: "ACTUALITÉ SÉNÉGAL",
    type: "rss",
    enabled: true,
    allowedDomains: ["lemonde.fr"],
  },
  {
    id: "afp-afrique",
    name: "AFP Afrique",
    url: "https://www.afp.com/fr/rss",
    category: "AFRIQUE",
    type: "rss",
    enabled: false,
    allowedDomains: ["afp.com"],
  },
];

function normalizeText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "actualite-auto";
}

function makeHash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getTagValue(content: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = content.match(pattern);
  if (!match) return "";
  return decodeHtml(normalizeText(match[1] ?? ""));
}

function getAttributeValue(content: string, tagName: string, attributeName: string) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*${attributeName}=["']([^"']+)["'][^>]*>`, "i");
  const match = content.match(pattern);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function extractImageFromHtml(value: string) {
  const imagePattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const mediaPattern = /<media:content[^>]+url=["']([^"']+)["'][^>]*>/i;
  const enclosurePattern = /<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i;

  return (
    value.match(imagePattern)?.[1] ??
    value.match(mediaPattern)?.[1] ??
    value.match(enclosurePattern)?.[1] ??
    ""
  );
}

function normalizeCategoryLabel(value?: string) {
  const label = (value ?? "").trim();
  if (!label) return "ACTUALITÉ SÉNÉGAL";

  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (normalized.includes("ACTUALITE") || normalized.includes("ACTUALIT")) return "ACTUALITÉ SÉNÉGAL";
  if (normalized.includes("POLITIQUE")) return "POLITIQUE";
  if (normalized.includes("SOCIETE") || normalized.includes("SOCIÉTÉ")) return "SOCIÉTÉ";
  if (normalized.includes("ECONOMIE")) return "ÉCONOMIE";
  if (normalized.includes("FAITSDIVERS") || normalized.includes("FAITS")) return "FAITS-DIVERS";
  if (normalized.includes("JUSTICE")) return "JUSTICE";
  if (normalized.includes("SPORT")) return "SPORT";
  if (normalized.includes("AFRIQUE")) return "AFRIQUE";
  if (normalized.includes("INTERNATIONAL")) return "INTERNATIONAL";
  if (normalized.includes("PERSONNE")) return "PERSONNES";
  if (normalized.includes("CULTURE")) return "CULTURE";
  if (normalized.includes("TECHNO")) return "TECHNOLOGIE";

  return "ACTUALITÉ SÉNÉGAL";
}

function classifyNewsCategory(title: string, description: string) {
  const haystack = `${title} ${description}`.toLowerCase();

  if (/(election|president|ministere|ministre|assemblee|gouvernement|parlement|politique|campagne)/i.test(haystack)) {
    return "POLITIQUE";
  }

  if (/(football|foot|sport|club|match|championnat|coupe|basket|athletisme|rugby)/i.test(haystack)) {
    return "SPORT";
  }

  if (/(justice|cour|tribunal|enquete|accusation|police|procureur|affaire)/i.test(haystack)) {
    return "JUSTICE";
  }

  if (/(afrique|sahel|union africaine|ceeac|dakar|ouest africain|senegal africain)/i.test(haystack)) {
    return "AFRIQUE";
  }

  if (/(finance|bourse|banque|commerce|investissement|energie|pouvoir d'achat|budget|devise)/i.test(haystack)) {
    return "ÉCONOMIE";
  }

  if (/(education|sante|transport|urbanisme|emploi|famille|societe|population|services publics)/i.test(haystack)) {
    return "SOCIÉTÉ";
  }

  if (/(culture|cinema|musique|theatre|festival|livre|art|langue|mode)/i.test(haystack)) {
    return "CULTURE";
  }

  if (/(technologie|ia|numerique|cyber|startup|innovation|telecom|informatique|internet)/i.test(haystack)) {
    return "TECHNOLOGIE";
  }

  if (/(international|monde|onu|union europeenne|organisation|etats-unis|france|afrique)|/i.test(haystack)) {
    return "INTERNATIONAL";
  }

  return "ACTUALITÉ SÉNÉGAL";
}

function parsePublishedDate(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?p>/gi, " ")
    .replace(/<\/?li>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function verifyAllowedSource(source: NewsSource, url: string) {
  try {
    const parsed = new URL(url);
    return source.allowedDomains.some((domain) => parsed.hostname.toLowerCase().includes(domain.toLowerCase()));
  } catch {
    return false;
  }
}

export function createNewsFingerprint(candidate: Pick<NewsCandidate, "sourceId" | "title" | "canonicalUrl">) {
  return makeHash(`${candidate.sourceId}|${candidate.title.trim()}|${candidate.canonicalUrl}`);
}

export function validateNewsCandidate(candidate: {
  title: string;
  description: string;
  content: string;
  category: string;
  canonicalUrl: string;
}) {
  const reasons: string[] = [];

  if (!candidate.title || candidate.title.trim().length < 12) {
    reasons.push("titre insuffisant");
  }
  if (!candidate.canonicalUrl || !/^https?:\/\//i.test(candidate.canonicalUrl)) {
    reasons.push("URL source absente ou invalide");
  }
  if (!candidate.content || candidate.content.length < 180) {
    reasons.push("contenu incomplet");
  }
  if (!candidate.description || candidate.description.length < 40) {
    reasons.push("description insuffisante");
  }
  if (!VALID_NEWS_CATEGORIES.includes(candidate.category as NewsCategory)) {
    reasons.push("catégorie non reconnue");
  }

  return reasons;
}

function parseRssXml(xmlText: string, source: NewsSource): NewsCandidate[] {
  const blocks = [...xmlText.matchAll(/<item\b[^>]*>[\s\S]*?<\/item>/gi)];
  const candidates: NewsCandidate[] = [];

  for (const block of blocks) {
    const item = block[0] ?? "";
    const title = decodeHtml(stripHtml(getTagValue(item, "title"))).trim();
    const link = decodeHtml(getAttributeValue(item, "link", "href") || getTagValue(item, "link")).trim();
    const rawDescription = getTagValue(item, "description") || getTagValue(item, "content:encoded") || getTagValue(item, "summary") || "";
    const description = stripHtml(rawDescription).slice(0, 500);
    const imageUrl = extractImageFromHtml(item) || "";
    const rawDate = getTagValue(item, "pubDate") || getTagValue(item, "dc:date") || getTagValue(item, "published") || "";
    const publishedAt = parsePublishedDate(rawDate);
    const canonicalUrl = link || source.url;

    if (!title || !canonicalUrl || !verifyAllowedSource(source, canonicalUrl)) {
      continue;
    }

    const content = [
      `Selon ${source.name}, ${title}.`,
      description || "Cette actualité est suivie et vérifiée par la rédaction de Barro TV International.",
      `Référence directe: ${canonicalUrl}`,
    ].join(" ");

    candidates.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      canonicalUrl,
      title,
      description: description || `${title} — information suivie et vérifiée auprès de la source autorisée.`,
      content,
      imageUrl,
      publishedAt,
      type: source.type,
      category: normalizeCategoryLabel(source.category),
      rawUrl: canonicalUrl,
      sourceIdValue: getTagValue(item, "guid") || makeHash(canonicalUrl),
    });
  }

  return candidates;
}

async function fetchSourceItems(source: NewsSource) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(source.url, {
      method: "GET",
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/json;q=0.9, */*;q=0.8",
        "User-Agent": "BarroTVInternational-NewsBot/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const parsed = parseRssXml(text, source);
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

export function createFallbackArticle(candidate: NewsCandidate) {
  const normalizedTitle = candidate.title.trim();
  const description =
    candidate.description ||
    `${normalizedTitle} — information communiquée par une source autorisée, à vérifier par la rédaction.`;
  const keywords = [
    candidate.sourceName,
    normalizeCategoryLabel(candidate.category),
    normalizedTitle
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 6)
      .join(", "),
  ].filter(Boolean);

  const content = [
    `<p>Barro TV International a repéré une information publiée par ${candidate.sourceName}. Une vérification éditoriale est nécessaire avant publication.</p>`,
    `<p><strong>${normalizedTitle}</strong></p>`,
    `<p>${description}</p>`,
    `<p>Ce brouillon reprend les éléments communiqués par la source. Les faits, chiffres, déclarations et références doivent être vérifiés par la rédaction avant publication.</p>`,
    `<p>Référence : <a href="${candidate.canonicalUrl}" target="_blank" rel="noreferrer">${candidate.canonicalUrl}</a></p>`,
  ].join("\n");

  const eventDate = candidate.publishedAt ?? new Date();
  const slug = slugify(normalizedTitle);
  const articleKey = makeHash(`${candidate.sourceId}:${candidate.canonicalUrl}:${normalizedTitle}:${eventDate.toISOString()}`);

  return {
    id: articleKey,
    title: normalizedTitle,
    slug,
    category: normalizeCategoryLabel(candidate.category),
    description,
    content,
    image: candidate.imageUrl || "",
    keywords,
    author: "Barro TV International",
    sourceName: candidate.sourceName,
    sourceUrl: candidate.canonicalUrl,
    canonicalUrl: candidate.canonicalUrl,
    sourceId: candidate.sourceIdValue || makeHash(candidate.canonicalUrl),
    eventDate: Timestamp.fromDate(eventDate),
    publishedAt: Timestamp.fromDate(eventDate),
    contentHash: createNewsFingerprint({ sourceId: candidate.sourceIdValue || candidate.sourceId, title: normalizedTitle, canonicalUrl: candidate.canonicalUrl }),
    references: [{ label: candidate.sourceName, url: candidate.canonicalUrl }],
    status: "draft" as const,
    published: false,
  };
}

function buildProviderPrompt(candidate: NewsCandidate) {
  return `Tu rédiges un article de presse en français pour Barro TV International.\n\nRÈGLES STRICTES:\n- Ne fabrique aucune information, aucun chiffre, aucun nom, aucune date, aucune citation et aucune source.\n- Utilise uniquement les informations fournies ci-dessous.\n- Si l'information est insuffisante, dis-le clairement sans conclure.\n- Écris un article professionnel, factuel et original en français.\n- Reste neutre, précis et clairs sur les sources.\n- Mets les références des sources à la fin.\n\nTITRE SOURCE: ${candidate.title}\nDESCRIPTION: ${candidate.description || "Aucune description fournie."}\nCATEGORIE SUGGÉRÉE: ${normalizeCategoryLabel(candidate.category)}\nURL SOURCE: ${candidate.canonicalUrl}\nNOM SOURCE: ${candidate.sourceName}\nDATE PUBLIÉE: ${candidate.publishedAt ? candidate.publishedAt.toISOString() : "Date non communiquée"}\n\nRÉPONDS UNIQUEMENT EN JSON VALIDE, AVEC CETTE STRUCTURE:\n{\n  "title": "...",\n  "description": "...",\n  "category": "ACTUALITÉ SÉNÉGAL|POLITIQUE|SOCIÉTÉ|ÉCONOMIE|FAITS-DIVERS|JUSTICE|SPORT|AFRIQUE|INTERNATIONAL|PERSONNES|CULTURE|TECHNOLOGIE",\n  "keywords": ["..."],\n  "content": "...paragraphes HTML...",\n  "references": [{"label": "...", "url": "..."}]\n}`;
}

export function getConfiguredAiProvider() {
  const configuredProvider = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  const openAiUrl = process.env.OPENAI_API_URL?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const provider = configuredProvider || (openAiUrl && openAiKey ? "openai" : geminiKey ? "gemini" : "none");

  if (provider === "gemini" && geminiKey) {
    return { provider: "gemini" as const, apiKey: geminiKey, model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash" };
  }

  if (provider === "openai" || (openAiUrl && openAiKey)) {
    return { provider: "openai" as const, apiKey: openAiKey ?? "", url: openAiUrl, model: process.env.OPENAI_MODEL ?? "gpt-4o-mini" };
  }

  return { provider: "none" as const };
}

export async function generateArticleFromSource(candidate: NewsCandidate) {
  const fallback = createFallbackArticle(candidate);
  const provider = getConfiguredAiProvider();

  if (provider.provider === "none") {
    return fallback;
  }

  try {
    if (provider.provider === "openai") {
      if (!provider.apiKey || !provider.url) {
        throw new Error("OPENAI_API_KEY or OPENAI_API_URL is missing");
      }

      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          temperature: 0.2,
          messages: [
            { role: "system", content: "Tu rédiges des articles factuels uniquement à partir des informations fournies. Ne fabrique pas de faits. Réponds en JSON valide uniquement." },
            { role: "user", content: buildProviderPrompt(candidate) },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed: ${response.status}`);
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content ?? "";
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as {
        title?: string;
        description?: string;
        category?: string;
        keywords?: string[];
        content?: string;
        references?: Array<{ label?: string; url?: string }>;
      };

      const finalTitle = (parsed.title ?? fallback.title).trim();
      const finalCategory = normalizeCategoryLabel(parsed.category ?? fallback.category);
      const finalKeywords = Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean).slice(0, 8) : fallback.keywords;
      const finalContent = (parsed.content ?? fallback.content).trim();
      const finalReferences = Array.isArray(parsed.references) && parsed.references.length > 0
        ? parsed.references.filter((ref) => ref?.url).map((ref) => ({ label: ref.label ?? candidate.sourceName, url: ref.url ?? candidate.canonicalUrl }))
        : fallback.references;

      return {
        ...fallback,
        title: finalTitle || fallback.title,
        category: finalCategory,
        description: (parsed.description ?? fallback.description).trim() || fallback.description,
        keywords: finalKeywords.length > 0 ? finalKeywords : fallback.keywords,
        content: finalContent || fallback.content,
        references: finalReferences,
      };
    }

    if (provider.provider === "gemini") {
      if (!provider.apiKey) {
        throw new Error("GEMINI_API_KEY is missing");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildProviderPrompt(candidate) }] }],
          generationConfig: { temperature: 0.2 },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.status}`);
      }

      const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      const parsed = match ? (JSON.parse(match[0]) as {
        title?: string;
        description?: string;
        category?: string;
        keywords?: string[];
        content?: string;
        references?: Array<{ label?: string; url?: string }>;
      }) : {};

      return {
        ...fallback,
        title: (parsed.title ?? fallback.title).trim() || fallback.title,
        category: normalizeCategoryLabel(parsed.category ?? fallback.category),
        description: (parsed.description ?? fallback.description).trim() || fallback.description,
        keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords.slice(0, 8) : fallback.keywords,
        content: (parsed.content ?? fallback.content).trim() || fallback.content,
        references: Array.isArray(parsed.references) && parsed.references.length > 0
          ? parsed.references.filter((ref) => ref?.url).map((ref) => ({ label: ref.label ?? candidate.sourceName, url: ref.url ?? candidate.canonicalUrl }))
          : fallback.references,
      };
    }
  } catch (error) {
    console.warn("AI_ARTICLE_GENERATION_FALLBACK", error);
  }

  return fallback;
}

export function isCronRequestAuthorized(request: Request, secret: string | undefined) {
  const header = request.headers.get("authorization") ?? request.headers.get("x-cron-secret") ?? "";
  const providedValue = /^Bearer\s+/i.test(header)
    ? header.replace(/^Bearer\s+/i, "").trim()
    : header.trim();
  const expectedValue = secret?.trim();

  if (!providedValue || !expectedValue) {
    return false;
  }

  const providedBuffer = Buffer.from(providedValue);
  const expectedBuffer = Buffer.from(expectedValue);
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

async function hasDuplicateNewsItem(db: ReturnType<typeof getAdminDb>, candidate: NewsCandidate) {
  const urlMatches = await db.collection("articles").where("sourceUrl", "==", candidate.canonicalUrl).limit(1).get();
  if (!urlMatches.empty) {
    return true;
  }

  if (candidate.sourceIdValue) {
    const sourceMatches = await db
      .collection("articles")
      .where("sourceId", "==", candidate.sourceIdValue)
      .limit(1)
      .get();
    if (!sourceMatches.empty) {
      return true;
    }
  }

  const normalizedTitle = candidate.title.trim();
  const signature = makeHash(`${candidate.sourceId}|${normalizedTitle}|${candidate.canonicalUrl}`);
  const hashMatches = await db.collection("articles").where("contentHash", "==", signature).limit(1).get();
  return !hashMatches.empty;
}

async function queueItem(status: "pending" | "rejected", item: NewsCandidate, reasons: string[]) {
  const db = getAdminDb();
  const queueId = makeHash(`${item.sourceId}:${item.canonicalUrl}:${item.title}`);

  await db.collection("news_queue").doc(queueId).set(
    {
      itemId: queueId,
      status,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      sourceUrl: item.canonicalUrl,
      title: item.title,
      reasons,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function writeRunLog(result: NewsAutomationResult) {
  const db = getAdminDb();
  const logDoc = db.collection("news_runs").doc(result.runId);
  await logDoc.set(
    {
      runId: result.runId,
      startedAt: new Date(result.startedAt),
      finishedAt: new Date(result.finishedAt),
      sourcesChecked: result.sourcesChecked,
      detected: result.detected,
      duplicates: result.duplicates,
      published: result.published,
      pending: result.pending,
      rejected: result.rejected,
      sourceErrors: result.sourceErrors,
      status: result.status,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function runNewsAutomation(): Promise<NewsAutomationResult> {
  const db = getAdminDb();
  const runId = makeHash(`${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 24);
  const startedAt = new Date();
  const lockDoc = db.collection("news_lock").doc("automation");
  const result: NewsAutomationResult = {
    runId,
    startedAt: startedAt.toISOString(),
    finishedAt: startedAt.toISOString(),
    sourcesChecked: 0,
    detected: 0,
    duplicates: 0,
    published: 0,
    pending: 0,
    rejected: 0,
    sourceErrors: [],
    status: "skipped",
  };

  try {
    await db.runTransaction(async (transaction) => {
      const existingLock = await transaction.get(lockDoc);
      const existingUntil = existingLock.get("lockUntil");
      const lockDate = existingUntil && typeof existingUntil.toDate === "function" ? existingUntil.toDate() : null;

      if (existingLock.exists && lockDate && lockDate.getTime() > Date.now()) {
        throw new Error("Another news automation run is still in progress.");
      }

      transaction.set(
        lockDoc,
        {
          runId,
          lockUntil: new Date(Date.now() + 60000),
          startedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    const enabledSources = DEFAULT_NEWS_SOURCES.filter((source) => source.enabled);
    result.sourcesChecked = enabledSources.length;

    for (const source of enabledSources) {
      try {
        const items = await fetchSourceItems(source);

        for (const item of items) {
          result.detected += 1;

          if (!item.publishedAt || item.publishedAt.getTime() < Date.now() - 1000 * 60 * 60 * 24 * 45) {
            await queueItem("rejected", item, ["information trop ancienne"]);
            result.rejected += 1;
            continue;
          }

          if (await hasDuplicateNewsItem(db, item)) {
            result.duplicates += 1;
            continue;
          }

          const article = await generateArticleFromSource(item);
          const validationReasons = validateNewsCandidate({
            title: article.title,
            description: article.description,
            content: article.content,
            category: article.category,
            canonicalUrl: article.canonicalUrl,
          });

          const sensitiveTerms = /(deces|décès|accusation|enquete|enquête|election|élection|affaire judiciaire|arrestation|condamnation)/i;
          if (sensitiveTerms.test(article.title) && article.content.length < 300) {
            validationReasons.push("vérification renforcée requise");
          }

          if (validationReasons.length > 0) {
            await queueItem("pending", item, validationReasons);
            result.pending += 1;
            continue;
          }

          await db.collection("articles").doc(article.id).set(
            {
              title: article.title,
              slug: article.slug,
              category: article.category,
              description: article.description,
              content: article.content,
              image: article.image,
              author: article.author,
              status: "draft",
              published: false,
              keywords: article.keywords,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              sourceName: article.sourceName,
              sourceUrl: article.sourceUrl,
              canonicalUrl: article.canonicalUrl,
              sourceId: article.sourceId,
              contentHash: article.contentHash,
              eventDate: article.eventDate,
              references: article.references,
            },
            { merge: true }
          );

          result.pending += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected source error";
        result.sourceErrors.push({ sourceId: source.id, message });
      }
    }

    result.finishedAt = new Date().toISOString();
    result.status = result.published > 0 || result.pending > 0 || result.rejected > 0 ? "partial" : "ok";
    if (result.detected === 0 && result.sourceErrors.length > 0) {
      result.status = "partial";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected automation error";
    result.finishedAt = new Date().toISOString();
    result.sourceErrors.push({ sourceId: "automation", message });
    result.status = "partial";
  } finally {
    await lockDoc.set(
      {
        runId,
        lockUntil: null,
        finishedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await writeRunLog(result);
  }

  return result;
}
