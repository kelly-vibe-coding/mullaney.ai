import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { formatPublishedDate, getAllPosts, getPostBySlug } from "@/lib/posts";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="blog-shell">
      <nav className="blog-nav blog-post-top-nav" aria-label="Blog">
        <Link href="/blog">← All writing</Link>
      </nav>
      <article className="blog-prose">
        <header className="blog-post-header">
          <h1>{post.title}</h1>
          <p className="blog-post-description">{post.description}</p>
          <time className="blog-post-date" dateTime={post.publishedAt}>
            {formatPublishedDate(post.publishedAt)}
          </time>
        </header>
        <MDXRemote
          source={post.content}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </article>
      <nav className="blog-nav blog-post-bottom-nav" aria-label="Site">
        <Link href="/">Back to Shorts</Link>
      </nav>
    </main>
  );
}
