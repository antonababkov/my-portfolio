import type { Metadata } from "next";
import AboutSection from "@/components/home/AboutSection";
import ProjectsSection from "@/components/home/ProjectsSection";
import { getProfile, getProjects } from "@/lib/api";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();

  const title = profile ? profile.fullName : SITE_NAME;
  const description = profile?.description || SITE_NAME;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: "website",
      url: "/",
    },
  };
}

export default async function Home() {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);

  if (!profile) {
    return (
      <main className="home-main">
        <p className="home-empty">Профиль ещё не заполнен.</p>
      </main>
    );
  }

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    jobTitle: profile.position,
    description: profile.description,
  };

  return (
    <main className="home-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <AboutSection profile={profile} />
      <ProjectsSection projects={projects} />
    </main>
  );
}