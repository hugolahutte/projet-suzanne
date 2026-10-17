"use client";
import { useState } from "react";
import { ExternalLink, BookOpen } from "lucide-react";
import catalog from "../../../packages/curriculum/catalog.json";
const levels = ["CM2", "6e", "5e", "4e", "3e", "2de", "1re", "Tle"];
export function Curriculum({ initialLevel }: { initialLevel: string }) {
  const [level, setLevel] = useState(
    levels.includes(initialLevel) ? initialLevel : "CM2",
  );
  const [subject, setSubject] = useState("");
  const [track, setTrack] = useState("");
  const [future, setFuture] = useState(false);
  const at = `${catalog.schoolYear.slice(0, 4)}-09-01`;
  const entries = catalog.entries.filter(
    (e) =>
      e.levels.includes(level) &&
      (future ||
        ((!e.effectiveFrom || e.effectiveFrom <= at) &&
          (!e.effectiveTo || e.effectiveTo >= at))),
  );
  const subjects = [...new Set(entries.map((e) => e.subject))];
  const tracks = [...new Set(entries.map((e) => e.track))];
  const visible = entries.filter(
    (e) => (!subject || e.subject === subject) && (!track || e.track === track),
  );
  return (
    <div className="curriculum-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LES SOURCES DE TON PARCOURS</span>
          <h1>Cours et programmes.</h1>
          <p>
            Les références officielles, du CM2 au lycée général et
            technologique.
          </p>
        </div>
      </div>
      <section className="panel curriculum-filters">
        <label>
          Classe
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setSubject("");
              setTrack("");
            }}
          >
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Matière
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Toutes les matières</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
        {tracks.length > 1 && (
          <label>
            Voie ou enseignement
            <select
              aria-label="Voie ou enseignement"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
            >
              <option value="">Tous les enseignements</option>
              {tracks.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="check-line">
          <input
            type="checkbox"
            checked={future}
            onChange={(e) => setFuture(e.target.checked)}
          />{" "}
          Voir aussi les autres années
        </label>
      </section>
      <div className="info-strip">
        Rentrée {catalog.schoolYear} · Sources vérifiées le 12 octobre 2026. Les
        changements de programme sont appliqués classe par classe. Au lycée,
        certaines matières renvoient encore à un index officiel : leurs contenus
        ne sont pas encore structurés dans Suzanne.
      </div>
      <p>
        {visible.length} référence{visible.length > 1 ? "s" : ""} · Anglais,
        latin et grec inclus lorsqu’ils sont proposés à ce niveau.
      </p>
      <div className="curriculum-list">
        {visible.map((e) => (
          <article className="panel" key={e.id}>
            <span className="eyebrow">
              {e.track} ·{" "}
              {e.sourceKind === "index"
                ? "INDEX OFFICIEL"
                : "PROGRAMME OFFICIEL"}
            </span>
            <h2>
              <BookOpen size={19} /> {e.title}
            </h2>
            <p>
              {e.effectiveFrom
                ? `À partir de la rentrée ${e.effectiveFrom.slice(0, 4)}`
                : "Dates à vérifier dans la source"}
              {e.effectiveTo ? ` · jusqu’à ${e.effectiveTo}` : ""}
            </p>
            {e.notes && <p className="muted">{e.notes}</p>}
            <div className="source-links">
              <a href={e.sourceUrl} target="_blank" rel="noreferrer">
                Source officielle <ExternalLink size={14} />
              </a>
              {"documentUrl" in e && e.documentUrl && (
                <a href={e.documentUrl} target="_blank" rel="noreferrer">
                  Lire le programme <ExternalLink size={14} />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <p>Aucune référence pour ce filtre. Choisis une autre matière.</p>
      )}
    </div>
  );
}
