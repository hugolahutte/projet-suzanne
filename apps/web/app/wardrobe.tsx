"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ArrowDownToLine, Check, Shirt, Sparkles } from "lucide-react";

export const outfits = [
  {
    id: "rentree",
    name: "La rentrée",
    subtitle: "Prête pour le prochain chapitre",
    season: "Au quotidien",
    color: "#e9dffa",
  },
  {
    id: "halloween",
    name: "Halloween",
    subtitle: "Un sort de culture générale",
    season: "Octobre",
    color: "#f5e0ca",
  },
  {
    id: "noel",
    name: "Noël",
    subtitle: "Des découvertes sous le sapin",
    season: "Décembre",
    color: "#f5dfe3",
  },
  {
    id: "hiver",
    name: "L’hiver",
    subtitle: "Le cerveau bien au chaud",
    season: "Janvier · février",
    color: "#d7eae9",
  },
  {
    id: "ete",
    name: "L’été",
    subtitle: "La curiosité en vacances",
    season: "Juin · juillet · août",
    color: "#fff0bd",
  },
] as const;
type Outfit = (typeof outfits)[number]["id"];
type Style = "toon" | "photo";
type Look = { outfit: Outfit | "auto"; style: Style };
const initial: Look = { outfit: "auto", style: "toon" };
export function seasonalOutfit(date = new Date()): Outfit {
  const month = Number(
    new Intl.DateTimeFormat("fr-FR", {
      month: "numeric",
      timeZone: "Europe/Paris",
    }).format(date),
  );
  if (month === 10) return "halloween";
  if (month === 12) return "noel";
  if (month <= 2) return "hiver";
  if (month >= 6 && month <= 8) return "ete";
  return "rentree";
}
const LookContext = createContext({
  look: initial,
  current: "rentree" as Outfit,
  update: (_look: Look) => {
    void _look;
  },
  saveError: "",
});
export function LookProvider({
  profileId,
  children,
}: {
  profileId: string;
  children: ReactNode;
}) {
  const [look, setLook] = useState<Look>(initial);
  const [season, setSeason] = useState<Outfit>("rentree");
  const [saveError, setSaveError] = useState("");
  const key = `suzanne:look:v1:${profileId}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      if (
        saved &&
        (saved.outfit === "auto" ||
          outfits.some((o) => o.id === saved.outfit)) &&
        ["toon", "photo"].includes(saved.style)
      )
        setLook(saved);
    } catch {
      /* A blocked or invalid local store keeps the default look. */
    }
    const tick = () => setSeason(seasonalOutfit());
    tick();
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, [key]);
  function update(next: Look) {
    setLook(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setSaveError("");
    } catch {
      setSaveError(
        "Le look est appliqué pour cette visite. Ton navigateur ne permet pas de le mémoriser.",
      );
    }
  }
  return (
    <LookContext.Provider
      value={{
        look,
        current: look.outfit === "auto" ? season : look.outfit,
        update,
        saveError,
      }}
    >
      {children}
    </LookContext.Provider>
  );
}
export const useSuzanneLook = () => useContext(LookContext);

export function Wardrobe() {
  const { look, current, update, saveError } = useSuzanneLook();
  const selected = outfits.find((o) => o.id === current)!;
  return (
    <>
      <div className="page-heading wardrobe-heading">
        <div>
          <div className="eyebrow">LE CLUB DES CURIEUX</div>
          <h1>
            Le vestiaire de Suzanne<span className="heading-dot">.</span>
          </h1>
          <p>
            Même curiosité. Nouveau look. Choisis la Suzanne qui t’accompagne.
          </p>
        </div>
        <a className="pack-download" href="/brand/suzanne-pack-v1.zip" download>
          <ArrowDownToLine size={18} />
          Le pack graphique
        </a>
      </div>
      <section className="wardrobe-stage" aria-label="Aperçu du look">
        <div
          className={`wardrobe-preview ${look.style === "photo" ? "photo-preview" : ""}`}
          style={{ backgroundColor: selected.color }}
        >
          <span className="stage-spark spark-one" aria-hidden="true">
            ✦
          </span>
          <span className="stage-spark spark-two" aria-hidden="true">
            ✧
          </span>
          <Image
            src={
              look.style === "photo"
                ? "/suzanne-portrait-v2.png"
                : `/brand/suzanne-${current}.png`
            }
            alt={
              look.style === "photo"
                ? "Suzanne en portrait réaliste"
                : `Suzanne en tenue ${selected.name}`
            }
            width={400}
            height={600}
            sizes="(max-width: 700px) 85vw, 400px"
          />
          <span className="outfit-label">
            {look.style === "photo" ? "Le portrait original" : selected.name}
          </span>
        </div>
        <div className="wardrobe-copy">
          <span className="collection-tag">
            <Shirt size={16} />
            COLLECTION 01
          </span>
          <h2>
            Elle a plus d’un tour
            <br />
            dans son vestiaire.
          </h2>
          <p>
            Une touche de manga, une mèche rebelle et toujours cette envie de
            découvrir. Suzanne change de tenue au fil de l’année — ou selon ton
            humeur.
          </p>
          <fieldset className="look-switch">
            <legend>Le style de Suzanne</legend>
            <label>
              <input
                type="radio"
                name="look-style"
                checked={look.style === "toon"}
                onChange={() => update({ ...look, style: "toon" })}
              />
              Dessin animé
            </label>
            <label>
              <input
                type="radio"
                name="look-style"
                checked={look.style === "photo"}
                onChange={() => update({ ...look, style: "photo" })}
              />
              Portrait réaliste
            </label>
          </fieldset>
          <label className="season-toggle">
            <input
              type="checkbox"
              checked={look.outfit === "auto"}
              onChange={(e) =>
                update({ ...look, outfit: e.target.checked ? "auto" : current })
              }
            />
            <span>
              <strong>Au rythme des saisons</strong>
              <small>La tenue change automatiquement à chaque période.</small>
            </span>
          </label>
          <p className="look-status" role="status">
            <Check size={16} />
            {look.style === "photo"
              ? "Portrait réaliste appliqué"
              : `${selected.name} ${look.outfit === "auto" ? "· mode saisonnier" : "· tenue choisie"}`}
          </p>
          <p className="fine">
            Choix mémorisé pour ton profil sur cet appareil. Les tenues
            s’appliquent à la version dessin animé. Toute la collection est
            disponible, sans achat.
          </p>
          {saveError && <p role="alert">{saveError}</p>}
        </div>
      </section>
      <div className="section-heading">
        <h2>Une saison, une nouvelle aventure.</h2>
        <span>5 tenues à essayer</span>
      </div>
      <div className="outfit-grid">
        {outfits.map((outfit, index) => (
          <button
            className={`outfit-card ${current === outfit.id && look.style === "toon" ? "selected" : ""}`}
            key={outfit.id}
            aria-pressed={current === outfit.id && look.style === "toon"}
            onClick={() => update({ outfit: outfit.id, style: "toon" })}
            aria-label={`Porter la tenue ${outfit.name}`}
          >
            <div className="outfit-art" style={{ background: outfit.color }}>
              <span className="outfit-number">0{index + 1}</span>
              <Image
                src={`/brand/suzanne-${outfit.id}.png`}
                alt=""
                width={240}
                height={360}
                sizes="(max-width: 600px) 45vw, 220px"
              />
              {current === outfit.id && look.style === "toon" && (
                <span className="outfit-check">
                  <Check size={17} />
                </span>
              )}
            </div>
            <div className="outfit-caption">
              <small>{outfit.season}</small>
              <h3>{outfit.name}</h3>
              <p>{outfit.subtitle}</p>
              <span>
                Essayer <Sparkles size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>
      <section className="brand-pack-preview">
        <div>
          <span className="eyebrow">À EMPORTER PARTOUT</span>
          <h2>Un petit bout du club.</h2>
          <p>
            Logo, emblème, icônes et stickers de Suzanne : le premier pack pour
            donner vie à son univers.
          </p>
          <a href="/brand/suzanne-pack-v1.zip" download className="primary">
            <ArrowDownToLine size={18} />
            Télécharger le pack
          </a>
        </div>
        <Image
          src="/brand/suzanne-logo.png"
          alt="Logo Suzanne et son étincelle"
          width={480}
          height={192}
        />
      </section>
    </>
  );
}

export function GameCompanion() {
  const { current } = useSuzanneLook();
  return (
    <Image
      className="game-companion"
      src={`/brand/suzanne-${current}.png`}
      alt=""
      width={150}
      height={225}
      sizes="150px"
    />
  );
}
