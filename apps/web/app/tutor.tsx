"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, MessageCircle, ShieldCheck } from "lucide-react";
import { api } from "./api";

type Status = {
  provider_ready: boolean;
  enabled: boolean;
  available: boolean;
  reason: string;
  monthly_cap_cents: number;
  reserved_cents: number;
};
type Reply = { id: string; answer: string; status: Status };

export function AIControls({ hid }: { hid: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api<Status>(`/households/${hid}/ai`)
      .then((s) => {
        if (active) setStatus(s);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [hid]);
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      setStatus(
        await api<Status>(`/households/${hid}/ai`, {
          method: "PATCH",
          body: JSON.stringify({ enabled: !status?.enabled }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel family-form">
      <h2>Le dialogue avec Suzanne</h2>
      <p>
        Autorise les questions écrites du foyer dans la limite du budget
        mensuel. Chaque envoi déclenche un appel à OpenRouter.
      </p>
      <p className="fine">
        Seuls la question saisie et un groupe d’âge sont transmis. Les
        bulletins, livres et profils familiaux ne sont pas ajoutés
        automatiquement.
      </p>
      {status && (
        <p>
          {status.enabled
            ? "Autorisation du foyer activée."
            : "Autorisation du foyer désactivée."}{" "}
          {status.reason}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary"
        onClick={toggle}
        disabled={
          busy || !status || (!status.provider_ready && !status.enabled)
        }
      >
        {status?.enabled
          ? "Désactiver le dialogue IA"
          : "Autoriser le dialogue IA"}
      </button>
      <p className="fine">
        La vidéo reste indépendante. Aucun micro ni caméra n’est utilisé ici.
      </p>
    </section>
  );
}

export function Tutor({ hid }: { hid: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [text, setText] = useState("");
  const [exchange, setExchange] = useState<{
    question: string;
    answer: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<{ id: string; text: string } | null>(null);
  useEffect(() => {
    let active = true;
    api<Status>(`/households/${hid}/ai`)
      .then((s) => {
        if (active) setStatus(s);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [hid]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    setError("");
    // Retrying the same question after a lost response reuses its reservation.
    if (!pending.current || pending.current.text !== text.trim())
      pending.current = { id: crypto.randomUUID(), text: text.trim() };
    try {
      const result = await api<Reply>(`/households/${hid}/ai/questions`, {
        method: "POST",
        body: JSON.stringify(pending.current),
      });
      setExchange({ question: pending.current.text, answer: result.answer });
      setStatus(result.status);
      setText("");
      pending.current = null;
    } catch (e) {
      setError((e as Error).message);
      // Keep the composer retryable on a lost network response; the server is authoritative.
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel tutor-panel" aria-labelledby="tutor-heading">
      <div className="tutor-heading">
        <MessageCircle size={23} />
        <h2 id="tutor-heading">Qu’est-ce qui t’intrigue ?</h2>
      </div>
      <p>
        Un cours qui résiste, un mot nouveau, une idée à explorer. On prend le
        temps de comprendre.
      </p>
      <div className="tutor-suggestions">
        {[
          "Explique-moi les fractions avec une pizza.",
          "Pourquoi la Lune change-t-elle de forme ?",
          "Aide-moi à réviser le latin.",
        ].map((q) => (
          <button
            key={q}
            className="secondary"
            onClick={() => setText(q)}
            disabled={busy}
          >
            {q}
          </button>
        ))}
      </div>
      {status && !status.available && (
        <p className="info-strip" role="status">
          {status.reason} Tu peux déjà préparer ta question.
        </p>
      )}
      {exchange && (
        <div className="tutor-exchange" aria-live="polite">
          <p className="tutor-question">{exchange.question}</p>
          <div className="tutor-answer">
            <strong>Suzanne</strong>
            <p>{exchange.answer}</p>
          </div>
        </div>
      )}
      <form onSubmit={send}>
        <label htmlFor="tutor-question">Ta question à Suzanne</label>
        <textarea
          id="tutor-question"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={4000}
          required
          rows={4}
          placeholder="J’aimerais comprendre…"
          disabled={busy}
        />
        <div className="tutor-send">
          <span className="fine">{text.length} / 4 000</span>
          <button
            className="primary"
            disabled={busy || !status?.available || !text.trim()}
          >
            {busy ? "Suzanne réfléchit…" : "Envoyer ma question"}
            <ArrowUp size={18} />
          </button>
        </div>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="fine">
        <ShieldCheck size={15} /> Chaque question est indépendante dans cette
        première version. Seul le texte envoyé et un groupe d’âge sont transmis
        ; aucune pièce jointe. Suzanne peut se tromper : vérifie les points
        importants avec ton cours.
      </p>
    </section>
  );
}
