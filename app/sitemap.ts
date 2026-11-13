import type { MetadataRoute } from "next";

import { getAdminDb } from "@/lib/firebase-admin";

const SITE_URL = "https://www.barrotvinternational.com";

type SitemapArticle = {
  id: string;
  status?: string;
  published?: boolean;
  category?: string;
  slug?: string;
  updatedAt?: unknown;
  createdAt?: unknown;
};

function toDate(value: unknown) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === "function") return timestamp.toDate();
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const seconds = Number((value as { seconds?: number }).seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  return undefined;
}

function normalizeCategory(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const categoryPaths = [
  { path: "/afrique", keys: ["AFRIQUE"] },
  { path: "/culture", keys: ["CULTURE"] },
  { path: "/economie", keys: ["ECONOMIE"] },
  { path: "/faits-divers", keys: ["FAITSDIVERS"] },
  { path: "/international", keys: ["INTERNATIONAL"] },
  { path: "/justice", keys: ["JUSTICE"] },
  { path: "/personnes", keys: ["PERSONNES"] },
  { path: "/politique", keys: ["POLITIQUE"] },
  { path: "/societe", keys: ["SOCIETE", "ACTUALITESENEGAL"] },
  { path: "/sport", keys: ["SPORT"] },
  { path: "/technologie", keys: ["TECHNOLOGIE"] },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "/",
    "/a-propos",
    "/contact",
    "/recherche",
  ];

  const staticEntries: MetadataRoute.Sitemap = paths.map((path) => {
    const changeFrequency: "hourly" | "daily" = path === "/" ? "hourly" : "daily";
    return {
      url: `${SITE_URL}${path}`,
      changeFrequency,
      priority: path === "/" ? 1 : 0.7,
    };
  });

  try {
    const snapshot = await getAdminDb()
      .collection("articles")
      .where("status", "==", "published")
      .where("published", "==", true)
      .get();
    const publishedArticles: SitemapArticle[] = snapshot.docs
      .map((articleSnapshot) => ({ id: articleSnapshot.id, ...(articleSnapshot.data() as Omit<SitemapArticle, "id">) }))
      .filter((article) => article.status === "published" && article.published === true);

    const publishedCategories = new Set(
      publishedArticles
        .map((article) => typeof article.category === "string" ? normalizeCategory(article.category) : "")
        .filter(Boolean)
    );

    const categoryEntries = categoryPaths
      .filter(({ keys }) => keys.some((key) => publishedCategories.has(key)))
      .map(({ path }) => ({
        url: `${SITE_URL}${path}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));

    const articleEntries = publishedArticles.flatMap((article) => {
      const slug = typeof article.slug === "string" ? article.slug.trim() : "";
      if (!slug) return [];

      const lastModified = toDate(article.updatedAt) ?? toDate(article.createdAt);
      return [{
        url: `${SITE_URL}/article/${encodeURIComponent(slug)}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }];
    });

    return [...staticEntries, ...categoryEntries, ...articleEntries];
  } catch (error) {
    console.error("SITEMAP_ARTICLES_READ_ERROR", error instanceof Error ? error.message : "unknown error");
    return staticEntries;
  }
}