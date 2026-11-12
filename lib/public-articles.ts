const PUBLIC_ARTICLE_FIELDS = [
  "title",
  "slug",
  "category",
  "description",
  "content",
  "image",
  "videoUrl",
  "keywords",
  "author",
  "status",
  "published",
  "views",
  "createdAt",
  "updatedAt",
  "sourceName",
  "sourceUrl",
  "canonicalUrl",
  "eventDate",
  "references",
] as const;

export function toPublicArticle(id: string, data: Record<string, unknown>) {
  if (data.status !== "published" || data.published !== true) {
    return null;
  }

  const article: Record<string, unknown> = { id };
  for (const field of PUBLIC_ARTICLE_FIELDS) {
    if (Object.hasOwn(data, field)) {
      article[field] = data[field];
    }
  }

  return article;
}
