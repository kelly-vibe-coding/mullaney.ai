import type { Metadata } from "next";
import Link from "next/link";

import { formatPublishedDate, getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing — Kelly Mullaney",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="blog-shell">
      <header className="blog-header">
        <p className="blog-site-name">Kelly Mullaney</p>
        <nav className="blog-nav" aria-label="Site">
          <Link href="/">Home / Shorts</Link>
          {" · "}
          <Link href="/blog" aria-current="page">
            Blog
          </Link>
        </nav>
        <h1>Some things I’ve put out</h1>
      </header>

      {posts.length === 0 ? (
        <p className="blog-coming-soon">Coming soon</p>
      ) : (
        <ul className="blog-index">
          {posts.map((post) => (
            <li key={post.slug} className="blog-index-item">
              <h2 className="blog-index-title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="blog-index-description">{post.description}</p>
              <time className="blog-index-date" dateTime={post.publishedAt}>
                {formatPublishedDate(post.publishedAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
