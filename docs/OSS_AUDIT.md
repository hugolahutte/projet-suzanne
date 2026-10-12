# Audit des projets open source — Suzanne

Date de contrôle : **12 octobre 2026**. Périmètre : les cinq dépôts imposés par `CODEX_BRIEF.md`, pour une PWA commerciale multi-foyers destinée aux enfants et aux adultes.

## Décision

Construire le socle de Suzanne dans son propre monorepo Next.js + FastAPI, avec une autorisation par foyer conçue dès le départ. Ne reprendre intégralement aucun des quatre produits audités. Retenir **ts-fsrs comme candidat composant pour le Sprint 2**, derrière une interface et après validation de la version effectivement installée. Utiliser les autres projets comme références pédagogiques et techniques, sans copier leurs fichiers dans le Sprint 1.

| Projet | Fork complet | Inspiration | Composant isolé | Conclusion pour Suzanne |
|---|---|---|---|---|
| OpenTutor | Coût élevé : conversion du modèle local en service multi-foyers | Forte : ingestion, sources, activités, tutorat | Possible après audit ciblé | Référence technique, pas socle de production |
| ts-fsrs | Inutile | Forte pour le modèle de révision | Oui, bibliothèque dédiée | Candidat prioritaire au Sprint 2 |
| SocraticTutor | Mauvais alignement desktop/local | Forte : notions, erreurs, fin de séance | Peu de valeur face au couplage existant | Inspiration pédagogique |
| AI Tutor Webapp | Dette de dépendances et maintenance ancienne | Modérée : guidage enfant | Non retenu | Ne pas reprendre son socle |
| TinkerSchool | Trop centré école/matériel/services hébergés | Forte : parcours et espace parent | À étudier séparément | Inspiration du modèle familial, autorisations à réécrire |

Ces appréciations sont des **choix d'architecture**, et non des résultats de benchmark.

## Méthode et limites

Contrôles réalisés : consultation des dépôts publics et de leurs métadonnées GitHub, dernier commit de la branche par défaut, fichiers `LICENSE`, manifestes de dépendances, README, politique de sécurité OpenTutor et échantillon du code d'authentification de TinkerSchool. Recherche ciblée de bulletins de sécurité primaires pour des versions observées.

Les applications tierces n'ont pas été installées ou exécutées. Aucun test d'intrusion, scan exhaustif des fichiers de verrouillage, audit complet des dépendances transitives ou essai sur iPhone/iPad réel n'a été réalisé. L'ergonomie mobile ci-dessous est une évaluation documentaire, explicitement distinguée d'un test. L'absence d'anomalie mentionnée ne signifie jamais absence de vulnérabilité. Les versions sont celles des manifestes consultés, pas une affirmation sur les dernières versions disponibles.

Les liens de commit figent l'activité observée ; les liens vers `main` permettent de retrouver les fichiers et peuvent évoluer. `pushed_at` porte sur le dépôt et peut inclure d'autres branches : il ne prouve pas un changement récent de la branche principale.

## 1. OpenTutor

