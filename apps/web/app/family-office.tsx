"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import { QuestionManager } from "./questions";
import { LiveSettings } from "./notebook";
import { AIControls } from "./tutor";
import {
  Users,
  Files,
  Wallet,
  History,
  Download,
  ArchiveRestore,
  Trash2,
  Save,
} from "lucide-react";

type Member = {
  id: string;
  name: string;
  age: number;
  role: string;
  level: string;
  interest: string;
  school: string;
  school_year: string;
  languages: string;
  options: string;
  learning_notes: string;
};
type Doc = {
  id: string;
  user_id: string;
  title: string;
  kind: string;
  subject: string;
  school_year: string;
  filename: string;
  size: number;
  deleted: boolean;
  created_at: number;
};
type Budget = {
  monthly_cap_cents: number;
  video_cap_cents: number;
  spent_cents: number;
};
type Game = {
  id: string;
  user_id: string;
  kind: string;
  players: { name: string; score: number }[];
  created_at: number;
};
const kinds: Record<string, string> = {
  report: "Bulletin",
  homework: "Devoir corrigé",
  book: "Livre",
  other: "Autre document",
};
const money = (c: number) =>
  (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function FamilyOffice({
  hid,
  role,
  onProfileSaved,
}: {
  hid: string;
  role: string;
  onProfileSaved: () => Promise<void>;
}) {
  const [tab, setTab] = useState("profiles");
  return (
    <div className="family-office">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CHACUN SON PARCOURS</div>
          <h1>L’espace famille.</h1>
          <p>
            Les profils, les documents et les réglages, réunis au même endroit.
          </p>
        </div>
        <span className="family-local">Conservé sur cet ordinateur</span>
      </div>
      <nav className="family-tabs" aria-label="Gestion du foyer">
        {[
          ["profiles", "Profils", Users],
          ["documents", "Documents", Files],
          ...(role === "guardian"
            ? [
                ["budget", "Budget & vidéo", Wallet],
                ["questions", "Questions du quiz", Files],
              ]
            : []),
          ["history", "Parties enregistrées", History],
        ].map(([id, label, Icon]) => {
          const Glyph = Icon as typeof Users;
          return (
            <button
              key={String(id)}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(String(id))}
            >
              <Glyph size={18} />
              {String(label)}
            </button>
          );
        })}
      </nav>
      {tab === "profiles" && (
        <ProfileManager
          hid={hid}
          canEdit={role !== "child"}
          onSaved={onProfileSaved}
        />
      )}
      {tab === "documents" && <DocumentLibrary hid={hid} />}
      {tab === "budget" && role === "guardian" && <BudgetManager hid={hid} />}
      {tab === "questions" && role === "guardian" && (
        <QuestionManager hid={hid} />
      )}
      {tab === "history" && <GameHistory hid={hid} />}
    </div>
  );
}
function ProfileManager({
  hid,
  canEdit,
  onSaved,
}: {
  hid: string;
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [draft, setDraft] = useState<Member | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api<Member[]>(`/households/${hid}/members`)
      .then((rows) => {
        if (active) {
          setMembers(rows);
          setDraft(rows[0] ?? null);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [hid]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const {
        id,
        name,
        age,
        level,
        interest,
        school,
        school_year,
        languages,
        options,
        learning_notes,
      } = draft;
      const result = await api<Member>(`/households/${hid}/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          age,
          level,
          interest,
          school,
          school_year,
          languages,
          options,
          learning_notes,
        }),
      });
      setMembers((rows) => rows.map((m) => (m.id === id ? result : m)));
      setDraft(result);
      await onSaved();
      setNotice(`Le profil de ${result.name} est enregistré.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const field = (key: keyof Member, label: string, max = 200) => (
    <label>
      {label}
      <input
        value={String(draft?.[key] ?? "")}
        maxLength={max}
        disabled={!canEdit || busy}
        onChange={(e) =>
          setDraft(draft ? { ...draft, [key]: e.target.value } : null)
        }
      />
    </label>
  );
  return (
    <>
      <p className="fine">
        Tu gères ton profil et ceux des enfants dont tu es responsable. Chaque
        autre adulte conserve la gestion de son propre profil.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <div className="family-profile-layout">
        <div className="family-member-list" aria-label="Profils accessibles">
          {members.map((m) => (
            <button
              key={m.id}
              disabled={busy}
              aria-pressed={draft?.id === m.id}
              onClick={() => {
                setDraft(m);
                setNotice("");
                setError("");
              }}
            >
              <span className="avatar">{m.name.slice(0, 1)}</span>
              <span>
                <strong>{m.name}</strong>
                <small>
                  {m.age} ans · {m.level || "Parcours libre"}
                </small>
              </span>
            </button>
          ))}
        </div>
        {draft ? (
          <form className="panel family-form" onSubmit={save}>
            <div>
              <span className="eyebrow">PROFIL D’APPRENTISSAGE</span>
              <h2>{draft.name}</h2>
            </div>
            <fieldset disabled={!canEdit || busy}>
              <legend>Identité et scolarité</legend>
              <div className="family-fields">
                {field("name", "Prénom", 60)}
                <label>
                  Âge
                  <input
                    type="number"
                    min="5"
                    max="120"
                    required
                    value={draft.age}
                    onChange={(e) =>
                      setDraft({ ...draft, age: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Classe ou parcours
                  <select
                    value={draft.level}
                    onChange={(e) =>
                      setDraft({ ...draft, level: e.target.value })
                    }
                  >
                    {Array.from(
                      new Set([
                        draft.level,
                        "Parcours libre",
                        "CP",
                        "CE1",
                        "CE2",
                        "CM1",
                        "CM2",
                        "6e",
                        "5e",
                        "4e",
                        "3e",
                        "2de",
                        "1re",
                        "Tle",
                        "Études supérieures",
                      ]),
                    ).map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </label>
                {field("school_year", "Année scolaire", 20)}
                {field("school", "Établissement (facultatif)", 160)}
                {field("languages", "Langues étudiées")}
                {field("options", "Options et spécialités")}
                {field("interest", "Centres d’intérêt", 500)}
              </div>
              <label>
                Comment l’aider à apprendre ?
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={draft.learning_notes}
                  onChange={(e) =>
                    setDraft({ ...draft, learning_notes: e.target.value })
                  }
                  placeholder="Ses objectifs, les explications qui l’aident, les points à retravailler…"
                />
              </label>
            </fieldset>
            <p className="fine">
              Ces renseignements préparent la personnalisation. Ils ne sont pas
              encore utilisés par un tuteur IA.
            </p>
            {canEdit ? (
              <button className="primary" disabled={busy}>
                <Save size={17} />
                {busy ? "Enregistrement…" : "Enregistrer le profil"}
              </button>
            ) : (
              <p>Ton responsable peut modifier ces informations.</p>
            )}
          </form>
        ) : (
          !error && <p role="status">Chargement des profils…</p>
        )}
      </div>
    </>
  );
}
export function DocumentLibrary({ hid }: { hid: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [owner, setOwner] = useState("");
  const [filter, setFilter] = useState("");
  const [kind, setKind] = useState("report");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [trash, setTrash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fileKey, setFileKey] = useState(0);
  useEffect(() => {
    let active = true;
    api<Member[]>(`/households/${hid}/members`)
      .then((rows) => {
        if (active) {
          setMembers(rows);
          setOwner(rows[0]?.id ?? "");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [hid]);
  useEffect(() => {
    let active = true;
    setDocs([]);
    api<Doc[]>(`/households/${hid}/documents?trash=${trash}`)
      .then((rows) => {
        if (active) setDocs(rows);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [hid, trash]);
  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Choisis un fichier de 10 Mo maximum.");
      const query = new URLSearchParams({
        owner,
        title,
        kind,
        subject,
        school_year: year,
        filename: file.name,
      });
      await api(`/households/${hid}/documents?${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });
      setTitle("");
      setFile(null);
      setFileKey((k) => k + 1);
      setTrash(false);
      setDocs(await api<Doc[]>(`/households/${hid}/documents`));
      setNotice("Document importé et conservé dans ton espace privé.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(d: Doc) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/households/${hid}/documents/${d.id}`, {
        method: "PATCH",
        body: JSON.stringify({ deleted: !d.deleted }),
      });
      setDocs((rows) => rows.filter((r) => r.id !== d.id));
      setNotice(
        d.deleted
          ? "Document restauré."
          : "Document déplacé dans la corbeille. Tu peux le restaurer.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="family-documents">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <form className="panel family-form" onSubmit={upload}>
        <div>
          <span className="eyebrow">UNE PLACE POUR CHAQUE DOCUMENT</span>
          <h2>Ajouter un document</h2>
          <p>
            Bulletins, copies corrigées, extraits de livres : classe-les pour
            les retrouver.
          </p>
        </div>
        <fieldset disabled={busy}>
          <legend>Classement du fichier</legend>
          <div className="family-fields">
            <label>
              Pour qui ?
              <select
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type de document
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {Object.entries(kinds).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Titre du document
              <input
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Matière
              <input
                maxLength={60}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label>
              Année scolaire du document
              <input
                maxLength={20}
                placeholder="2025–2026"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </label>
            <label>
              Fichier PDF ou image
              <input
                key={fileKey}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                required
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
                }}
              />
            </label>
          </div>
        </fieldset>
        <p className="fine">
          PDF, PNG ou JPEG · 10 Mo par fichier · 100 Mo et 100 fichiers par
          foyer, corbeille comprise. L’analyse automatique et l’OCR ne sont pas
          encore connectés.
        </p>
        <button className="primary" disabled={busy || !owner}>
          {busy ? "Import en cours…" : "Importer le document"}
        </button>
      </form>
      <section className="panel">
        <div className="section-heading">
          <h2>{trash ? "Corbeille" : "Les documents"}</h2>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setTrash(!trash);
              setNotice("");
            }}
          >
            {trash ? "Voir les documents" : "Ouvrir la corbeille"}
          </button>
        </div>
        <label className="family-filter">
          Filtrer par profil
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tous les profils accessibles</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <div className="family-document-list">
          {docs
            .filter((d) => !filter || d.user_id === filter)
            .map((d) => (
              <article key={d.id}>
                <div>
                  <span className="eyebrow">
                    {kinds[d.kind]} ·{" "}
                    {members.find((m) => m.id === d.user_id)?.name}
                  </span>
                  <h3>{d.title}</h3>
                  <p>
                    {[
                      d.subject,
                      d.school_year,
                      `${Math.ceil(d.size / 1024)} Ko`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="family-document-actions">
                  {!trash && (
                    <a
                      className="pack-download"
                      href={`/api/households/${hid}/documents/${d.id}/file`}
                    >
                      <Download size={16} />
                      Télécharger
                    </a>
                  )}
                  <button
                    className="text-button"
                    disabled={busy}
                    aria-label={`${trash ? "Restaurer" : "Mettre à la corbeille"} ${d.title}`}
                    onClick={() => void toggle(d)}
                  >
                    {trash ? (
                      <ArchiveRestore size={18} />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </article>
            ))}
        </div>
        {!docs.some((d) => !filter || d.user_id === filter) && (
          <p className="family-empty">
            {trash
              ? "La corbeille est vide pour cette sélection."
              : "Aucun document pour cette sélection. Ajoute ton premier fichier ci-dessus."}
          </p>
        )}
      </section>
    </div>
  );
}
function BudgetManager({ hid }: { hid: string }) {
  const [value, setValue] = useState<Budget | null>(null);
  const [total, setTotal] = useState("0");
  const [video, setVideo] = useState("0");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api<Budget>(`/households/${hid}/budget`)
      .then((b) => {
        if (active) {
          setValue(b);
          setTotal(String(b.monthly_cap_cents / 100));
          setVideo(String(b.video_cap_cents / 100));
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [hid]);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const monthly_cap_cents = Math.round(Number(total) * 100),
        video_cap_cents = Math.round(Number(video) * 100);
      if (video_cap_cents > monthly_cap_cents)
        throw new Error(
          "Le budget vidéo fait partie du plafond total : il ne peut pas le dépasser.",
        );
      setValue(
        await api<Budget>(`/households/${hid}/budget`, {
          method: "PATCH",
          body: JSON.stringify({ monthly_cap_cents, video_cap_cents }),
        }),
      );
      setNotice(
        "Les plafonds sont enregistrés. L’autorisation du dialogue se règle séparément.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <div className="family-budget-summary">
        <div>
          <span>Budget provisionné ce mois-ci</span>
          <strong>{money(value?.spent_cents ?? 0)}</strong>
          <small>Estimation prudente, hors taxes et frais de paiement</small>
        </div>
        <div>
          <span>Plafond mensuel souhaité</span>
          <strong>{money(value?.monthly_cap_cents ?? 0)}</strong>
          <small>Pour tout le foyer</small>
        </div>
      </div>
      <form className="panel family-form" onSubmit={save}>
        <h2>Un budget sous ton contrôle</h2>
        <div className="family-fields">
          <label>
            Plafond total par mois (€)
            <input
              type="number"
              min="0"
              max="500"
              step="0.01"
              required
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </label>
          <label>
            Dont vidéo, au maximum (€)
            <input
              type="number"
              min="0"
              max="500"
              step="0.01"
              required
              value={video}
              onChange={(e) => setVideo(e.target.value)}
            />
          </label>
        </div>
        <p>
          0 € signifie aucun budget autorisé. La vidéo est incluse dans le
          total.
        </p>
        <p className="fine">
          Le texte réserve son budget avant chaque appel et se bloque au
          plafond. Les provisions sont conservées par prudence ; elles peuvent
          dépasser le coût réel facturé en dollars. Le sous-plafond vidéo attend
          son fournisseur.
        </p>
        <button className="primary" disabled={busy || !value}>
          Enregistrer les plafonds
        </button>
      </form>
      <AIControls hid={hid} />
      <LiveSettings hid={hid} />
    </>
  );
}
export function GameHistory({ hid }: { hid: string }) {
  const [rows, setRows] = useState<Game[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api<Game[]>(`/households/${hid}/games`)
      .then((r) => {
        if (active) setRows(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hid]);
  return (
    <section className="panel">
      <h2>Les parties enregistrées</h2>
      <p>
        Les résultats sauvegardés par toi ou les enfants que tu supervises. Ils
        ne mesurent pas la maîtrise du programme scolaire.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Chargement…</p>
      ) : !rows.length ? (
        <p className="family-empty">
          Après une partie, clique sur « Enregistrer le résultat » pour le
          retrouver ici.
        </p>
      ) : (
        <div className="family-document-list">
          {rows.map((r) => (
            <article key={r.id}>
              <div>
                <span className="eyebrow">
                  {new Date(r.created_at * 1000).toLocaleString("fr-FR")}
                </span>
                <h3>
                  {r.kind === "capitales"
                    ? "Le tour des capitales"
                    : r.kind === "quiz"
                      ? "Quiz du foyer"
                      : "Le petit bac"}
                </h3>
                <p>
                  {r.players
                    .map(
                      (p) =>
                        `${p.name} : ${p.score}${r.kind !== "bac" ? "/5" : " points"}`,
                    )
                    .join(" · ")}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
