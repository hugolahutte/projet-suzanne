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
export const styles = [
  {
    id: "real",
    name: "Réaliste",
    description: "Une présence naturelle",
    detail: "Photo · proportions humaines",
  },
  {
    id: "manga",
    name: "Manga",
    description: "Une héroïne dessinée",
    detail: "Anime · proportions naturelles",
  },
  {
    id: "sd",
    name: "SD",
    description: "Une complice miniature",
    detail: "Chibi · tête expressive, petit corps",
  },
] as const;
type Style = (typeof styles)[number]["id"];
export function companionAsset(style: Style, outfit: Outfit) {
  return style === "sd"
    ? `/brand/suzanne-${outfit}.png`
    : `/brand/styles/suzanne-${style}-${outfit}.png`;
}
type Look = { outfit: Outfit | "auto"; style: Style };
const initial: Look = { outfit: "auto", style: "sd" };
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
      const style =
        saved?.style === "toon"
          ? "sd"
          : saved?.style === "photo"
            ? "real"
            : saved?.style;
      if (
        saved &&
        (saved.outfit === "auto" ||
          outfits.some((o) => o.id === saved.outfit)) &&
        styles.some((s) => s.id === style)
      ) {
        setLook({ outfit: saved.outfit, style });
      }
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
  const selectedStyle = styles.find((s) => s.id === look.style)!;
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
        <a className="pack-download" href="/brand/suzanne-pack-v2.zip" download>
          <ArrowDownToLine size={18} />
          Le pack graphique
        </a>
      </div>
      <fieldset className="style-collection">
        <legend>Une Suzanne. Trois univers.</legend>
        <p className="style-intro">
          Même tenue, même personnage : choisis le style qui te plaît.
        </p>
        <div className="style-choices">
          {styles.map((style) => (
            <label
              key={style.id}
              className={`style-card ${look.style === style.id ? "selected" : ""}`}
            >
              <div
                className="style-card-art"
                style={{ backgroundColor: selected.color }}
              >
                <span className="style-chip">{style.name}</span>
                <Image
                  src={companionAsset(style.id, current)}
                  alt=""
                  width={400}
                  height={600}
                  sizes="(max-width: 600px) 85vw, 360px"
                />
              </div>
              <div className="style-card-copy">
                <span>
                  <strong>{style.description}</strong>
                  <small>{style.detail}</small>
                </span>
                <input
                  type="radio"
                  name="look-style"
                  aria-label={style.name}
                  checked={look.style === style.id}
                  onChange={() => update({ ...look, style: style.id })}
                />
              </div>
            </label>
          ))}
        </div>
      </fieldset>
      <section
        className="wardrobe-settings"
        aria-label="Personnalisation du look"
      >
        <div>
          <span className="collection-tag">
            <Shirt size={16} />
            COLLECTION 02 · 15 DÉCLINAISONS
          </span>
          <h2>Le style reste. La tenue change.</h2>
          <p>
            Réaliste, manga ou SD : les cinq saisons existent dans chaque
            univers.
          </p>
        </div>
        <div>
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
            {selectedStyle.name} · {selected.name}{" "}
            {look.outfit === "auto" ? "· mode saisonnier" : "· tenue choisie"}
          </p>
          <p className="fine">
            Choix mémorisé pour ton profil sur cet appareil. Toute la collection
            est disponible, sans achat.
          </p>
          {saveError && <p role="alert">{saveError}</p>}
        </div>
      </section>
      <div className="section-heading">
        <h2>Une saison, une nouvelle aventure.</h2>
        <span>5 tenues · style {selectedStyle.name}</span>
      </div>
      <div className="outfit-grid">
        {outfits.map((outfit, index) => (
          <button
            className={`outfit-card ${current === outfit.id ? "selected" : ""}`}
            key={outfit.id}
            aria-pressed={current === outfit.id}
            onClick={() => update({ ...look, outfit: outfit.id })}
            aria-label={`Porter la tenue ${outfit.name}`}
          >
            <div className="outfit-art" style={{ background: outfit.color }}>
              <span className="outfit-number">0{index + 1}</span>
              <Image
                src={companionAsset(look.style, outfit.id)}
                alt=""
                width={240}
                height={360}
                sizes="(max-width: 600px) 45vw, 220px"
              />
              {current === outfit.id && (
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
            Les logos du club et les quinze déclinaisons de Suzanne, réunis dans
            un même pack : réaliste, manga et SD.
          </p>
          <a href="/brand/suzanne-pack-v2.zip" download className="primary">
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
  const { look, current } = useSuzanneLook();
  return (
    <Image
      className="game-companion"
      src={companionAsset(look.style, current)}
      alt=""
      width={150}
      height={225}
      sizes="150px"
    />
  );
}
