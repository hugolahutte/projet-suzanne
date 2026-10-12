"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import { BookOpen, Plus, Trash2, Video } from "lucide-react";
type Entry = {
  id: string;
  kind: "book" | "grade" | "homework";
  title: string;
  subject: string;
  details: string;
};
const kinds = { book: "Livre", grade: "Note", homework: "Devoir rendu" };
export function Notebook({ hid }: { hid: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [kind, setKind] = useState<Entry["kind"]>("book");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const path = `/households/${hid}/notebook`;
  useEffect(() => {
    let current = true;
    api<Entry[]>(path)
      .then((data) => {
        if (current) setEntries(data);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [path]);
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const entry = await api<Entry>(path, {
        method: "POST",
        body: JSON.stringify({ kind, title, subject, details }),
      });
      setEntries([entry, ...entries]);
      setTitle("");
      setSubject("");
      setDetails("");
      setNotice("Ta fiche est enregistrée dans ton espace personnel.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`${path}/${id}`, { method: "DELETE" });
      setEntries(entries.filter((e) => e.id !== id));
      setNotice("La fiche a été supprimée.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="notebook">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CE QUI NOURRIT TON APPRENTISSAGE</span>
          <h1>Mon carnet.</h1>
          <p>Mes livres, mes notes et ce que je retiens de mes devoirs.</p>
        </div>
      </div>
      <div className="info-strip">
        Démonstration : utilise des données fictives. Tu peux enregistrer une
        fiche manuellement. La connexion aux notes scolaires, le scan des copies
        et l’import de livres ne sont pas encore disponibles.
      </div>
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
      <form className="panel" onSubmit={save}>
        <h2>
          <BookOpen size={22} /> Ajouter à mon carnet
        </h2>
        <label>
          Type de fiche
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Entry["kind"])}
          >
            {Object.entries(kinds).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Titre
          <input
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Matière ou auteur
          <input
            maxLength={60}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label>
          Mes notes et observations
          <textarea
            rows={4}
            maxLength={2000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              kind === "grade"
                ? "Exemple fictif : 14/20. Revoir les fractions."
                : "Ce que j’ai appris, aimé ou envie de revoir…"
            }
          />
        </label>
        <button className="primary" disabled={busy}>
          <Plus size={17} /> Enregistrer la fiche
        </button>
      </form>
      <div className="notebook-items">
        {entries.map((entry) => (
          <article className="notebook-item" key={entry.id}>
            <span className="eyebrow">{kinds[entry.kind]}</span>
            <h2>{entry.title}</h2>
            <p>{entry.subject}</p>
            <p>{entry.details}</p>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void remove(entry.id)}
              aria-label={`Supprimer ${entry.title}`}
            >
              <Trash2 size={15} /> Supprimer
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
type Live = {
  live_allowed: boolean;
  can_manage: boolean;
  available: boolean;
  reason: string;
};
export function LiveSettings({ hid }: { hid: string }) {
  const [data, setData] = useState<Live | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const path = `/households/${hid}/live-settings`;
  useEffect(() => {
    let current = true;
    api<Live>(path)
      .then((d) => {
        if (current) setData(d);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [path]);
  async function change(allowed: boolean) {
    if (!data || busy) return;
    const previous = data;
    setData({ ...data, live_allowed: allowed });
    setBusy(true);
    setError("");
    try {
      setData(
        await api<Live>(path, {
          method: "PATCH",
          body: JSON.stringify({ live_allowed: allowed }),
        }),
      );
    } catch (e) {
      setData(previous);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel live-settings">
      <Video size={24} />
      <h2>Suzanne en vidéo</h2>
      <p>
        Une future conversation avec Suzanne animée, autorisée par un
        responsable du foyer et proposée uniquement sur une bonne connexion
        Wi-Fi.
      </p>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <label>
            <input
              type="checkbox"
              checked={data.live_allowed}
              disabled={busy || !data.can_manage}
              onChange={(e) => void change(e.target.checked)}
            />{" "}
            Autoriser le futur mode vidéo dans ce foyer
          </label>
          <p className="fine">
            {busy ? "Enregistrement…" : "Préférence enregistrée dans ce foyer."}{" "}
            Aucun appel ni aucune dépense ne sont déclenchés.
          </p>
          <div className="info-strip">{data.reason}</div>
        </>
      )}
    </section>
  );
}
