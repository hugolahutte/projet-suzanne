# Suzanne

**La curiosité n’a pas d’âge.** Une plateforme d’apprentissage pour toute la vie, de 5 à 85 ans et au-delà.

Sprint 1 : application locale navigable, deux foyers imaginaires, comptes enfant/adulte/parent, sessions et permissions API, objectifs et préférences persistants, vues de progression explicitement simulées. Les fournisseurs IA sont désactivés par défaut ; le pilote texte peut être connecté localement avec autorisation et budget. Aucun déploiement public.

## Démarrage rapide sans Docker

Prérequis : Node.js 24, npm, Python 3.12. Depuis la racine du dépôt :

```bash
npm ci
python3.12 -m venv .venv
.venv/bin/pip install -r apps/api/requirements.txt
cp .env.example .env
./scripts/dev.sh
```

Ouvrir **http://localhost:3000**. Utiliser exactement cette origine (et non `127.0.0.1`) pour les contrôles CSRF. Le script applique les migrations, ajoute les fixtures manquantes sans réinitialiser les préférences et démarre les deux services. `Ctrl+C` arrête la session de développement. Aucun secret à fournir.

API interactive via **http://localhost:3000/api/docs** et schéma **http://localhost:3000/api/openapi.json**. Base SQLite locale `suzanne.db`, ignorée par Git. Aucun navigateur n'a besoin d'accéder directement au port 8000.

## Démarrage Docker / PostgreSQL

Avec Docker Engine/Desktop et Compose v2 :

```bash
docker compose up --build
```

Puis http://localhost:3000. PostgreSQL et l'API restent internes au réseau Compose ; seul le web est publié sur l'interface locale. Le mot de passe PostgreSQL est une valeur publique de démonstration, sans accès à un service réel. Arrêter : `docker compose down`. Le volume conserve les données ; `docker compose down -v` les efface **uniquement si tu souhaites réinitialiser la démonstration**.

Docker n'était pas disponible sur la machine de réalisation : l'exécution Compose est confiée à la CI, et ne doit pas être présentée comme validée localement. Consulter les résultats de la PR.

## Profils fictifs

Mot de passe commun prérempli : **`Suzanne-demo-2026!`**. Ces identifiants sont publics et réservés à la démonstration. Ils ne constituent pas un contrôle parental utilisable par une vraie famille.

| Foyer | Profils | Rôles |
|---|---|---|
| Atelier | Camille, 39 ans ; Gabriel, 41 ans ; Noé, 12 ans ; Lila, 7 ans | Camille responsable de Noé et Lila ; Gabriel adulte apprenant ; deux enfants |
| Horizon | Rose, 72 ans ; Sami, 10 ans ; Jeanne, 87 ans | Rose responsable de Sami ; Jeanne adulte apprenante ; un enfant |

Les emails suivent `<prénom sans accent>@example.test`. Le bouton de déconnexion en haut à droite retourne au choix de profils. Chaque connexion crée une identité propre ; aucun paramètre navigateur ne permet de transformer un enfant en parent.

## Ce que tu peux essayer

- Entrer dans les deux familles et comparer les interfaces enfants, adultes et seniors.
- Naviguer dans les univers et l'espace parent ; les fonctionnalités futures ont un état explicite.
- Modifier le surnom de Suzanne et agrandir le texte, puis recharger : les préférences persistent.
- Ajouter un objectif personnel et le marquer terminé : enregistré en base, privé au compte.
- Consulter les résumés des seuls enfants dont le parent est responsable.
- Ouvrir les deux fiches de découverte, répondre et recevoir un indice ou une explication. Les essais ne sont pas enregistrés ni convertis en score de maîtrise.
- Installer la PWA dans un navigateur compatible, ou voir la page de secours publique hors connexion. Pas de cache des pages personnelles.

Suzanne est un personnage fictif original proposé en trois styles : manga (par défaut), réaliste et SD/chibi. Le vestiaire comprend cinq tenues dans chaque style, un mode saisonnier et un pack graphique téléchargeable. Le choix est mémorisé par profil sur l’appareil et s’applique à l’accueil comme aux jeux. Voir `docs/NAVIGATION_ET_UNIVERS.md`.

## Accueil, jeux et ressources

