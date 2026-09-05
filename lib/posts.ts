import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
}

export interface Post extends PostMeta {
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateFrontmatter(
  filename: string,
  data: Record<string, unknown>,
): PostMeta {
  const title = data.title;
  const description = data.description;
  const publishedAt = data.publishedAt;

  if (typeof title !== "string" || title.trim().length === 0) {
    throw new Error(`${filename}: title must be a non-empty string`);
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    throw new Error(`${filename}: description must be a non-empty string`);
  }

  if (typeof publishedAt !== "string" || !ISO_DATE_PATTERN.test(publishedAt)) {
    throw new Error(`${filename}: publishedAt must be an ISO date string`);
  }

  const slug = filename.replace(/\.mdx$/, "");

  return {
    slug,
    title: title.trim(),
    description: description.trim(),
    publishedAt,
  };
}

export function readPostsFrom(directory: string): Post[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const posts = fs
    .readdirSync(directory)
    .filter((filename) => filename.endsWith(".mdx"))
    .map((filename) => {
      const filePath = path.join(directory, filename);
      const raw = fs.readFileSync(filePath, "utf8");
      const { content, data } = matter(raw);
      const meta = validateFrontmatter(filename, data);

      return {
        ...meta,
        content: content.trim(),
      };
    });

  return posts.sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

export function getAllPosts(): PostMeta[] {
  return readPostsFrom(CONTENT_DIR).map(({ slug, title, description, publishedAt }) => ({
    slug,
    title,
    description,
    publishedAt,
  }));
}

export function formatPublishedDate(publishedAt: string): string {
  const [year, month, day] = publishedAt.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getPostBySlug(slug: string): Post | null {
  if (!SLUG_PATTERN.test(slug)) {
    return null;
  }

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(raw);
  const meta = validateFrontmatter(`${slug}.mdx`, data);

  return {
    ...meta,
    content: content.trim(),
  };
}
