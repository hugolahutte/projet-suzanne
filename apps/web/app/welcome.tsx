"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Volume2, Square } from "lucide-react";
import type { Dashboard, Profile } from "./types";

export function Welcome({
  profile,
  dashboard,
}: {
  profile: Profile;
  dashboard: Dashboard | null;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const remaining = dashboard?.goals.filter((goal) => !goal.done).length ?? 0;
  const greeting = `Bonjour ${profile.name}, c’est ${profile.nickname}. ${remaining ? `Tu as ${remaining} objectif${remaining > 1 ? "s" : ""} en cours. On fait le point ?` : "Qu’aimerais-tu apprendre aujourd’hui ?"} On peut aussi explorer une découverte, regarder tes cours ou jouer ensemble.`;
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );
  function speak() {
    if (!("speechSynthesis" in window)) {
      setFeedback(
        "La lecture vocale n’est pas disponible sur ce navigateur. Tu peux lire le message ci-dessus.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(greeting);
    utterance.lang = "fr-FR";
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("fr") && v.localService);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setFeedback(
        "La lecture n’a pas pu démarrer. Le message reste disponible à l’écran.",
      );
    };
    setFeedback("");
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }
  return (
    <section className="welcome-card" aria-label="Ton rendez-vous avec Suzanne">
      <div className="welcome-photo">
        <Image
          src="/suzanne-portrait-v2.png"
          alt="Suzanne, personnage fictif créé par IA"
          width={640}
          height={640}
          sizes="(max-width: 600px) 90vw, 300px"
          preload
        />
        <span>Suzanne · ton IA pédagogique</span>
      </div>
      <div className="welcome-copy">
        <span className="eyebrow">ON PREND UN MOMENT ?</span>
        <h2>Heureuse de te retrouver.</h2>
        <p>{greeting}</p>
        <button className="text-button" onClick={speak} aria-pressed={speaking}>
          {speaking ? <Square size={17} /> : <Volume2 size={18} />}{" "}
          {speaking ? "Arrêter la lecture" : "Écouter Suzanne"}
        </button>
        <p className="fine">
          Accueil guidé, lu avec la voix de ton appareil. Le dialogue libre et
          la vidéo arrivent ensuite.
        </p>
        {feedback && <p role="status">{feedback}</p>}
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
