# Validation — 12 octobre 2026

## Contrôles exécutés localement

- API : **37 tests réussis**, y compris accès anonyme, credentials erronés, isolation bidirectionnelle des foyers, enfant/adulte sans supervision, lien parental retiré, objectif d'un autre principal, sur-affectation de profil/rôle, rotation/révocation/expiration de session, CSRF, limite de débit, validation des tailles et no-store.
- Migrations : création depuis une base vide, downgrade complet puis upgrade exécutés par la suite API sur SQLite.
- TypeScript : typecheck réussi.
- ESLint : réussi (TypeScript et règles des hooks).
- Next.js : build de production réussi, pages et manifeste générés sans réseau externe.
- Dépendances : `npm audit` sans vulnérabilité signalée et `pip-audit` sans vulnérabilité connue à la date du contrôle. L'ancien plugin de lint Next a été remplacé après constat d'une dépendance transitive `braces` concernée par un avis. Aucun downgrade de Next réalisé.
- Playwright : **21 parcours réussis** au total après correction (18 parcours réussis dans la première suite et 3 parcours carnet/vidéo/programme réussis lors de la reprise ciblée), parcours dans Chrome local, ordinateur/téléphone/tablette émulés. Contrôle axe de l'accueil enfant ; erreurs de contraste identifiées et corrigées, contrôle repassé sur les trois tailles.
- PWA : manifeste, icônes PNG, enregistrement service worker et page de secours hors connexion testés ; cache public limité à `/offline.html`.
- Inspection visuelle : captures ordinateur et mobile examinées ; navigation responsive, fiche et retours d'erreur guidés vérifiés.

## CI configurée

Trois jobs : API SQLite + PostgreSQL et audit Python ; typecheck/lint/build/audit npm + parcours Chromium ; démarrage Docker Compose et smoke test sur PostgreSQL avec accès croisé refusé. Le résultat distant est indépendant des résultats locaux ci-dessus : consulter le statut du commit/PR pour sa confirmation.

## Limites explicites

Docker/PostgreSQL ne sont pas installés sur la machine locale ; ne pas annoncer une exécution locale de Compose. Aucun iPhone/iPad physique, Safari ou VoiceOver testé. Aucun audit de sécurité complet, certification WCAG/RGAA ou validation juridique. L'app n'est pas ouverte à de vrais utilisateurs. Pas de donnée réelle, hébergement public ni appel IA payant. Portraits générés avec l’outil intégré ImageGen, provenance documentée.


## Extension apprentissage et jeux

37 tests API réussis : carnet privé, suppression, contrôles d’origine, sur-affectation refusée, permissions vidéo parent/adulte/enfant, contrats Jev/OpenRouter (limites d’entrée, classification incertaine, modèle autorisé, conditions de prix et confidentialité), en plus des 21 contrôles initiaux. Les contrats IA sont testés sans transport ni appel fournisseur.

Les parcours navigateur ajoutés couvrent cinq questions distinctes par joueur aux capitales, accents acceptés, petit bac à quatre avec réponses masquées et score partagé, persistance/suppression d’une fiche, persistance de l’autorisation vidéo sans disponibilité réelle et bascule du programme d’anglais de quatrième. Un problème d’état asynchrone de la case vidéo a été corrigé (affichage immédiat et restauration sur erreur serveur).

La nouvelle migration a été appliquée localement. Build, TypeScript et ESLint réussis après intégration de l’accueil et des nouveaux écrans. Le Dockerfile inclut désormais le catalogue consommé par le frontend. Aucun package ajouté à cette extension ; les audits antérieurs concernent le même verrouillage de dépendances.

Le contrôle Compose précédent était parfois lancé avant l’écoute HTTP du frontend (`Connection reset by peer`). Un healthcheck web via `/api/health` a été ajouté : `docker compose --wait` attend désormais le proxy Next et l’API, pas seulement le démarrage du conteneur. Validation distante sur la nouvelle révision requise.

Corpus final : **308 entrées**, dont 280 programmes/versions et 28 index ; **166 PDF** officiels (3 336 pages), SHA-256 contrôlés, fichiers ouverts et calendriers de transition validés, y compris lycée mathématiques, EPS et LSF. Voir les exclusions dans `curriculum/README.md`.
