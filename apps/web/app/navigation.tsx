"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Compass,
  Dices,
  GraduationCap,
  Headphones,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Shirt,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Globe2,
  NotebookPen,
} from "lucide-react";
import type { Me } from "./types";

export const destinations = [
  {
    id: "accueil",
    label: "Accueil",
    icon: Home,
    group: "À toi de jouer",
    description: "Ton rendez-vous du jour",
  },
  {
    id: "apprendre",
    label: "Apprendre",
    icon: GraduationCap,
    group: "À toi de jouer",
    description: "Tes parcours et tes envies",
  },
  {
    id: "jeux",
    label: "Jeux",
    icon: Dices,
    group: "À toi de jouer",
    description: "Capitales et petit bac, de 1 à 4 joueurs",
  },
  {
    id: "decouvertes",
    label: "Découvertes",
    icon: Compass,
    group: "À explorer",
    description: "Sciences, culture et nouvelles idées",
  },
  {
    id: "programmes",
    label: "Programmes",
    icon: BookOpen,
    group: "À explorer",
    description: "Les cours officiels, du CM2 au lycée",
  },
  {
    id: "carnet",
    label: "Carnet",
    icon: NotebookPen,
    group: "À explorer",
    description: "Livres, notes et devoirs",
  },
  {
    id: "progression",
    label: "Progression",
    icon: TrendingUp,
    group: "Ton univers",
    description: "Tes objectifs et tes petits pas",
  },
  {
    id: "vestiaire",
    label: "Vestiaire",
    icon: Shirt,
    group: "Ton univers",
    description: "Les tenues et le look de Suzanne",
  },
  {
    id: "suzanne",
    label: "Avec Suzanne",
    icon: Sparkles,
    group: "Ton univers",
    description: "Ton compagnon pédagogique",
  },
  {
    id: "famille",
    label: "Espace famille",
    icon: Users,
    group: "Ton compte",
    description: "Profils enfants et autorisations",
    guardian: true,
  },
  {
    id: "reglages",
    label: "Préférences",
    icon: Settings,
    group: "Ton compte",
    description: "Lisibilité et personnalisation",
  },
  {
    id: "actualites",
    label: "Actualités",
    icon: Globe2,
    group: "Bientôt",
    description: "Le monde aujourd’hui",
  },
  {
    id: "lectures",
    label: "Lectures",
    icon: BookOpen,
    group: "Bientôt",
    description: "La future bibliothèque",
  },
  {
    id: "studio",
    label: "Studio",
    icon: Headphones,
    group: "Bientôt",
    description: "Le futur espace audio et vidéo",
  },
];
export type Section = (typeof destinations)[number]["id"];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`club-brand ${compact ? "compact" : ""}`}
      href="#accueil"
      aria-label="Suzanne — accueil"
    >
      <Image
        src="/brand/suzanne-logo.png"
        alt="suzanne"
        width={240}
        height={96}
        unoptimized
      />
    </a>
  );
}

