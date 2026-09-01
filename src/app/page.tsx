import AboutSection from "@/components/home/AboutSection";
import ProjectsSection from "@/components/home/ProjectsSection";
import { getProfile, getProjects } from "@/lib/api";

export const metadata = {
  title: "Моё портфолио",
  description: "Личный сайт-портфолио",
};

export default async function Home() {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);

  if (!profile) {
    return (
      <main className="home-main">
        <p className="home-empty">Профиль ещё не заполнен.</p>
      </main>
    );
  }

  return (
    <main className="home-main">
      <AboutSection profile={profile} />
      <ProjectsSection projects={projects} />
    </main>
  );
}