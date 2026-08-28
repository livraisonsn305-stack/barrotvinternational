import type { Metadata } from "next";

import { getAdminDb } from "@/lib/firebase-admin";

const SITE_URL = "https://www.barrotvinternational.com";
const FALLBACK_IMAGE = `${SITE_URL}/logo.png`;

type ArticleMetadata = {
  id: string;
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  image?: string;
  status?: string;
  published?: boolean;
};

async function findArticle(id: string) {
  try {
    const snapshot = await getAdminDb().collection("articles").get();
    const article = snapshot.docs
      .map((articleSnapshot) => ({
        id: articleSnapshot.id,
        ...(articleSnapshot.data() as Omit<ArticleMetadata, "id">),
      }))
      .find((item) =>
        (item.slug === id || item.id === id) &&
        (item.status === "published" || item.published === true)
      );

    return article ?? null;
  } catch (error) {
    console.error("Article metadata loading error:", error);
    return null;
  }
}

function getPublicImage(image: string | undefined) {
  if (!image || typeof image !== "string") return FALLBACK_IMAGE;

  try {
    const normalized = image.trim();
    if (!normalized) return FALLBACK_IMAGE;

    const resolved = new URL(normalized, SITE_URL);
    const hostname = resolved.hostname.toLowerCase();
    const pathname = resolved.pathname.toLowerCase();
    const isImagePath = /\.(?:avif|gif|jpe?g|png|svg|webp)$/.test(pathname);
    const isVercelHost = hostname === "vercel.app" || hostname.endsWith(".vercel.app");
    const isUnsplashHost = hostname === "unsplash.com" || hostname.endsWith(".unsplash.com");
    const isLocalPath = normalized.startsWith("/");

    if (
      resolved.protocol === "https:" &&
      !isVercelHost &&
      !isUnsplashHost &&
      (isImagePath || isLocalPath)
    ) {
      return resolved.toString();
    }

    return FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function getImageType(imageUrl: string) {
  const extension = new URL(imageUrl).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const types: Record<string, string> = {
    avif: "image/avif",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    svg: "image/svg+xml",
    webp: "image/webp",
  };

  return extension ? types[extension] : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await findArticle(id);

  if (!article) {
    return {
      title: "Article introuvable",
      robots: { index: false, follow: false },
    };
  }

  const title = article.title?.trim() || "Barro TV International";
  const description =
    article.description?.trim() ||
    article.content?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    "Retrouvez les dernières informations de Barro TV International.";
  const image = getPublicImage(article.image);
  const url = `${SITE_URL}/article/${encodeURIComponent(article.slug || article.id)}`;
  const imageType = getImageType(image);
  const imageMetadata = {
    url: image,
    secureUrl: image,
    ...(imageType ? { type: imageType } : {}),
    width: 1200,
    height: 630,
    alt: title,
  };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [imageMetadata],
      siteName: "Barro TV International",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function ArticleLayout({ children }: LayoutProps<"/article/[id]">) {
  return children;
}