"use client";
import Image from "next/image";
import {
  useSuzanneLook,
  outfits,
  styles,
  companionAsset,
  defaultStyle,
} from "./wardrobe";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Square } from "lucide-react";

export function SuzannePortrait({
  publicWelcome = false,
}: {
  publicWelcome?: boolean;
}) {
  const [animated, setAnimated] = useState(false);
  const { look, current } = useSuzanneLook();
  const style = publicWelcome ? defaultStyle : look.style;
  const outfit = publicWelcome ? "rentree" : current;
  return (
    <div
      className={`suzanne-presence toon-presence style-${style} ${animated ? "is-animated" : ""} ${publicWelcome ? "public-portrait" : ""}`}
    >
      <Image
        src={companionAsset(style, outfit)}
        alt={`Suzanne, personnage fictif, style ${styles.find((s) => s.id === style)?.name}, tenue ${outfits.find((o) => o.id === outfit)?.name}`}
        width={640}
        height={960}
        sizes="(max-width: 760px) 90vw, 440px"
        preload
      />
      <div className="presence-controls">
        <span>Suzanne · ton IA pédagogique</span>
        <button
          type="button"
          onClick={() => setAnimated(!animated)}
          aria-pressed={animated}
        >
          {animated ? <Pause size={14} /> : <Play size={14} />}{" "}
          {animated ? "Arrêter l’animation" : "Animer le portrait"}
        </button>
      </div>
    </div>
  );
}
export function SpeechButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      window.speechSynthesis?.cancel();
    },
    [],
  );
  function speak() {
    if (!("speechSynthesis" in window)) {
      setFeedback(
        "La lecture vocale n’est pas disponible dans ce navigateur. Le message reste lisible à l’écran.",
      );
      return;
    }
    const id = ++generation.current;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.95;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("fr") && v.localService);
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (generation.current === id) setSpeaking(false);
    };
    utterance.onerror = () => {
      if (generation.current === id) {
        setSpeaking(false);
        setFeedback(
          "La lecture n’a pas pu démarrer. Tu peux lire le message à l’écran.",
        );
      }
    };
    setFeedback("");
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }
  return (
    <>
      <button
        className="text-button"
        type="button"
        onClick={speak}
        aria-pressed={speaking}
      >
        {speaking ? <Square size={17} /> : <Volume2 size={18} />}{" "}
        {speaking ? "Arrêter la lecture" : "Écouter Suzanne"}
      </button>
      {feedback && <p role="status">{feedback}</p>}
    </>
  );
}
export function PublicWelcome() {
  const text =
    "Bonjour, moi c’est Suzanne. Je t’accompagne pour apprendre, découvrir et jouer, à tout âge. Choisis ton profil, et on commence ensemble.";
  return (
    <div className="login-copy public-welcome">
      <SuzannePortrait publicWelcome />
      <div className="public-intro">
        <span className="eyebrow">APPRENDRE. EXPLORER. GRANDIR.</span>
        <h1>
          Bonjour, moi c’est Suzanne<span>.</span>
        </h1>
        <p>
          Un coup de pouce pour tes cours. Une découverte inattendue. Un jeu en
          famille. On commence par quoi ?
        </p>
        <SpeechButton text={text} />
        <p className="presence-note">
          Une complice pour les grandes questions et les petites victoires. Voix
          de ton appareil · vidéo parlante à venir.
        </p>
      </div>
    </div>
  );
}
