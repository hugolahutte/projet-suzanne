"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Dices,
  Globe2,
  GraduationCap,
  Headphones,
  Leaf,
  Plus,
  ShieldCheck,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import { Notebook } from "./notebook";
import { PublicWelcome, SuzannePortrait } from "./presence";
import { Welcome } from "./welcome";
import { Navigation, Brand, destinations, type Section } from "./navigation";
import { LookProvider, Wardrobe } from "./wardrobe";
import { Games } from "./games";
import { FamilyOffice, DocumentLibrary } from "./family-office";
import { Curriculum } from "./curriculum";
import { Tutor } from "./tutor";
import { api } from "./api";
import { Flower, Landscape } from "./art";
import type { Account, Dashboard, Me } from "./types";

const allSections = destinations.map((d) => d.id);
const demoPassword = "Suzanne-demo-2026!";
const initials = (name: string) => name.slice(0, 1);

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [section, setSection] = useState<Section>("accueil");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [family, setFamily] = useState("Famille Atelier");
  const [demoMode, setDemoMode] = useState(false);
  const [selected, setSelected] = useState("camille");
  const [password, setPassword] = useState(demoPassword);
  const [lesson, setLesson] = useState<string | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [goal, setGoal] = useState("");
  const [nickname, setNickname] = useState("");
  const [large, setLarge] = useState(false);
  const household = me?.households[0];
  const isChild = household?.role === "child";
  const demoSelected = accounts.find((a) => a.id === selected)?.demo !== false;

  async function loadSession() {
    const next = await api<Me>("/me");
    const hid = next.households[0]?.id;
    const data = await api<Dashboard>(`/households/${hid}/dashboard`);
    setMe(next);
    setDashboard(data);
    setNickname(next.profile.nickname);
    setLarge(next.profile.large_text);
  }
  useEffect(() => {
    async function start() {
      try {
        const available = await api<Account[]>("/demo/accounts");
        // Fixture households are selectable only in the explicit test entry.
        const testing =
          new URLSearchParams(window.location.search).get("demo") === "1";
        setDemoMode(testing);
        const candidates = testing
          ? available.filter((a) => a.demo)
          : available;
        const first = candidates.find((a) => !a.demo) ?? candidates[0];
        setAccounts(
          testing
            ? candidates
            : candidates.filter((a) => a.household === first?.household),
        );
        if (first) {
          setFamily(first.household);
          setSelected(first.id);
          setPassword(first.demo ? demoPassword : "");
        }
        const response = await fetch("/api/me", { cache: "no-store" });
        if (response.ok) await loadSession();
        else if (response.status !== 401)
          throw new Error("L’API ne répond pas. Réessaie dans un instant.");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    void start();
    const route = () => {
      const id = window.location.hash.slice(1);
      setSection(allSections.includes(id) ? (id as Section) : "accueil");
      setNotice("");
      requestAnimationFrame(() => {
        document.getElementById("main-content")?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      });
    };
    route();
    window.addEventListener("hashchange", route);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => window.removeEventListener("hashchange", route);
  }, []);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function login(event: FormEvent) {
    event.preventDefault();
    await act(async () => {
      const account = accounts.find((a) => a.id === selected);
      if (!account) throw new Error("Choisis un profil.");
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: account.email, password }),
      });
      await loadSession();
      window.location.hash = "accueil";
      window.scrollTo(0, 0);
    });
  }
  function openLesson(name: string) {
    setAnswer(null);
    setLesson(name);
  }
  async function addGoal(event: FormEvent) {
    event.preventDefault();
    await act(async () => {
      await api(`/households/${household?.id}/goals`, {
        method: "POST",
        body: JSON.stringify({ title: goal }),
      });
      setGoal("");
      await loadSession();
      setNotice("Ton objectif a été ajouté.");
    });
  }
  const visibleGoals =
    section === "accueil"
      ? dashboard?.goals.filter((goal) => !goal.done).slice(0, 3)
      : dashboard?.goals;
  const goalList = (
    <div className="goal-list">
      {section === "accueil" && !visibleGoals?.length && (
        <p className="muted">Une envie ? Choisis ton prochain objectif.</p>
      )}
      {visibleGoals?.map((g) => (
        <button
          key={g.id}
          className={`goal ${g.done ? "done" : ""}`}
          disabled={busy}
          aria-pressed={g.done}
          onClick={() =>
            void act(async () => {
              await api(`/households/${household?.id}/goals/${g.id}`, {
                method: "PATCH",
                body: JSON.stringify({ done: !g.done }),
              });
              await loadSession();
            })
          }
        >
          <span className="check-box">{g.done && <Check size={14} />}</span>
          {g.title}
        </button>
      ))}
    </div>
  );

  if (loading)
    return (
      <main className="loading" aria-busy="true">
        <Flower />
        <h1>Un instant pour la curiosité…</h1>
        <p>Ton espace se prépare.</p>
      </main>
    );
  if (!me)
    return (
      <main className="entry-page">
        <header className="entry-header">
          <Brand />
          <span>La curiosité n’a pas d’âge.</span>
        </header>
        <div className="entry-story">
          <PublicWelcome />
        </div>
        <section className="entry-panel" aria-labelledby="entry-title">
          <span className="entry-kicker">À CHACUN SON AVENTURE</span>
          <h2 id="entry-title">On commence ?</h2>
          <p className="muted">Choisis ton profil. La suite t’appartient.</p>
          {demoMode && (
            <div className="family-tabs" aria-label="Choix du foyer">
              {[...new Set(accounts.map((a) => a.household))].map((f) => (
                <button
                  key={f}
                  aria-pressed={family === f}
                  onClick={() => {
                    setFamily(f);
                    const first = accounts.find((a) => a.household === f);
                    if (first) {
                      setSelected(first.id);
                      setPassword(first.demo ? demoPassword : "");
                    }
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={login}>
            <fieldset className="profile-grid">
              <legend className="sr-only">Ton profil</legend>
              {accounts
                .filter((a) => a.household === family)
                .map((a, i) => (
                  <label
                    className={`profile-option ${selected === a.id ? "selected" : ""}`}
                    key={a.id}
                  >
                    <input
                      type="radio"
                      name="profile"
                      value={a.id}
                      checked={selected === a.id}
                      onChange={() => {
                        setSelected(a.id);
                        setPassword(a.demo ? demoPassword : "");
                      }}
                    />
                    <span className={`avatar color-${i % 4}`}>
                      {initials(a.name)}
                    </span>
                    <strong>{a.name}</strong>
                    <span>
                      {a.age} ans ·{" "}
                      {a.role === "guardian"
                        ? "Parent"
                        : a.role === "child"
                          ? "Enfant"
                          : "Adulte"}
                    </span>
                    {selected === a.id && (
                      <Check size={16} className="selected-check" />
                    )}
                  </label>
                ))}
            </fieldset>
            <label className="field">
              {demoSelected
                ? "Mot de passe de démonstration"
                : "Mot de passe local"}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <p className="fine">
              {demoSelected ? (
                <>
                  Mot de passe commun : <code>{demoPassword}</code>
                </>
              ) : (
                "Ton mot de passe protège l’accès à ton espace familial."
              )}
            </p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button
              className="primary full"
              disabled={busy || !accounts.length}
            >
              {busy ? "Connexion…" : "Entrer dans mon espace"}
              <ArrowRight size={18} />
            </button>
          </form>
          {!accounts.length && (
            <button
              className="text-button"
              onClick={() => window.location.reload()}
            >
              Réessayer la connexion
            </button>
          )}
          <div className="privacy">
            <ShieldCheck size={20} />
            <p>
              {demoSelected ? (
                <>
                  Des familles imaginaires, des espaces séparés.
                  <br />
                  Aucune donnée familiale réelle dans ces profils fictifs.
                </>
              ) : (
                <>Ton espace familial reste privé, sur cet ordinateur.</>
              )}
            </p>
          </div>
        </section>
        <footer className="entry-footer">
          <span>Un peu chaque jour. Beaucoup à découvrir.</span>
          <span>Démo locale · IA pédagogique</span>
        </footer>
      </main>
    );

  return (
    <LookProvider key={me.profile.id} profileId={me.profile.id}>
      <div className={`shell ${me.profile.large_text ? "large-text" : ""}`}>
        <a className="skip" href="#main-content">
          Aller au contenu
        </a>
        <Navigation
          me={me}
          section={section}
          busy={busy}
          onLogout={() =>
            void act(async () => {
              await api("/auth/logout", { method: "POST" });
              setMe(null);
              setDashboard(null);
              setLesson(null);
              setError("");
            })
          }
        />
        <div className="main-shell">
          <main id="main-content" tabIndex={-1} className="content">
            {error && (
              <div role="alert" className="error">
                {error}
                <button onClick={() => void act(loadSession)}>Réessayer</button>
              </div>
            )}
            {notice && (
              <p className="notice" role="status">
                <Check size={16} />
                {notice}
              </p>
            )}
            {section === "vestiaire" && <Wardrobe />}
            {section === "carnet" && household && (
              <>
                <Notebook key={me.profile.id} hid={household.id} />
                <DocumentLibrary
                  key={`documents-${me.profile.id}`}
                  hid={household.id}
                />
              </>
            )}
            {section === "jeux" && household && <Games hid={household.id} />}
            {section === "programmes" && (
              <Curriculum initialLevel={me.profile.level} />
            )}
            {section === "accueil" && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">
                      <span className="tiny-sun">✳</span> UN PEU DE CURIOSITÉ,
                      CHAQUE JOUR
                    </div>
                    <h1>
                      Bonjour {me.profile.name}
                      <span className="heading-dot">.</span>
                    </h1>
                    <p>
                      {isChild
                        ? "Qu’est-ce qu’on découvre ensemble aujourd’hui ?"
                        : "Le monde a encore tant de choses à t’apprendre."}
                    </p>
                  </div>
                  <div className="today-note">
                    <Leaf size={18} />
                    <span>
                      À ton rythme.
                      <br />
                      <strong>Pour le plaisir d’apprendre.</strong>
                    </span>
                  </div>
                </div>
                <div className="dashboard-grid">
                  <div className="main-column">
                    <Welcome profile={me.profile} dashboard={dashboard} />
                    <div className="section-heading">
                      <h2>
                        {isChild
                          ? "À toi de jouer"
                          : "Une envie pour aujourd’hui ?"}
                      </h2>
                      <span>Choisis ton prochain pas</span>
                    </div>
                    <div className="quick-grid">
                      <a href="#apprendre">
                        <span className="icon-tile peach">
                          <GraduationCap />
                        </span>
                        <strong>
                          {isChild
                            ? "Un coup de pouce"
                            : "Apprendre à mon rythme"}
                        </strong>
                        <span>
                          {isChild
                            ? "Comprendre, pas à pas"
                            : "Faire grandir mes compétences"}
                        </span>
                        <ArrowUpRight size={17} />
                      </a>
                      <a href="#decouvertes">
                        <span className="icon-tile sage">
                          <Compass />
                        </span>
                        <strong>Ouvrir mes horizons</strong>
                        <span>Se laisser surprendre</span>
                        <ArrowUpRight size={17} />
                      </a>
                      <a href="#vestiaire">
                        <span className="icon-tile lavender">
                          <Sparkles />
                        </span>
                        <strong>Le look de Suzanne</strong>
                        <span>Cinq tenues à essayer</span>
                        <ArrowUpRight size={17} />
                      </a>
                    </div>
                    <div className="section-heading">
                      <h2>La sélection de Suzanne</h2>
                      <a href="#decouvertes">
                        Tout explorer
                        <ArrowRight size={15} />
                      </a>
                    </div>
                    <div className="discovery-grid">
                      <button
                        className="discovery-card"
                        onClick={() =>
                          openLesson(
                            "Pourquoi la Lune change-t-elle de forme ?",
                          )
                        }
                      >
                        <div className="card-art">
                          <Landscape />
                          <span className="art-badge">
                            SCIENCES & ÉMERVEILLEMENT
                          </span>
                        </div>
                        <div className="card-copy">
                          <span className="fine">
                            Une première découverte · 3 min
                          </span>
                          <h3>
                            La Lune a-t-elle vraiment
                            <br />
                            plusieurs visages ?
                          </h3>
                          <span className="card-link">
                            Explorer la question <ArrowUpRight size={17} />
                          </span>
                        </div>
                      </button>
                      <button
                        className="discovery-card"
                        onClick={() => openLesson("Le voyage de l’eau")}
                      >
                        <div className="card-art">
                          <Landscape variant="earth" />
                          <span className="art-badge">NOTRE PLANÈTE</span>
                        </div>
                        <div className="card-copy">
                          <span className="fine">
                            Une première découverte · 3 min
                          </span>
                          <h3>
                            Une goutte d’eau,
                            <br />
                            un incroyable voyage.
                          </h3>
                          <span className="card-link">
                            Suivre le voyage <ArrowUpRight size={17} />
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                  <aside className="right-column">
                    <section className="family-play-card">
                      <span className="eyebrow">UN MOMENT À PARTAGER</span>
                      <div className="play-mark" aria-hidden="true">
                        <Dices size={34} />
                      </div>
                      <h2>On joue ?</h2>
                      <p>
                        Capitales ou petit bac : la curiosité se partage, de 1 à
                        4 joueurs.
                      </p>
                      <a href="#jeux">
                        Choisir un jeu <ArrowUpRight size={18} />
                      </a>
                    </section>
                    <section className="week-card">
                      <div className="section-heading">
                        <h2>Chaque petit pas compte</h2>
                        <Sprout size={20} />
                      </div>
                      <p className="simulation">APERÇU · ACTIVITÉ SIMULÉE</p>
                      <div className="stat">
                        <strong>
                          {dashboard?.minutes}
                          <span>min</span>
                        </strong>
                        <span>
                          de curiosité
                          <br />
                          cette semaine
                        </span>
                      </div>
                      <div
                        className="week-chart"
                        aria-label="Activité fictive : lundi 15, mardi 8, mercredi 0, jeudi 12, vendredi 10, samedi 0, dimanche 0 minutes"
                      >
                        {dashboard?.week.map((v, i) => (
                          <div key={i}>
                            <div className="bar-track">
                              <span
                                style={{ height: `${Math.max(v * 5, 5)}%` }}
                              />
                            </div>
                            <span>
                              {["L", "M", "M", "J", "V", "S", "D"][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                      <a href="#progression" className="subtle-link">
                        Voir mes petits pas
                        <ArrowRight size={15} />
                      </a>
                    </section>
                    <section className="goals-card">
                      <div className="section-heading">
                        <h2>Mon cap du moment</h2>
                        <span>↗</span>
                      </div>
                      {goalList}
                      <a href="#progression" className="subtle-link">
                        <Plus size={15} />
                        Choisir un objectif
                      </a>
                    </section>
                    <p className="gentle-note">
                      <Leaf size={16} />
                      L’essentiel, c’est le chemin.
                      <br />
                      Pas la course.
                    </p>
                  </aside>
                </div>
              </>
            )}
            {section === "decouvertes" && (
              <>
                <PageTitle
                  eyebrow="LE MONDE EST UN TERRAIN DE JEU"
                  title="Cultivons la curiosité."
                  text="Des questions toutes simples. Des horizons tout neufs."
                />
                <div className="discovery-grid wide">
                  <button
                    className="discovery-card"
                    onClick={() =>
                      openLesson("Pourquoi la Lune change-t-elle de forme ?")
                    }
                  >
                    <Landscape />
                    <div className="card-copy">
                      <span className="eyebrow">SCIENCES · 3 MIN</span>
                      <h2>Les visages de la Lune</h2>
                      <p>Une fiche et une question pour comprendre.</p>
                      <span className="card-link">
                        Je découvre <ArrowRight size={18} />
                      </span>
                    </div>
                  </button>
                  <button
                    className="discovery-card"
                    onClick={() => openLesson("Le voyage de l’eau")}
                  >
                    <Landscape variant="earth" />
                    <div className="card-copy">
                      <span className="eyebrow">NATURE · 3 MIN</span>
                      <h2>Le voyage de l’eau</h2>
                      <p>Du nuage à l’océan, et retour.</p>
                      <span className="card-link">
                        Je découvre <ArrowRight size={18} />
                      </span>
                    </div>
                  </button>
                </div>
                <p className="fine">
                  Fiches de démonstration écrites pour Suzanne. Les réponses ne
                  mesurent pas encore ta progression.
                </p>
              </>
            )}
            {section === "progression" && (
              <>
                <PageTitle
                  eyebrow="AVANCER, À SA FAÇON"
                  title="Mes petits pas."
                  text="Tes envies comptent autant que le chemin parcouru."
                />
                <div className="two-columns">
                  <section className="panel">
                    <h2>Mes objectifs personnels</h2>
                    <p className="muted">
                      Ces objectifs sont enregistrés dans ton espace.
                    </p>
                    {goalList}
                    <form className="goal-form" onSubmit={addGoal}>
                      <label className="field">
                        Un prochain petit pas
                        <input
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                          placeholder="Lire dix minutes, découvrir le japonais…"
                          maxLength={120}
                          required
                        />
                      </label>
                      <button className="primary" disabled={busy}>
                        <Plus size={18} />
                        Ajouter
                      </button>
                    </form>
                  </section>
                  <section className="panel">
                    <span className="pill">Données simulées</span>
                    <h2>Un aperçu du chemin</h2>
                    <div className="big-stat">
                      {dashboard?.minutes}
                      <small> minutes d’activité</small>
                    </div>
                    <p>3 découvertes dans cet exemple de semaine.</p>
                    <p className="muted">
                      Aucun niveau de maîtrise n’est encore calculé. Les
                      tentatives et vérifications différées alimenteront bientôt
                      cette vue.
                    </p>
                  </section>
                </div>
              </>
            )}
            {section === "famille" && household && (
              <FamilyOffice
                hid={household.id}
                role={household.role}
                onProfileSaved={async () => {
                  await loadSession();
                  setAccounts(await api<Account[]>("/demo/accounts"));
                }}
              />
            )}
            {section === "reglages" && (
              <>
                <PageTitle
                  eyebrow="UNE SUZANNE QUI TE RESSEMBLE"
                  title="Mes préférences."
                  text="Quelques détails pour te sentir bien dans ton espace."
                />
                <form
                  className="panel settings-panel"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(async () => {
                      await api("/me/profile", {
                        method: "PATCH",
                        body: JSON.stringify({ nickname, large_text: large }),
                      });
                      await loadSession();
                      setNotice("Tes préférences ont été enregistrées.");
                    });
                  }}
                >
                  <h2>À ta façon</h2>
                  <p>
                    <a href="#famille">
                      Gérer mon profil, mes documents et mes parties
                    </a>
                  </p>
                  <label className="field">
                    Comment veux-tu appeler Suzanne ?
                    <input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      minLength={1}
                      maxLength={30}
                      required
                    />
                  </label>
                  <label className="toggle-row">
                    <span>
                      <strong>Un texte plus grand</strong>
                      <small>Pour un meilleur confort de lecture.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={large}
                      onChange={(e) => setLarge(e.target.checked)}
                    />
                  </label>
                  <div className="profile-info">
                    <span>Ton profil</span>
                    <strong>
                      {me.profile.name} · {me.profile.age} ans
                    </strong>
                    <span>Centres d’intérêt</span>
                    <strong>{me.profile.interest}</strong>
                  </div>
                  <button className="primary" disabled={busy}>
                    Enregistrer mes préférences
                    <Check size={17} />
                  </button>
                  <p className="fine">
                    Aucun micro ni caméra activé. Les préférences sont propres à
                    ce compte.
                  </p>
                </form>
              </>
            )}
            {section === "suzanne" && (
              <>
                <PageTitle
                  eyebrow="COMPRENDRE ENSEMBLE"
                  title={`Un moment avec ${me.profile.nickname}.`}
                  text="Une question est souvent le début d’une belle découverte."
                />
                <section className="panel introduction tutor-introduction">
                  <div className="introduction-companion">
                    <SuzannePortrait />
                  </div>
                  <div>
                    <h2>On découvre ensemble ?</h2>
                    <p>
                      Je suis Suzanne, ton IA pédagogique. Une question, un
                      indice, une autre façon de comprendre : à toi de choisir.
                    </p>
                    <button
                      className="primary"
                      onClick={() =>
                        openLesson("Pourquoi la Lune change-t-elle de forme ?")
                      }
                    >
                      Essayer une découverte guidée
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </section>
                {household && (
                  <Tutor
                    key={`${household.id}-${me.profile.id}`}
                    hid={household.id}
                  />
                )}
              </>
            )}
            {section === "apprendre" && (
              <>
                <PageTitle
                  eyebrow={
                    isChild
                      ? "COMPRENDRE, PAS À PAS"
                      : "IL N’EST JAMAIS TROP TARD"
                  }
                  title={
                    isChild ? "On apprend ensemble." : "Apprendre à mon rythme."
                  }
                  text={
                    isChild
                      ? "Un indice, une autre explication, puis à toi d’essayer."
                      : "Des langues, des sciences, un projet qui te tient à cœur."
                  }
                />
                <div className="two-columns">
                  <section className="panel">
                    <span className="icon-tile peach">
                      <GraduationCap />
                    </span>
                    <h2>
                      {isChild
                        ? `Mon parcours · ${me.profile.level}`
                        : "Mes envies d’apprendre"}
                    </h2>
                    <p>{me.profile.interest}</p>
                    <p className="muted">
                      Le tutorat, les documents et les exercices adaptés
                      arrivent dans une prochaine version.
                    </p>
                    <a className="primary" href="#progression">
                      Définir mon premier objectif
                      <ArrowRight size={18} />
                    </a>
                  </section>
                  <section className="panel">
                    <span className="icon-tile sage">
                      <Compass />
                    </span>
                    <h2>Commencer par une question</h2>
                    <p>
                      Un exemple de fiche, une explication, une
                      mini-vérification.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => openLesson("Le voyage de l’eau")}
                    >
                      Où va l’eau après la pluie ?<ArrowRight size={18} />
                    </button>
                  </section>
                </div>
              </>
            )}
            {section === "actualites" && (
              <>
                <PageTitle
                  eyebrow="COMPRENDRE LE MONDE"
                  title="Le monde aujourd’hui."
                  text="Des faits, du contexte et des sources. À hauteur de regard."
                />
                <Empty
                  icon={<Globe2 size={38} />}
                  title="L’actualité se prépare avec soin."
                  text="Aucun flux d’actualité n’est connecté. Les articles seront datés, sourcés, recoupés et adaptés à l’âge avant d’apparaître ici."
                />
                <a className="text-button" href="#decouvertes">
                  En attendant, explorer une découverte
                  <ArrowRight size={17} />
                </a>
              </>
            )}
            {section === "lectures" && (
              <>
                <PageTitle
                  eyebrow="UNE PAGE, UN NOUVEL HORIZON"
                  title="Mes lectures."
                  text="Lire pour rêver, comprendre, et parfois changer de regard."
                />
                <div className="reading-layout">
                  <Landscape variant="words" />
                  <Empty
                    icon={<BookOpen size={36} />}
                    title="Chaque livre ouvre un nouveau monde."
                    text="Ajoute tes livres et tes impressions dans ton carnet. L’import de fichiers et les échanges avec Suzanne autour de tes lectures arrivent ensuite."
                  />
                </div>
                <a className="primary" href="#carnet">
                  Ajouter un livre
                  <ArrowRight size={17} />
                </a>
              </>
            )}
            {section === "studio" && (
              <>
                <PageTitle
                  eyebrow="APPRENDRE AUTREMENT"
                  title="Le studio de Suzanne."
                  text="Fermer les yeux. Tendre l’oreille. Ouvrir ses horizons."
                />
                <div className="studio-preview">
                  <Headphones size={60} />
                  <div className="soundwave" aria-hidden="true">
                    {[20, 40, 28, 68, 90, 44, 70, 35, 85, 56, 26, 44, 20].map(
                      (h, i) => (
                        <span key={i} style={{ height: h }} />
                      ),
                    )}
                  </div>
                  <h2>De belles idées à écouter.</h2>
                  <p>
                    Podcasts, langues à l’oral et petites capsules vidéo.
                    <br />
                    Le studio se prépare, avec transcriptions et sources.
                  </p>
                  <span className="pill">
                    Aucun média généré dans cette version
                  </span>
                </div>
              </>
            )}
            <footer className="footer">
              <span>
                <Flower />
                Un peu plus curieux qu’hier.
              </span>
              <span>
                Suzanne · Prototype local{me.demo ? " · Données fictives" : ""}
              </span>
            </footer>
          </main>
        </div>
        {lesson && (
          <Lesson
            title={lesson}
            answer={answer}
            setAnswer={setAnswer}
            close={() => setLesson(null)}
          />
        )}
      </div>
    </LookProvider>
  );
}

function PageTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
function Empty({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="empty-state">
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
      <span className="fine">
        Cet espace sera disponible dans une prochaine version.
      </span>
    </section>
  );
}
function Lesson({
  title,
  answer,
  setAnswer,
  close,
}: {
  title: string;
  answer: number | null;
  setAnswer: (n: number) => void;
  close: () => void;
}) {
  const moon = title.includes("Lune");
  useEffect(() => {
    const dialog = document.getElementById(
      "lesson-dialog",
    ) as HTMLDialogElement;
    const focus = document.activeElement as HTMLElement;
    dialog.showModal();
    return () => {
      dialog.close();
      focus?.focus();
    };
  }, []);
  return (
    <dialog
      id="lesson-dialog"
      className="lesson-dialog"
      onCancel={close}
      aria-labelledby="lesson-title"
    >
      <button
        className="close-button"
        onClick={close}
        aria-label="Fermer la découverte"
      >
        <X />
      </button>
      <Landscape variant={moon ? "sky" : "earth"} />
      <div className="lesson-body">
        <span className="eyebrow">DÉCOUVERTE GUIDÉE · EXEMPLE ÉDITORIAL</span>
        <h2 id="lesson-title">{title}</h2>
        <p>
          {moon
            ? "La Lune ne produit pas sa propre lumière : elle réfléchit celle du Soleil. La moitié de sa surface est toujours éclairée, mais depuis la Terre, nous n’en voyons pas toujours la même portion. C’est ce qui crée les phases de la Lune."
            : "Sous l’effet de la chaleur du Soleil, l’eau s’évapore. En se refroidissant, la vapeur d’eau se condense en petites gouttes qui forment les nuages. L’eau retombe ensuite en pluie ou en neige, rejoint les sols, les rivières et l’océan. Le voyage recommence."}
        </p>
        <a
          className="source"
          href={
            moon
              ? "https://science.nasa.gov/moon/moon-phases/"
              : "https://www.usgs.gov/special-topics/water-science-school/science/water-cycle"
          }
          target="_blank"
          rel="noreferrer"
        >
          Pour approfondir :{" "}
          {moon ? "NASA · Les phases de la Lune" : "USGS · Le cycle de l’eau"}
          <ArrowUpRight size={14} />
        </a>
        <h3>Une petite question pour vérifier</h3>
        <p>
          {moon
            ? "D’où vient la lumière que nous voyons sur la Lune ?"
            : "Comment appelle-t-on le passage de l’eau liquide à la vapeur ?"}
        </p>
        <div className="answers">
          {(moon
            ? ["De la Lune elle-même", "Du Soleil", "Des étoiles lointaines"]
            : ["La congélation", "L’évaporation", "La condensation"]
          ).map((label, i) => (
            <button
              key={label}
              aria-pressed={answer === i}
              className={answer === i ? "chosen" : ""}
              onClick={() => setAnswer(i)}
            >
              {label}
              {answer === i && <Check size={16} />}
            </button>
          ))}
        </div>
        {answer !== null && (
          <p role="status" className="feedback">
            {answer === 1
              ? "Exactement ! Tu as identifié le mécanisme. Essaie maintenant de l’expliquer avec tes propres mots."
              : moon
                ? "Un indice : comme un miroir, la Lune renvoie une lumière qu’elle reçoit. Relis la première phrase et réessaie."
                : "Un indice : pense à l’eau qui disparaît peu à peu d’une flaque au soleil. Tu peux réessayer."}
          </p>
        )}
        <p className="fine">
          Essai non enregistré. Il ne constitue pas une mesure de maîtrise.
        </p>
      </div>
    </dialog>
  );
}
