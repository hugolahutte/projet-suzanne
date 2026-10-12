# Validation — 12 octobre 2026

## Contrôles exécutés localement

- API : **21 tests réussis**, y compris accès anonyme, credentials erronés, isolation bidirectionnelle des foyers, enfant/adulte sans supervision, lien parental retiré, objectif d'un autre principal, sur-affectation de profil/rôle, rotation/révocation/expiration de session, CSRF, limite de débit, validation des tailles et no-store.
- Migrations : création depuis une base vide, downgrade complet puis upgrade exécutés par la suite API sur SQLite.
- TypeScript : typecheck réussi.
- ESLint : réussi (TypeScript et règles des hooks).
- Next.js : build de production réussi, pages et manifeste générés sans réseau externe.
- Dépendances : `npm audit` sans vulnérabilité signalée et `pip-audit` sans vulnérabilité connue à la date du contrôle. L'ancien plugin de lint Next a été remplacé après constat d'une dépendance transitive `braces` concernée par un avis. Aucun downgrade de Next réalisé.
- Playwright : **12 tests réussis**, parcours dans Chrome local, ordinateur/téléphone/tablette émulés. Contrôle axe de l'accueil enfant ; erreurs de contraste identifiées et corrigées, contrôle repassé sur les trois tailles.
- PWA : manifeste, icônes PNG, enregistrement service worker et page de secours hors connexion testés ; cache public limité à `/offline.html`.
- Inspection visuelle : captures ordinateur et mobile examinées ; navigation responsive, fiche et retours d'erreur guidés vérifiés.

## CI configurée

Trois jobs : API SQLite + PostgreSQL et audit Python ; typecheck/lint/build/audit npm + parcours Chromium ; démarrage Docker Compose et smoke test sur PostgreSQL avec accès croisé refusé. Le résultat distant est indépendant des résultats locaux ci-dessus : consulter le statut du commit/PR pour sa confirmation.

## Limites explicites

Docker/PostgreSQL ne sont pas installés sur la machine locale ; ne pas annoncer une exécution locale de Compose. Aucun iPhone/iPad physique, Safari ou VoiceOver testé. Aucun audit de sécurité complet, certification WCAG/RGAA ou validation juridique. L'app n'est pas ouverte à de vrais utilisateurs. Pas de donnée réelle, hébergement public, API payante ni génération de médias.
