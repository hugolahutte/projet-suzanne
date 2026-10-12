"use client";
import { ArrowRight } from "lucide-react";
import { SuzannePortrait, SpeechButton } from "./presence";
import type { Dashboard, Profile } from "./types";

export function Welcome({
  profile,
  dashboard,
}: {
  profile: Profile;
  dashboard: Dashboard | null;
}) {
  const remaining = dashboard?.goals.filter((goal) => !goal.done).length ?? 0;
  const greeting = `Bonjour ${profile.name}, c’est ${profile.nickname}. ${remaining ? `Tu as ${remaining} objectif${remaining > 1 ? "s" : ""} en cours. On fait le point ?` : "Qu’aimerais-tu apprendre aujourd’hui ?"} On peut aussi explorer une découverte, regarder tes cours ou jouer ensemble.`;
  return (
    <section className="welcome-card" aria-label="Ton rendez-vous avec Suzanne">
      <div className="welcome-photo">
        <SuzannePortrait />
      </div>
      <div className="welcome-copy">
        <span className="eyebrow">ON PREND UN MOMENT ?</span>
        <h2>Heureuse de te retrouver.</h2>
        <p>{greeting}</p>
        <SpeechButton text={greeting} />
        <p className="fine">
          Accueil guidé, lu avec la voix de ton appareil. Le dialogue libre et
          la vidéo arrivent ensuite.
        </p>
        <div className="welcome-actions">
          <a href="#progression">
            Mon point d’apprentissage <ArrowRight size={16} />
          </a>
          <a href="#programmes">
            Mes cours et programmes <ArrowRight size={16} />
          </a>
          <a href="#decouvertes">
            Surprends-moi <ArrowRight size={16} />
          </a>
          <a href="#jeux">
            On joue ensemble ? <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