- Accueil incarné avec lecture vocale à la demande, via la voix du navigateur, propositions d’apprentissage/découverte/cours/jeux. L’espace « Avec Suzanne » prépare les questions ; le transport OpenRouter reste désactivé tant que sa configuration et les autorisations manquent.
- Capitales : 1–4 joueurs sur le même appareil, cinq questions chacun, accents acceptés, scores calculés localement.
- Petit bac : 1–4 joueurs, réponses cachées entre les tours, vérification collective explicite, points pour mots uniques ou partagés. Une manche par partie ; aucune IA ne juge les réponses.
- Carnet privé : fiches livre, note, devoir, enregistrées en base et supprimables. La synchronisation scolaire, l’OCR des copies et l’import de livres restent à développer.
- Catalogue officiel CM2/collège/lycée général et technologique, anglais/latin/grec, filtres par classe/matière et dates d’application. [Couverture, corpus et provenance](docs/curriculum/README.md).
- Autorisation du futur mode vidéo par le responsable du foyer, enregistrée côté serveur. Le service vidéo reste indisponible même si elle est cochée.
- [Passerelle OpenRouter](docs/AI_ROUTING.md) : transport serveur, plafonds de tarifs, réservation mensuelle durable, déduplication, choix explicite du modèle/fournisseur, autorisation parentale. Testée avec réponses simulées et un essai local autorisé sur des questions fictives. Jev reste au stade du contrat.

## Back-office familial local

L’espace famille propose désormais cinq onglets : profils, documents, budget et vidéo, historique des parties, questions du quiz.

- Profils : prénom, âge, classe/parcours, établissement facultatif, année scolaire, langues, options, intérêts et indications pédagogiques. Chaque adulte gère son propre profil ; un responsable gère aussi ses enfants explicitement liés. Aucun adulte ne peut modifier un autre adulte. Les enfants lisent leur profil sans modifier l’identité ou la scolarité.
- Documents : import PDF, PNG et JPEG, classement par profil/type/matière/année, filtre, téléchargement authentifié, corbeille et restauration. Les fichiers restent dans la base privée, jamais dans `public/`. Limites locales : 10 Mo par fichier, 100 fichiers et 100 Mo par foyer, corbeille incluse. Les signatures de format sont vérifiées ; aucun OCR, antivirus ou extracteur pédagogique n’est revendiqué.
- Budget : plafond total et sous-plafond vidéo en euros, zéro par défaut. Le texte réserve une provision atomique avant chaque appel. Les provisions conservatrices sont affichées, les erreurs de coût suspendent le foyer. Ce compteur exclut taxes/frais de paiement et ne remplace pas un plafond du compte OpenRouter. Le fournisseur, le modèle et la clé se configurent localement après approbation des dépenses. Le bouton parental est distinct du budget. La vidéo reste déconnectée.
- Jeux : les scores peuvent être enregistrés volontairement à la fin, puis consultés par le joueur et ses responsables. Les réponses détaillées ne sont pas sauvegardées. Ce sont des résultats calculés par le client, sans certification de maîtrise scolaire ni classement compétitif.
- Quiz du foyer : les responsables créent, modifient et archivent leurs questions et explications originales. Les questions actives sont partagées au foyer. Cinq questions distinctes par joueur sont nécessaires (vingt pour quatre joueurs). Correction exacte normalisée, sans arbitrage IA des synonymes.

Les migrations préservent les profils et les données existantes. Les bulletins déjà archivés localement peuvent être rangés dans cette bibliothèque ; leur contenu n’est ni envoyé à un fournisseur ni analysé automatiquement. L’ajout de membres, les invitations, la gestion globale multi-foyers et la publication éditoriale restent hors de ce back-office familial.

## Scripts et vérification

```bash
# Corpus officiel : intégrité des sources et sélection par année
python3 packages/curriculum/validate_catalog.py

# API, isolation, autorisations, sessions et migrations SQLite
PYTHONPATH=apps/api .venv/bin/pytest apps/api/tests -q

# PostgreSQL dédié aux tests uniquement
TEST_DATABASE_URL=postgresql+psycopg://user:password@localhost/suzanne_test \
  PYTHONPATH=apps/api .venv/bin/pytest apps/api/tests -q

npm run lint
npm run typecheck
npm run build
npm audit --audit-level=high
.venv/bin/pip-audit -r apps/api/requirements.txt --no-deps --disable-pip

# Avec les deux serveurs déjà lancés : Chrome local requis
npm run test:e2e
```

Les tests navigateur couvrent ordinateur 1440 px, téléphone et tablette émulés dans Chromium. En CI, Chromium est installé par Playwright. Pour reproduire la configuration CI sans Chrome installé : `npx playwright install chromium`, puis `CI=1 npm run test:e2e`. Les tests partagent les comptes fictifs : un seul worker, et limitation des connexions à 20/minute par IP. Entre deux suites complètes immédiatement successives, attendre une minute ou redémarrer l'API locale.

Les tests API utilisent une base temporaire indépendante. Si `TEST_DATABASE_URL` est renseignée, cette base **doit être jetable** : le test de migration effectue un downgrade. Ne jamais pointer vers une base conservée.

Build de production local : arrêter le serveur de développement, exécuter `npm run build`, puis `npm start` avec l'API toujours démarrée. La PWA requiert HTTPS ou localhost. Sur iPhone/iPad réels, prévoir ultérieurement un HTTPS local et une origine explicitement configurée ; aucun déploiement n'est réalisé ici.

## Variables

