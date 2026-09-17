import AboutSection from "@/components/home/AboutSection";
import AboutExtraSection from "@/components/home/AboutExtraSection";
import ProjectsSection from "@/components/home/ProjectsSection";
import { getProfile, getProjects } from "@/lib/api";
import { SOCIALS } from "@/lib/constants";
import type { Profile, Project } from "@/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let profile: Profile | null = null;
  let projects: Project[] = [];

  try {
    [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  } catch (error) {
    console.error("Failed to load homepage data:", error);
  }

  if (!profile) {
    return (
      <main id="main" className="home-main">
        <p className="home-empty">Профиль ещё не заполнен.</p>
      </main>
    );
  }

  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    jobTitle: profile.position,
    description: profile.description,
    url: siteUrl,
    image: profile.photos[0]?.url ? `${siteUrl}${profile.photos[0].url}` : undefined,
    sameAs: SOCIALS.map((social) => social.href),
    email: profile.email,
    telephone: profile.phone,
  };

  return (
    <main id="main" className="home-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <AboutSection profile={profile} />
      <AboutExtraSection profile={profile} />
      <ProjectsSection projects={projects} />
    </main>
  );
}