- **Existence / activité :** dépôt public non archivé ; dernier commit de `main` observé le 8 octobre 2026, [`f0142f2`](https://github.com/zijinz456/OpenTutor/commit/f0142f28e8ed1ab4047e16c9aee5c283a6ee98b7). [Métadonnées GitHub](https://api.github.com/repos/zijinz456/OpenTutor).
- **Licence :** [MIT, copyright Zijin Zhang 2026](https://github.com/zijinz456/OpenTutor/blob/main/LICENSE). Le texte autorise notamment modification et vente sous conservation des notices ; les composants et contenus externes doivent garder leur propre examen.
- **Dépendances observées :** Next `16.2.2`, React `19.2.4`, Tailwind 4, Zustand ; FastAPI `0.115.6`, SQLAlchemy `2.0.47`, SQLite, SDK OpenAI/Anthropic, LangGraph. Plusieurs dépendances Python ont des bornes ouvertes : une résolution nouvelle n'est pas équivalente à un environnement figé. [Manifeste web](https://github.com/zijinz456/OpenTutor/blob/main/apps/web/package.json), [requirements API](https://github.com/zijinz456/OpenTutor/blob/main/apps/api/requirements-core.txt).
- **Adaptation et mobile :** le README présente une bêta locale mono-utilisateur, exclut le mode SaaS/classe multi-utilisateur et reconnaît des vues mobiles incomplètes. L'ingestion, les quiz et les sources constituent des pistes pertinentes, mais la proximité de stack ne résout pas les écarts de produit. [README](https://github.com/zijinz456/OpenTutor/blob/main/README.md).
- **Sécurité :** l'authentification est désactivée par défaut dans le mode local documenté. La politique impose activation et secret JWT avant exposition réseau, ainsi qu'isolation du sandbox de code. Ne pas importer ces valeurs par défaut dans Suzanne. [SECURITY.md](https://github.com/zijinz456/OpenTutor/blob/main/SECURITY.md).

**Constat vérifié sur dépendance :** `python-multipart==0.0.19` appartient aux versions touchées par le déni de service sur les en-têtes multipart (CVE-2026-42561, correction `0.0.27`) et par la divergence d'interprétation des formulaires (CVE-2026-53538, correction `0.0.30`). Cela établit un problème de version déclarée, pas une exploitation démontrée de l'application. [Avis du mainteneur sur multipart](https://github.com/Kludex/python-multipart/security/advisories/GHSA-pp6c-gr5w-3c5g), [avis du mainteneur sur les formulaires](https://github.com/Kludex/python-multipart/security/advisories/GHSA-6jv3-5f52-599m).

## 2. ts-fsrs

- **Existence / activité :** public, non archivé, créé en 2023 ; `pushed_at` au 11 octobre 2026, mais dernier commit de `main` observé au 2 septembre 2026, [`c8ca282`](https://github.com/open-spaced-repetition/ts-fsrs/commit/c8ca282edc3fe1cdfa1c24912437938b63a25cb3). [Métadonnées](https://api.github.com/repos/open-spaced-repetition/ts-fsrs).
- **Licence :** [MIT, Open Spaced Repetition 2026](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/LICENSE).
- **Dépendances :** le manifeste du scheduler `packages/fsrs` indique `5.4.2`, Node `>=20`, exports ESM/CJS/UMD et aucune section de dépendances d'exécution ; il comporte des dépendances de développement. Ne pas confondre cette bibliothèque avec le monorepo complet ou avec le binding d'optimisation séparé. [Manifeste du scheduler](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/packages/fsrs/package.json), [README](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/README.md).
- **Mobile / sécurité :** aucune interface utilisateur à auditer ici. La bibliothèque n'apporte ni comptes, ni contrôle parental, ni isolation des données. Aucun résultat de scan de son paquet publié n'est établi dans ce contrôle.

**Intégration proposée :** stocker les événements et échéances dans l'API avec `household_id` et `profile_id`. Si le calcul s'exécute en TypeScript, exposer une fonction interne de confiance ; ne pas accepter une échéance arbitraire envoyée par le navigateur. Avec FastAPI autoritaire, comparer ultérieurement une implémentation Python FSRS ou un adaptateur interne TypeScript et leurs résultats sur un même jeu d'événements. Éviter deux moteurs concurrents. Versionner algorithme, paramètres et états, tester dates, fuseaux, répétition d'une requête et migration des anciennes cartes. Ne pas présenter FSRS comme une mesure complète de compréhension.

## 3. SocraticTutor

- **Existence / activité :** public, non archivé ; dernier commit de `main` et dernier push observés le 4 juin 2026, [`3058764`](https://github.com/ccascio/socratictutor/commit/3058764108c8fb0bef318ece44c30d2768e92a76). [Métadonnées](https://api.github.com/repos/ccascio/socratictutor).
- **Licence :** fichier [MIT portant le copyright Horizon UI 2023](https://github.com/ccascio/socratictutor/blob/main/LICENSE). Vérifier la provenance des ressources et du template avant toute reprise de code ou d'assets.
- **Dépendances :** manifeste Next `^15.1.6`, React `^19.0.0-rc.1`, Chakra, `better-sqlite3`, AI SDK, Tauri 2. Le README indique Next 14 : divergence documentaire. La présence de plusieurs bibliothèques UI et types React 18 impose une revue de compatibilité. [package.json](https://github.com/ccascio/socratictutor/blob/main/package.json).
- **Fonctionnement :** application desktop macOS, base SQLite, pas de comptes ni synchronisation ; idées utiles de bibliothèque de concepts et d'artefacts de session. Le stockage local annoncé ne doit pas être interprété comme une absence de transmission au fournisseur : le même README requiert une clé OpenAI. [README](https://github.com/ccascio/socratictutor/blob/main/README.md).
- **Mobile / sécurité :** aucune validation PWA ou mobile établie. Modèle d'autorisation multi-foyers à construire intégralement. Les plages du manifeste ne suffisent pas à déterminer toutes les versions résolues ni les vulnérabilités effectives.

Pour Suzanne, reprendre l'idée de questions progressives avec une sortie explicative lorsque l'utilisateur reste bloqué : le principe strict « ne jamais donner de réponse » décrit par ce projet ne satisfait pas à lui seul le cahier des charges.

## 4. AI Tutor Webapp

- **Existence / activité :** public, non archivé ; dernier commit de `main` observé le 11 février 2025, [`963dfa9`](https://github.com/spragginsdesigns/ai-tutor-webapp/commit/963dfa9c55c715ccc3b9f43e20791318524babeb). Activité ancienne relativement à la date de contrôle. [Métadonnées](https://api.github.com/repos/spragginsdesigns/ai-tutor-webapp).
- **Licence :** GitHub renvoie `NOASSERTION`, mais le [fichier LICENSE](https://github.com/spragginsdesigns/ai-tutor-webapp/blob/main/LICENSE) contient une déclaration Apache 2.0, copyright Vercel 2024. Conserver cette distinction, récupérer le texte complet de la licence et vérifier les notices et droits des ajouts avant copie. Aucune reprise de code retenue.
- **Dépendances :** Next `15.0.3-canary.2`, React 19 RC, NextAuth `5.0.0-beta.25`, AI SDK `4.1.17`, Drizzle, services Vercel. Mélange de versions préliminaires et maintenance ancienne. [package.json](https://github.com/spragginsdesigns/ai-tutor-webapp/blob/main/package.json).
- **Produit / mobile :** le README décrit un tutorat pour enfants par questions et exemples ; il ne démontre ni architecture multi-foyers ni validation iOS/PWA. Son attribution du modèle à DeepSeek doit être rapprochée du dernier commit annonçant une migration vers OpenAI. [README](https://github.com/spragginsdesigns/ai-tutor-webapp/blob/main/README.md).

**Sécurité :** la branche canary utilisée appelle une revue particulière. Le bulletin Next [GHSA-5f7q-jpqc-wp7h](https://github.com/vercel/next.js/security/advisories/GHSA-5f7q-jpqc-wp7h) décrit notamment un risque de déni de service lié au prérendu partiel, conditionné à des réglages expérimentaux et au mode minimal. Ces conditions n'ont pas été vérifiées dans ce projet : pas d'affirmation d'exploitabilité. Une nouvelle stack stable et auditée est préférable à la reprise de ce manifeste.

## 5. TinkerSchool

- **Existence / activité :** public, non archivé ; dernier commit de `main` observé le 6 mai 2026, [`f34b3ce`](https://github.com/jonathanhawkins/tinkerschool/commit/f34b3ce40f11d66a03c8d65dcae145a1cbbc8aae), consacré au responsive de l'espace parent. Cela prouve une modification, pas une validation indépendante sur appareil. [Métadonnées](https://api.github.com/repos/jonathanhawkins/tinkerschool).
- **Licence :** [MIT, TinkerSchool 2026](https://github.com/jonathanhawkins/tinkerschool/blob/main/LICENSE).
- **Dépendances :** Next `16.1.6`, React `19.2.3`, Clerk, Supabase, AI SDK/Anthropic/OpenAI, Hume, Upstash, Stripe, Blockly, Monaco et Web Serial. Le README mentionne encore Next 15 ; prendre le manifeste comme référence du contrôle. [package.json](https://github.com/jonathanhawkins/tinkerschool/blob/main/package.json).
- **Produit / mobile :** intéressant pour les profils familiaux et la progression, mais centré K–6 et projets avec matériel M5StickC. Le README exige Chrome/Edge pour Web Serial et propose un simulateur. Ne pas faire de ce matériel un prérequis des parcours iPhone/iPad ; vérifier séparément chaque capacité. [README](https://github.com/jonathanhawkins/tinkerschool/blob/main/README.md).

**Constat de code :** `requireAuth()` récupère normalement un client Supabase lié au JWT, mais utilise un client administrateur dans son `catch`. Ce repli contourne RLS et transmet ce client aux appelants. Les requêtes examinées filtrent certains identifiants, mais ce mécanisme ne constitue pas une garantie générale d'isolation. Suzanne doit échouer de façon fermée si l'identité ou le contexte du foyer ne peut pas être établi. [require-auth.ts](https://github.com/jonathanhawkins/tinkerschool/blob/main/lib/auth/require-auth.ts).

**Autre point à examiner avant réutilisation :** la vérification de PIN utilise bcrypt et vérifie l'appartenance familiale ; la fonction lue accepte aussi une migration de PIN en clair et ne montre pas de limitation des tentatives en son sein. Une protection éventuelle ailleurs n'a pas été exclue. Ne pas reprendre cette voie historique dans une nouvelle application. [pin.ts](https://github.com/jonathanhawkins/tinkerschool/blob/main/lib/auth/pin.ts). La présence de migrations RLS doit être complétée par des tests réels d'accès croisé, de rôles et de cohérence entre profil et foyer. [Schéma initial](https://github.com/jonathanhawkins/tinkerschool/blob/main/supabase/migrations/001_initial_schema.sql).

## Conditions d'adoption et suites

1. **Sprint 1 :** aucun fork ni code tiers de ces produits copié. Authentification, permissions et données fictives conçues pour deux foyers séparés. Distinguer identité de connexion, rôle dans le foyer et profil d'apprentissage : un adulte peut apprendre sans être responsable légal.
2. **Avant intégration FSRS :** choisir une version publiée, vérifier paquet et licence, figer le fichier de verrouillage, scanner les dépendances, tester la déterminisme du calcul et les migrations. Garder les événements d'apprentissage comme source de vérité.
3. **Avant reprise d'un autre composant :** conserver licence et attribution exactes, inventorier dépendances et assets, examiner le code effectivement utilisé. La licence d'un dépôt ne couvre pas automatiquement les modèles, jeux de données, polices, images ou services externes.
4. **Avant pilote :** audit du graphe de dépendances résolu (`npm audit`/équivalent et `pip-audit`), revue des autorisations API/base, cookies et CSRF, limites de débit, caches PWA et suppression des données. Aucune donnée privée dans un cache partagé entre profils.
5. **Mobile :** essais Safari iPhone et iPad réels, orientation, taille du texte, clavier, VoiceOver, contraste, navigation tactile, installation et comportement hors ligne. Les suites Playwright sont utiles, mais ne remplacent pas tous ces essais.

La compatibilité commerciale retenue repose sur les licences consultées et les obligations de notices identifiées ; aucune conformité réglementaire du produit complet n'est revendiquée par cet audit technique. Le passage du prototype à d'autres familles reste conditionné aux revues du cahier des charges.
