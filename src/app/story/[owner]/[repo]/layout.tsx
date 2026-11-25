import type { Metadata } from "next";
import React from "react";

interface StoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ owner: string; repo: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}): Promise<Metadata> {
  const { owner, repo } = await params;
  const fullName = `${decodeURIComponent(owner)}/${decodeURIComponent(repo)}`;
  const description = `Explore the interactive commit timeline, contributor race, activity heatmap, and AI biography of ${fullName} on GitStory.`;

  return {
    title: fullName,
    description,
    openGraph: {
      title: `${fullName} — GitStory`,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullName} — GitStory`,
      description,
    },
  };
}

export default function StoryLayout({ children }: StoryLayoutProps) {
  return <>{children}</>;
}
