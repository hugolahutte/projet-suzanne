"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
export type FamilyQuestion = {
  id: string;
  prompt: string;
  answer: string;
  explanation: string;
  active: boolean;
};
const empty = { id: "", prompt: "", answer: "", explanation: "", active: true };
export function QuestionManager({ hid }: { hid: string }) {
  const [rows, setRows] = useState<FamilyQuestion[]>([]),
    [draft, setDraft] = useState(empty),
    [archived, setArchived] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api<FamilyQuestion[]>(`/households/${hid}/questions?archived=${archived}`)
      .then((r) => {
        if (active) setRows(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [hid, archived]);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { id, ...body } = draft;
      await api(`/households/${hid}/questions${id ? `/${id}` : ""}`, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setRows(
        await api<FamilyQuestion[]>(
          `/households/${hid}/questions?archived=${archived}`,
        ),
      );
      setDraft(empty);
      setNotice("Question enregistrée.");
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
      <form className="panel family-form" onSubmit={save}>
        <h2>{draft.id ? "Modifier la question" : "Créer une question"}</h2>
        <p>
          Les questions actives sont proposées dans le Quiz du foyer. Prévois
          cinq questions par joueur, soit vingt pour une partie à quatre.
        </p>
        <fieldset disabled={busy}>
          <legend>Question et correction</legend>
          <label>
            La question
            <textarea
              required
              minLength={3}
              maxLength={300}
              value={draft.prompt}
              onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
            />
          </label>
          <label>
            Réponse attendue
            <input
              required
              maxLength={80}
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
            />
          </label>
          <label>
            Explication après la réponse
            <textarea
              maxLength={1000}
              value={draft.explanation}
              onChange={(e) =>
                setDraft({ ...draft, explanation: e.target.value })
              }
            />
          </label>
          <label>
            Disponibilité
            <select
              value={draft.active ? "active" : "archive"}
              onChange={(e) =>
                setDraft({ ...draft, active: e.target.value === "active" })
              }
            >
              <option value="active">Active dans le quiz</option>
              <option value="archive">Archivée</option>
            </select>
          </label>
        </fieldset>
        <p className="fine">
          Une réponse courte et sans ambiguïté. Les accents et majuscules ne
          comptent pas ; les synonymes ne sont pas reconnus automatiquement. Les
          questions sont partagées avec les membres du foyer.
        </p>
        <div>
          <button className="primary" disabled={busy}>
            Enregistrer la question
          </button>
          {draft.id && (
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() => setDraft(empty)}
            >
              Annuler la modification
            </button>
          )}
        </div>
      </form>
      <section className="panel">
        <div className="section-heading">
          <h2>
            {archived ? "Questions archivées" : "Questions actives"} ·{" "}
            {rows.length}
          </h2>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setArchived(!archived)}
          >
            {archived ? "Voir les actives" : "Voir les archives"}
          </button>
        </div>
        {!rows.length && (
          <p className="family-empty">Aucune question dans cette sélection.</p>
        )}
        <div className="family-document-list">
          {rows.map((q) => (
            <article key={q.id}>
              <div>
                <h3>{q.prompt}</h3>
                <p>{q.answer}</p>
              </div>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setDraft(q);
                  setNotice("");
                }}
              >
                Modifier
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
