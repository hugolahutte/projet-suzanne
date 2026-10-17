"use client";
import { useEffect, useState } from "react";
import { api } from "./api";
import type { FamilyQuestion } from "./questions";
import { GameCompanion } from "./wardrobe";
import { Globe2, Pencil, ArrowRight, RotateCcw } from "lucide-react";

// Original compact question bank: one unambiguous national capital per country.
const capitals = [
  ["France", "Paris"],
  ["Italie", "Rome"],
  ["Espagne", "Madrid"],
  ["Portugal", "Lisbonne"],
  ["Allemagne", "Berlin"],
  ["Belgique", "Bruxelles"],
  ["Grèce", "Athènes"],
  ["Royaume-Uni", "Londres"],
  ["Irlande", "Dublin"],
  ["Norvège", "Oslo"],
  ["Suède", "Stockholm"],
  ["Finlande", "Helsinki"],
  ["Danemark", "Copenhague"],
  ["Pologne", "Varsovie"],
  ["Autriche", "Vienne"],
  ["Japon", "Tokyo"],
  ["Canada", "Ottawa"],
  ["Australie", "Canberra"],
  ["Maroc", "Rabat"],
  ["Sénégal", "Dakar"],
];
const categories = ["Prénom", "Pays", "Animal", "Objet"];
const normalize = (text: string) =>
  text
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
type Kind = "capitales" | "bac" | "quiz";
export function Games({ hid }: { hid: string }) {
  const [gameId, setGameId] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [questions, setQuestions] = useState<FamilyQuestion[]>([]);
  const [questionsError, setQuestionsError] = useState("");
  useEffect(() => {
    let active = true;
    api<FamilyQuestion[]>(`/households/${hid}/questions`)
      .then((q) => {
        if (active) setQuestions(q);
      })
      .catch((e) => {
        if (active) setQuestionsError(e.message);
      });
    return () => {
      active = false;
    };
  }, [hid]);
  const [kind, setKind] = useState<Kind>("capitales");
  const [players, setPlayers] = useState(1);
  const [names, setNames] = useState([
    "Joueur 1",
    "Joueur 2",
    "Joueur 3",
    "Joueur 4",
  ]);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [ready, setReady] = useState(false);
  const [deck, setDeck] = useState(capitals);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [letter, setLetter] = useState("A");
  const [words, setWords] = useState<string[][]>([]);
  const [draft, setDraft] = useState(["", "", "", ""]);
  const [valid, setValid] = useState<boolean[][]>([]);
  const finished = kind !== "bac" ? turn >= players * 5 : turn >= players;
  const player = turn % players;
  function start() {
    if (kind === "quiz" && questions.length < players * 5) return;
    setGameId(crypto.randomUUID());
    setSaved(false);
    setSaveError("");
    setTurn(0);
    setScores([0, 0, 0, 0]);
    setAnswer("");
    setFeedback(null);
    setWords([]);
    setValid([]);
    setDraft(["", "", "", ""]);
    setReady(false);
    setDeck(
      shuffle(
        kind === "quiz"
          ? questions.map((q) => [q.prompt, q.answer, q.explanation])
          : capitals,
      ),
    );
    setLetter(shuffle("ABCDEFGHLMPRSTV".split(""))[0]);
    setStarted(true);
  }
  function capitalAnswer() {
    const correct = normalize(answer) === normalize(deck[turn][1]);
    if (correct) setScores((s) => s.map((n, i) => (i === player ? n + 1 : n)));
    setFeedback(
      kind === "quiz"
        ? `${correct ? "Bien joué !" : "À retenir :"} ${deck[turn][1]}. ${deck[turn][2] || ""}`
        : `${correct ? "Bien joué !" : "Une capitale à retenir :"} ${deck[turn][1]} est la capitale du pays suivant : ${deck[turn][0]}.`,
    );
  }
  function saveWords() {
    setWords([...words, draft.map((s) => s.trim())]);
    // Semantic validity is explicitly decided together at the end, never guessed by AI.
    setValid([...valid, draft.map(() => false)]);
    setDraft(["", "", "", ""]);
    setTurn(turn + 1);
    setReady(false);
  }
  function wordScore(p: number, c: number) {
    const word = normalize(words[p]?.[c] || "");
    if (!word.startsWith(letter.toLowerCase()) || !valid[p]?.[c]) return 0;
    return words.some(
      (row, i) => i !== p && valid[i]?.[c] && normalize(row[c]) === word,
    )
      ? 5
      : 10;
  }
  return (
    <div className="games-view">
      <div className="page-heading games-heading">
        <GameCompanion />
        <div>
          <span className="eyebrow">LA CURIOSITÉ SE PARTAGE</span>
          <h1>À toi de jouer.</h1>
          <p>
            Tout seul, à deux, trois ou quatre. Une même tablette, des
            découvertes ensemble.
          </p>
        </div>
      </div>
      {!started ? (
        <>
          <div className="game-picker">
            <button
              className={`panel ${kind === "capitales" ? "selected" : ""}`}
              aria-pressed={kind === "capitales"}
              onClick={() => setKind("capitales")}
            >
              <Globe2 />
              <h2>Le tour des capitales</h2>
              <p>Cinq questions par personne. Un point par bonne réponse.</p>
            </button>
            <button
              className={`panel ${kind === "bac" ? "selected" : ""}`}
              aria-pressed={kind === "bac"}
              onClick={() => setKind("bac")}
            >
              <Pencil />
              <h2>Le petit bac</h2>
              <p>
                Une lettre, quatre catégories. À valider ensemble, sans
                chronomètre.
              </p>
            </button>
          </div>
          {questionsError && (
            <p role="alert" className="error">
              Le quiz du foyer est indisponible : {questionsError}
            </p>
          )}
          <button
            className="panel"
            aria-pressed={kind === "quiz"}
            onClick={() => setKind("quiz")}
          >
            <h2>Quiz du foyer</h2>
            <p>
              {questions.length} questions créées par les responsables du foyer.
            </p>
          </button>
          <form
            className="panel game-setup"
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
          >
            <label>
              Nombre de joueurs
              <select
                value={players}
                onChange={(e) => setPlayers(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? "Solo" : `${n} joueurs`}
                  </option>
                ))}
              </select>
            </label>
            <div className="players-inputs">
              {names.slice(0, players).map((name, i) => (
                <label key={i}>
                  Prénom du joueur {i + 1}
                  <input
                    value={name}
                    required
                    maxLength={24}
                    onChange={(e) =>
                      setNames(
                        names.map((n, j) => (j === i ? e.target.value : n)),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            {kind === "quiz" && questions.length < players * 5 && (
              <p role="status">
                Ajoute au moins {players * 5} questions actives dans l’espace
                famille pour jouer à {players}.
              </p>
            )}
            <button
              className="primary"
              disabled={kind === "quiz" && questions.length < players * 5}
            >
              Commencer la partie <ArrowRight size={18} />
            </button>
            <p className="fine">
              Les réponses restent dans cette partie. À la fin, tu peux
              enregistrer les prénoms et les scores dans ton historique. Passez
              l’appareil entre les tours.
            </p>
          </form>
          <div className="info-strip">
            D’autres jeux de questions et de bluff sont en préparation, avec des
            questions originales. Tu pourras proposer tes inspirations.
          </div>
        </>
      ) : (
        <section className="panel game-board">
          <div className="section-heading">
            <span className="eyebrow">
              {kind === "capitales"
                ? "LE TOUR DES CAPITALES"
                : kind === "quiz"
                  ? "QUIZ DU FOYER"
                  : `PETIT BAC · LETTRE ${letter}`}
            </span>
            <button className="text-button" onClick={() => setStarted(false)}>
              Quitter la partie
            </button>
          </div>
          {finished ? (
            <>
              <GameCompanion />
              <h2>
                {kind === "bac"
                  ? "À vous de vérifier !"
                  : "Bravo pour cette exploration !"}
              </h2>
              {kind === "bac" && (
                <>
                  <p>
                    Vérifiez chaque mot : bonne catégorie, bonne lettre et bonne
                    orthographe. Cochez les réponses acceptées ensemble. 10
                    points pour un mot unique, 5 s’il est partagé, 0 sinon.
                  </p>
                  <div className="bac-review">
                    {words.map((row, p) => (
                      <fieldset key={p}>
                        <legend>{names[p]}</legend>
                        {row.map((word, c) => {
                          const starts =
                            !!word &&
                            normalize(word).startsWith(letter.toLowerCase());
                          return (
                            <label key={c}>
                              <input
                                type="checkbox"
                                disabled={!starts || saved || saving}
                                checked={valid[p][c]}
                                onChange={(e) =>
                                  setValid(
                                    valid.map((r, i) =>
                                      r.map((v, j) =>
                                        i === p && j === c
                                          ? e.target.checked
                                          : v,
                                      ),
                                    ),
                                  )
                                }
                              />
                              <span>
                                {categories[c]} : <strong>{word || "—"}</strong>
                                {!starts && word
                                  ? " (lettre incorrecte)"
                                  : ""}{" "}
                                · {wordScore(p, c)} pts
                              </span>
                            </label>
                          );
                        })}
                      </fieldset>
                    ))}
                  </div>
                </>
              )}
              <div className="score-list" aria-live="polite">
                {names.slice(0, players).map((name, p) => (
                  <p key={p}>
                    <strong>{name}</strong>
                    <span>
                      {kind !== "bac"
                        ? scores[p]
                        : categories.reduce(
                            (sum, _, c) => sum + wordScore(p, c),
                            0,
                          )}{" "}
                      {kind !== "bac" ? "/ 5" : "points"}
                    </span>
                  </p>
                ))}
              </div>
              <p className="fine">
                Enregistre les prénoms et scores dans ton historique. Les
                réponses détaillées ne sont pas conservées.
              </p>
              {saveError && (
                <p role="alert" className="error">
                  {saveError}
                </p>
              )}
              {saved ? (
                <p role="status">
                  Résultat enregistré. <a href="#famille">Voir l’historique</a>
                </p>
              ) : (
                <button
                  className="secondary"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setSaveError("");
                    try {
                      await api(`/households/${hid}/games`, {
                        method: "POST",
                        body: JSON.stringify({
                          id: gameId,
                          kind,
                          players: names.slice(0, players).map((name, p) => ({
                            name,
                            score:
                              kind !== "bac"
                                ? scores[p]
                                : categories.reduce(
                                    (sum, _, c) => sum + wordScore(p, c),
                                    0,
                                  ),
                          })),
                        }),
                      });
                      setSaved(true);
                    } catch (e) {
                      setSaveError((e as Error).message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Enregistrement…" : "Enregistrer le résultat"}
                </button>
              )}
              <button className="primary" disabled={saving} onClick={start}>
                <RotateCcw size={16} /> Rejouer
              </button>
            </>
          ) : !ready ? (
            <>
              <span className="game-symbol">
                {kind !== "bac" ? "✳" : letter}
              </span>
              <h2>À toi, {names[player]}.</h2>
              <p>
                {kind !== "bac"
                  ? `Question ${Math.floor(turn / players) + 1} sur 5`
                  : "Trouve un mot par catégorie. Les autres réponses restent cachées jusqu’à la fin."}
              </p>
              <button className="primary" onClick={() => setReady(true)}>
                Je suis prêt <ArrowRight size={17} />
              </button>
            </>
          ) : kind !== "bac" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!feedback) capitalAnswer();
              }}
            >
              <p>
                {names[player]} · Question {Math.floor(turn / players) + 1} sur
                5
              </p>
              <h2>
                {kind === "capitales"
                  ? "Quelle est la capitale de ce pays ?"
                  : "La question du foyer"}
              </h2>
              <p className="country-name">{deck[turn][0]}</p>
              <label>
                Ta réponse
                <input
                  autoComplete="off"
                  value={answer}
                  maxLength={80}
                  disabled={feedback !== null}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </label>
              {!feedback ? (
                <button className="primary" type="submit">
                  Vérifier ma réponse
                </button>
              ) : (
                <>
                  <p role="status">{feedback}</p>
                  <button
                    className="primary"
                    type="button"
                    onClick={() => {
                      setTurn(turn + 1);
                      setReady(false);
                      setFeedback(null);
                      setAnswer("");
                    }}
                  >
                    Continuer <ArrowRight size={17} />
                  </button>
                </>
              )}
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveWords();
              }}
            >
              <h2>
                {names[player]}, la lettre est {letter}.
              </h2>
              <div className="players-inputs">
                {categories.map((cat, c) => (
                  <label key={cat}>
                    {cat}
                    <input
                      autoComplete="off"
                      maxLength={80}
                      value={draft[c]}
                      onChange={(e) =>
                        setDraft(
                          draft.map((v, j) => (j === c ? e.target.value : v)),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <button className="primary">Garder mes réponses</button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