Le script `dev.sh` charge le fichier `.env` local. Ne jamais y copier de données familiales. Compose définit ses propres valeurs ; le proxy Next utilise `API_URL` au build.

| Variable | Défaut local | Rôle |
|---|---|---|
| `APP_ENV` | `local` | seuls `local` et `test` sont autorisés à démarrer cette version |
| `APP_ORIGIN` | `http://localhost:3000` | origine exacte autorisée pour les mutations |
| `API_URL` | `http://127.0.0.1:8000` | destination interne du proxy Next, jamais un secret public |
| `DATABASE_URL` | `sqlite:///./suzanne.db` | SQLAlchemy SQLite ou PostgreSQL + psycopg |
| `COOKIE_SECURE` | `false` | mettre `true` dès qu'un HTTPS local est utilisé |
| `NEXT_TELEMETRY_DISABLED` | `1` | désactive la télémétrie Next dans les scripts fournis |
| `OPENROUTER_ENABLED` | `false` | interrupteur global du pilote texte |
| `OPENROUTER_API_KEY` | vide | secret serveur, jamais envoyé au navigateur |
| `OPENROUTER_MODEL`, `OPENROUTER_PROVIDER` | vides | sélection explicite, sans repli |
| `OPENROUTER_ACCOUNT_CAP_CONFIRMED` | `false` | attestation du plafond configuré chez OpenRouter |
| `OPENROUTER_ALLOW_LOCAL_CAP_ONLY` | `false` | essai explicitement autorisé en `APP_ENV=local`, avec le seul plafond interne ; aucun plafond fournisseur attesté |

## Organisation

- `apps/web` : Next.js, interface française responsive, styles, PWA et icônes originales.
- `apps/api` : FastAPI, SQLAlchemy, Alembic, données fictives, tests d'accès.
- `packages/contracts/openapi.json` : instantané du schéma de l'API ; types UI dans `apps/web/app/types.ts`.
- `compose.yaml`, Dockerfiles : environnement local PostgreSQL/API/web.
- `tests` : parcours Playwright et audit axe.
- `docs` : [audit OSS](docs/OSS_AUDIT.md), [ADR](docs/ADR-001.md), [modèle de données](docs/DATA_MODEL.md), [menaces et limites](docs/SECURITY.md), [design et roadmap](docs/ROADMAP.md), [validation](docs/VALIDATION.md).

## Limites avant des utilisateurs réels

Cette version ne propose pas encore inscription, récupération de mot de passe, invitations, MFA, RLS PostgreSQL, gestion des consentements, export/suppression par interface, OCR et analyse documentaire, conversations IA avec mémoire, révisions FSRS, actualités collectées, voix personnalisée ou vidéo. Pas de conformité réglementaire ou d'accessibilité exhaustive revendiquée. Les tests Chromium ne remplacent pas Safari/VoiceOver sur appareils réels.

Les comptes de démonstration sont volontairement connus. Le contrôle d'accès protège les requêtes selon l'identité authentifiée, mais ne rend pas les données de ces comptes publiques de test confidentielles. Ne saisir aucune donnée personnelle réelle. Le dépôt est public : son passage en privé et la revue de sécurité restent des prérequis avant de préparer de vrais profils.

Prochaine étape : Sprint 2, objet pédagogique indépendant du format, tutorat progressif, tentatives réelles et contrôles différés, derrière une passerelle IA avec budgets et évaluation. Aucun coût cloud engagé par ce Sprint.

## Profils privés pour un essai local

Un import ponctuel est disponible pour un essai supervisé sur la machine : `PYTHONPATH=apps/api .venv/bin/python -m suzanne.local_profiles .local/profiles.json`. Le fichier doit rester sous `.local/` (ignoré par Git). Il contient `name` (foyer) et `people` : `name`, `age`, `role` (`guardian`, `adult`, `child`), `level`, `interests`, `subjects` et, pour chaque enfant, `guardians` (prénoms exacts des responsables explicitement désignés). Ne jamais mettre de vraies informations dans les fixtures ou les exemples versionnés.

L’import crée un foyer séparé sans modifier la démonstration. Il requiert SQLite et `APP_ENV=local`, refuse de réimporter le même fichier et écrit des identifiants aléatoires dans `.local/profiles.imported.json` lisible uniquement par le propriétaire. Le mot de passe commun est destiné au test supervisé, pas à un contrôle parental de production. Le sélecteur local expose les prénoms aux personnes présentes sur cette machine ; ne pas exposer ce prototype sur Internet. Aucun fournisseur ne reçoit ces données. Les matières sont conservées dans le résumé du profil pour cette version.

Suzanne est désormais visible avant connexion, avec lecture vocale après clic et animation légère du portrait activable/arrêtable. Les préférences de réduction des animations sont respectées. Cette animation de cadrage n’est pas une vidéo parlante et ne synchronise pas les lèvres.