export function Navigation({
  me,
  section,
  busy,
  onLogout,
}: {
  me: Me;
  section: string;
  busy: boolean;
  onLogout: () => void;
}) {
  const [overlay, setOverlay] = useState<"menu" | "search" | null>(null);
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const accountMenu = useRef<HTMLDivElement>(null);
  const household = me.households[0];
  const allowed = destinations.filter(
    (d) => !d.guardian || household?.role === "guardian",
  );
  const current = destinations.find((d) => d.id === section);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setOverlay((value) => (value ? null : "search"));
      }
      if (event.key === "Escape") setAccountOpen(false);
    };
    const route = () => {
      setOverlay(null);
      setAccountOpen(false);
    };
    const outside = (event: PointerEvent) => {
      if (!accountMenu.current?.contains(event.target as Node))
        setAccountOpen(false);
    };
    window.addEventListener("keydown", keyboard);
    window.addEventListener("hashchange", route);
    window.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", keyboard);
      window.removeEventListener("hashchange", route);
      window.removeEventListener("pointerdown", outside);
    };
  }, []);
  useEffect(() => {
    if (!overlay) return;
    const previous = document.activeElement as HTMLElement;
    const modal = dialog.current;
    const overflow = document.body.style.overflow;
    modal?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      modal?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [overlay]);
  function open(value: "menu" | "search") {
    setQuery("");
    setAccountOpen(false);
    setOverlay(value);
  }
  function link(d: (typeof destinations)[number]) {
    return (
      <a
        key={d.id}
        href={`#${d.id}`}
        className={section === d.id ? "active" : ""}
        aria-current={section === d.id ? "page" : undefined}
        onClick={() => setOverlay(null)}
      >
        <d.icon size={19} />
        <span>{d.label}</span>
        {d.id === "vestiaire" && (
          <span className="nav-new" aria-hidden="true">
            5
          </span>
        )}
      </a>
    );
  }
  const groups = ["À toi de jouer", "À explorer", "Ton univers"];
  return (
    <>
      <aside className="club-sidebar">
        <Brand />
        <div className="workspace-label">
          <span className="workspace-dot" />
          {household?.name}
        </div>
        <nav aria-label="Navigation principale">
          {groups.map((group) => (
            <div className="nav-group" key={group}>
              <p>{group}</p>
              {allowed.filter((d) => d.group === group).map(link)}
            </div>
          ))}
        </nav>
        <div className="nav-bottom">
          <nav aria-label="Compte">
            {allowed.filter((d) => d.group === "Ton compte").map(link)}
          </nav>
          <span className="local-label">
            {me.demo
              ? "Espace de démonstration"
              : "Espace privé · sur cet appareil"}
          </span>
        </div>
      </aside>
      <header className="club-topbar">
        <button
          className="mobile-menu icon-button"
          aria-label="Ouvrir le menu"
          onClick={() => open("menu")}
        >
          <Menu size={22} />
        </button>
        <div className="club-breadcrumb">
          <span>Mon espace</span>
          <ChevronRight size={14} />
          <strong>{current?.label ?? "Accueil"}</strong>
        </div>
        <button
          aria-label="Rechercher un espace"
          className="search-trigger"
          onClick={() => open("search")}
        >
          <Search size={17} />
          <span>Aller à un espace…</span>
          <kbd>⌘ K</kbd>
        </button>
        <div className="account-control" ref={accountMenu}>
          <button
            aria-label={`Menu du profil ${me.profile.name}`}
            className="account-trigger"
            aria-expanded={accountOpen}
            aria-controls="account-panel"
            onClick={() => setAccountOpen(!accountOpen)}
          >
            <span className="avatar small color-0">{me.profile.name[0]}</span>
            <span>{me.profile.name}</span>
          </button>
          {accountOpen && (
            <div className="account-panel" id="account-panel">
              <strong>{me.profile.name}</strong>
              <p>{household?.name}</p>
              <a href="#reglages" onClick={() => setAccountOpen(false)}>
                <Settings size={17} />
                Préférences du profil
              </a>
              <button
                onClick={onLogout}
                disabled={busy}
                aria-label="Se déconnecter et changer de profil"
              >
                <LogOut size={17} />
                Changer de profil
              </button>
            </div>
          )}
        </div>
      </header>
      <nav className="mobile-dock" aria-label="Accès rapides">
        {allowed
          .filter((d) =>
            ["accueil", "apprendre", "jeux", "vestiaire"].includes(d.id),
          )
          .map(link)}
        <button onClick={() => open("menu")}>
          <Menu size={21} />
          <span>Menu</span>
        </button>
      </nav>
      {overlay && (
        <dialog
          className={`navigation-dialog ${overlay === "menu" ? "menu-dialog" : ""}`}
          ref={dialog}
          onCancel={() => setOverlay(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              const bounds = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom
              )
                setOverlay(null);
            }
          }}
          aria-labelledby="navigation-title"
        >
          <div className="dialog-heading">
            <h2 id="navigation-title">
              {overlay === "menu" ? "Tous les espaces" : "Où veux-tu aller ?"}
            </h2>
            <button
              className="icon-button"
              aria-label="Fermer le menu"
              onClick={() => setOverlay(null)}
            >
              <X size={22} />
            </button>
          </div>
          {overlay === "search" ? (
            <>
              <label className="space-search">
                <Search size={20} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Jeux, cours, tenues…"
                  aria-label="Rechercher un espace"
                />
              </label>
              <nav
                className="search-results"
                aria-label="Résultats de recherche"
              >
                {allowed
                  .filter((d) =>
                    `${d.label} ${d.description}`
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase()
                      .includes(
                        query
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .toLowerCase(),
                      ),
                  )
                  .map((d) => (
                    <a
                      href={`#${d.id}`}
                      key={d.id}
                      onClick={() => setOverlay(null)}
                    >
                      <d.icon size={21} />
                      <span>
                        <strong>{d.label}</strong>
                        <small>
                          {d.description}
                          {d.group === "Bientôt" ? " · En préparation" : ""}
                        </small>
                      </span>
                      <ChevronRight size={16} />
                    </a>
                  ))}
              </nav>
              <p className="search-empty">
                {!allowed.some((d) =>
                  `${d.label} ${d.description}`
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .includes(
                      query
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase(),
                    ),
                )
                  ? "Aucun espace trouvé. Essaie « jeux » ou « cours »."
                  : "Recherche dans les espaces de l’application."}
              </p>
            </>
          ) : (
            <nav className="full-menu" aria-label="Tous les espaces">
              {[...groups, "Ton compte", "Bientôt"].map((group) => (
                <div className="nav-group" key={group}>
                  <p>{group}</p>
                  {allowed.filter((d) => d.group === group).map(link)}
                </div>
              ))}
            </nav>
          )}
        </dialog>
      )}
    </>
  );
}
