import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getPostBySlug, readPostsFrom } from "./posts";

describe("readPostsFrom", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "posts-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function writePost(
    filename: string,
    frontmatter: Record<string, string>,
    body = "Post body.",
  ) {
    const lines = Object.entries(frontmatter).map(
      ([key, value]) => `${key}: "${value}"`,
    );
    const content = `---\n${lines.join("\n")}\n---\n\n${body}`;
    fs.writeFileSync(path.join(tempDir, filename), content, "utf8");
  }

  it("parses valid frontmatter and derives slug from filename", () => {
    writePost(
      "applied-ai-is-a-practice.mdx",
      {
        title: "Applied AI is a practice",
        description: "The useful part starts after the demo.",
        publishedAt: "2026-09-03",
      },
    );

    const posts = readPostsFrom(tempDir);

    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      slug: "applied-ai-is-a-practice",
      title: "Applied AI is a practice",
      description: "The useful part starts after the demo.",
      publishedAt: "2026-09-03",
      content: "Post body.",
    });
  });

  it("sorts posts newest-first by ISO date", () => {
    writePost(
      "older-post.mdx",
      {
        title: "Older post",
        description: "An older article.",
        publishedAt: "2026-01-01",
      },
    );
    writePost(
      "newer-post.mdx",
      {
        title: "Newer post",
        description: "A newer article.",
        publishedAt: "2026-09-03",
      },
    );

    const posts = readPostsFrom(tempDir);

    expect(posts.map((post) => post.slug)).toEqual([
      "newer-post",
      "older-post",
    ]);
  });

  it("throws an error naming the file when required fields are missing", () => {
    writePost("missing-title.mdx", {
      description: "No title here.",
      publishedAt: "2026-09-03",
    });

    expect(() => readPostsFrom(tempDir)).toThrow(/missing-title\.mdx/);
  });

  it("ignores non-.mdx files", () => {
    writePost(
      "valid-post.mdx",
      {
        title: "Valid post",
        description: "A valid article.",
        publishedAt: "2026-09-03",
      },
    );
    fs.writeFileSync(path.join(tempDir, "notes.txt"), "ignore me", "utf8");

    const posts = readPostsFrom(tempDir);

    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("valid-post");
  });
});

describe("getPostBySlug", () => {
  it("returns null for invalid slug patterns", () => {
    expect(getPostBySlug("../secrets")).toBeNull();
    expect(getPostBySlug("Bad Slug")).toBeNull();
  });

  it("returns null for absent files", () => {
    expect(getPostBySlug("does-not-exist")).toBeNull();
  });
});
