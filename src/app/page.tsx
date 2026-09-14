import AboutSection from "@/components/home/AboutSection";
import ProjectsSection from "@/components/home/ProjectsSection";
import { getProfile, getProjects } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);

  if (!profile) {
    return (
      <main id="main" className="home-main">
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
    <main id="main" className="home-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <AboutSection profile={profile} />
      <ProjectsSection projects={projects} />
    </main>
  );
}