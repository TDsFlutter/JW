import BlogDetailPageClient from "./BlogDetailPageClient";
import { blogPosts } from "@/data/blog";

export async function generateStaticParams() {
  const paths = blogPosts.map((post) => ({
    slug: post.slug,
  }));
  console.log(`Generated ${paths.length} static paths for blog pages.`);
  return paths;
}

export default async function Page({ params }) {
  return <BlogDetailPageClient params={params} />;
}
