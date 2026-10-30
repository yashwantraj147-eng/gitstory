import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

export const metadata: Metadata = {
  title: "GitStory — Turn any GitHub Repo into an Interactive Historical Narrative",
  description:
    "Generate animated timelines, contributor race charts, activity heatmaps, and AI-crafted narratives from any public GitHub repository URL.",
  keywords: ["GitHub", "Git", "visualizer", "timeline", "analytics", "commit history", "developer portfolio"],
  openGraph: {
    title: "GitStory — Visual Repo Biographies",
    description: "Generate animated timelines, contributor race charts, and AI narratives from any GitHub repo.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 flex flex-col justify-between antialiased selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

