# PROJET SUZANNE — Cahier des charges et mission Codex (V1)

> Produit : **Suzanne** — une IA pédagogique et culturelle personnelle, de **5 à 85 ans et plus**.  
> Dépôt : `hugolahutte/projet-suzanne` (compte personnel, **jamais HL Works**).  
> Statut : cadrage et fondations techniques. **Ne pas déployer publiquement.**

## 1. Mission

Construire une **PWA multi-appareils et multi-familles**, pour apprendre, comprendre le monde, développer ses compétences, découvrir, lire, suivre l'actualité et pratiquer les langues.

Suzanne n'est **ni un chatbot qui fait les devoirs à la place de l'élève, ni un simple LMS** : c'est un accompagnement intelligent, durable, chaleureux, rigoureux et adapté à chaque âge. Elle pousse l'autonomie, sait débloquer l'utilisateur quand il peine, mesure une progression vérifiable et propose différents formats pédagogiques.

**Phase initiale : validation technique puis MVP utilisable.** Prévoir dès le départ la croissance multi-familles, la conformité et l'extensibilité commerciale, sans surconstruire.

## 2. Identité de Suzanne

- Nom principal : **Suzanne**. Surnom choisi par chaque utilisateur (ex. « Suzie »), modifiable.
- Persona **fictive et clairement déclarée comme IA**, visuellement jeune femme adulte d'environ 20–22 ans, rousse, cheveux bouclés, apparence caucasienne, style actuel, soigné et sympathique ; coiffure et vêtements personnalisables. Ne pas utiliser de photo d'une personne réelle sans autorisation.
- Biographie fictive : étudiante en prépa littéraire **hypokhâgne / khâgne**. Ce récit nourrit sa personnalité mais **ne limite pas ses compétences** : elle aide en maths, physique, sciences, langues, arts, histoire, informatique, culture, etc.
- Ton chaleureux, curieux, cultivé, parfois drôle, **jamais infantilisant, moralisateur ou humiliant**. Adapte registre et profondeur à l'âge, au niveau et aux préférences.
- Ne prétend pas être humaine ni omnisciente : reconnaît ses incertitudes, vérifie les faits, cite ses sources pour l'actualité.
- Éviter les mécanismes de dépendance affective, particulièrement avec les mineurs. Elle encourage aussi l'entraide avec parents, enseignants et autres personnes réelles.

## 3. Publics et comptes

Départ : une famille pilote avec **deux mineurs de niveaux scolaires différents et deux adultes** ; créer uniquement des **profils fictifs de démonstration** dans le code et les fixtures publiques, pas de données personnelles réelles.

Évolution : de 5 à 85+ ans et plusieurs familles indépendantes (architecture **multi-tenant**).

- `User` : identité et authentification, âge/tranche d'âge, langue, préférences d'accessibilité.
- `Household` : foyer ou famille.
- `Membership` : lien entre utilisateur et foyer, rôles (adult, parent/guardian, child/dependent, admin), autorisations.
- `LearnerProfile` : objectifs, niveau, intérêts, préférences, accessibilité, consentements, surnom de Suzanne.
- Un adulte peut apprendre pour lui-même et superviser un enfant ; un enfant a un espace protégé.
- Parent : suivi d'activité, progression, contenus, objectifs et paramètres ; **permissions transparentes** et accès minimisé aux conversations privées selon âge/cadre légal.
- Invitations familiales, séparation des données entre foyers, possibilité de retirer un membre, exporter et supprimer ses données.
- Prendre en compte l'âge, les droits des représentants légaux, et les besoins d'accessibilité (lecture, police, dictée, audio, contrastes).

## 4. Univers fonctionnels

1. **École / Apprentissage** : disciplines, cours, devoirs, documents photo/PDF, aides progressives, dictées, exercices, contrôle de compréhension, révisions espacées, langues.
2. **Découvertes / Culture générale** : géographie, histoire, sciences, arts, société, cartes, capitales, thèmes libres, découverte guidée.
3. **Actualités** : flux quotidien sourcé et daté, adapté au niveau et à l'âge, plusieurs points de vue sur les sujets controversés, distinction faits/commentaires, liens sources, quiz de compréhension.
4. **Lectures** : livres lus/en cours, recommandations adaptées, conversations sur un ouvrage, vocabulaire, compréhension. Respect du droit d'auteur (ne pas reproduire intégralement des livres sous droits).
5. **Studio** : podcasts personnalisés, dialogues vocaux, contenus audio à écouter, images et schémas, capsules vidéo verticales courtes.
6. **Progression** : acquis, consolidation, séries de révision, objectifs, temps actif, compétences, recommandations. Valoriser les efforts et progrès, pas comparer/humilier les enfants.
7. **Demande à Suzanne** : point d'entrée transversal en texte et voix, conversation contextualisée avec parcours possibles.

Les adultes disposent des mêmes univers, avec une expérience non scolaire : actualité, langues, culture, projets personnels, apprentissage continu.

## 5. Pédagogie : règles non négociables

- Aider à **comprendre**, pas fournir immédiatement la réponse à un exercice scolaire.
- Stratégie adaptative : diagnostiquer → questionner → indice → autre explication/visuel → étape guidée → démonstration si nécessaire → mini-vérification.
- **Ne jamais laisser bloqué indéfiniment** : détecter l'incompréhension, réduire la difficulté et expliquer concrètement.
- Évaluer les connaissances avec de véritables tentatives et contrôles différés, pas de scores inventés.
- Mémoriser notions, erreurs récurrentes, prérequis, contexte et dates de révision.
- Différencier activité, compréhension observée, maîtrise estimée et confiance du système.
- Révisions espacées via FSRS ou équivalent, après examen du projet et de sa licence.
- Encouragement sobre, humour adapté, mini-jeux et récompenses facultatives qui ne remplacent pas la motivation intrinsèque.
- Personnalisation par centres d'intérêt (danse, sports, cinéma, etc.) **sans enfermement algorithmique**.
- Définir des limites de durée et pauses pour les plus jeunes, avec outils de supervision familiale.

## 6. Formats d'apprentissage interchangeables

Chaque objet pédagogique doit être **indépendant de son format de restitution** et pouvoir produire plusieurs activités :

- Conversation texte et fiches.
- Question/réponse à l'oral (STT + TTS), dialogues de langues (français, anglais, espagnol, japonais dès le MVP étendu).
- Quiz/QCM/réponse libre, cartes mémoire.
- Dictée dictée oralement, photo de copie puis correction argumentée (avec détection/incertitude de reconnaissance).
- Illustrations, schémas, cartes et chronologies.
- Podcast personnalisé avec transcription et sources.
- Mini-vidéo courte pédagogique, sous-titres et voix.
- Parcours de révision basé sur difficulté et préférence.

Exemple : apprendre une notion en image, la pratiquer à l'oral, la revoir via quiz, puis la consolider une semaine après. Les différentes modalités alimentent un **même dossier de compétences**.

## 7. Actualités / moteur éditorial

- Pipeline : collecter des sources autorisées → dédupliquer → horodater → fact-check / recouper → sélectionner → résumer → classifier âge/thème → contrôle éditorial/sécurité → décliner en texte, audio, quiz et vidéo.
- Séparer strictement **faits**, contexte, opinions attribuées et incertitudes ; exposer les références et dates.
- Ne jamais fabriquer une actualité pour remplir le flux. Si aucune source fiable récente, le dire.
- Personnalisation selon âge et intérêts ; filtres de thèmes sensibles contrôlés par les représentants légaux lorsque pertinent.
- Flux adulte : briefs quotidiens et approfondissements, notamment IA/technologie ; flux enfant : curiosité et pédagogie, sans sensationnalisme.
- Architecture capable d'intégrer ultérieurement un pipeline existant de veille, **sans dépendance ou accès automatique à des ressources d'entreprise**.
- Respect licences, droits d'extraits, politiques des médias et conditions des API.

## 8. Architecture cible à valider par ADR

Préférence initiale, à confirmer après audit :

- **PWA responsive** : Next.js App Router, React, TypeScript, Tailwind, shadcn/ui ; accessibilité WCAG.
- **API pédagogique** : Python/FastAPI ; contrats OpenAPI / clients typés.
- **DB** : PostgreSQL + migrations, pgvector seulement si recherche sémantique justifiée.
- **Stockage** : S3 compatible, séparation des fichiers par foyer, URLs signées.
- **Auth** : solution robuste (ex. Auth.js ou fournisseur dédié) avec sessions protégées, comptes enfants liés aux responsables, MFA adultes si possible ; RBAC et isolation au niveau des requêtes et de la base (RLS si applicable).
- **LLM gateway** : providers remplaçables, budget tokens, limite de coût par utilisateur/foyer, prompts versionnés, journalisation expurgée, évaluation des réponses.
- **Jobs** : file de tâches pour OCR/transcription/audio/vidéo et ingestions.
- **Media** : STT/TTS remplaçables, podcasts avec transcription ; Remotion envisagé pour vidéos courtes.
- **Observabilité** : erreurs, métriques, latence, dépenses par famille, alertes ; aucune donnée sensible brute dans les logs.
- **Infra** : Docker Compose en local ; déploiement ultérieur à décider (Cloud Run acceptable), séparation dev/staging/prod.
- **Qualité** : ESLint, type-check, pytest, tests d'intégration et E2E Playwright, GitHub Actions, analyse des dépendances.

Éviter les microservices inutiles : un monorepo clair `apps/web`, `apps/api`, `packages/*`, `infra/`, `docs/` suffit initialement.

## 9. Modèle conceptuel de données

Prévoir et documenter au minimum :

- `households`, `users`, `memberships`, `guardian_links`, `consents`, `preferences`
- `learning_profiles`, `interests`, `goals`, `learning_plans`
- `subjects`, `topics`, `skills`, `prerequisites`, `skill_mastery_events`
- `documents`, `document_chunks`, `sources`, `curriculum_units`
- `lessons`, `activities`, `questions`, `attempts`, `feedback`
- `review_cards`, `review_events`, `sessions`, `active_time_events`
- `conversations`, `messages`, `tutoring_strategies`, `memory_items`
- `books`, `reading_logs`, `culture_topics`
- `news_items`, `news_sources`, `age_variants`, `media_assets`
- `audit_events`, `data_deletion_requests`, `billing_accounts` (préparer sans implémenter les paiements au départ)

Toutes les lignes personnelles doivent être correctement reliées à un principal autorisé et/ou à un tenant. Faire les **tests d'accès croisé entre familles**.

## 10. Mineurs, confidentialité, sûreté

La conformité n'est pas une phase ultérieure :

- Data minimization, consentements adaptés à l'âge/juridiction, protections des mineurs, information des parents, politique de rétention et suppression/export.
- Aucune donnée réelle des enfants dans les seeds, captures de démonstration ou prompts de test.
- Confidentialité, chiffrement en transit/au repos, séparation des tenants, validation des fichiers, antivirus/limites de taille, signatures des URL, protection contre l'injection de prompt via documents.
- Refus et réorientation appropriés pour contenus dangereux ; réponses adaptées au niveau de maturité.
- Éviter une relation de substitution affective ou l'incitation à divulguer des secrets personnels.
- Ne pas enregistrer le micro en continu ; consentement explicite et indicateur visuel pour toute capture vocale.
- Désactiver l'entraînement des fournisseurs sur les données si les contrats/options le permettent ; documenter les transferts et sous-traitants.
- Revue CNIL/RGPD et des CGU fournisseurs avant ouverture à d'autres familles.

## 11. Audit open source obligatoire

Examiner effectivement, sans supposer la qualité, les versions, licences ou maintenabilité :

- https://github.com/zijinz456/OpenTutor
- https://github.com/open-spaced-repetition/ts-fsrs
- https://github.com/ccascio/socratictutor
- https://github.com/spragginsdesigns/ai-tutor-webapp
- https://github.com/jonathanhawkins/tinkerschool

Vérifier existence, licence exacte, activité récente, dépendances, vulnérabilités, ergonomie mobile et compatibilité avec le projet commercial. Produire `docs/OSS_AUDIT.md` avec liens et date de contrôle.

Comparer **fork complet / inspiration / adoption de composants** ; choisir par critères et tracer en ADR. Ne pas copier de code sans compatibilité de licence vérifiée.

## 12. Parcours UX

- Accueil adulte : « Mes découvertes », news, langues, podcasts, objectifs.
- Accueil enfant : « Aujourd'hui avec Suzanne », devoirs/révisions, défis, curiosités, bouton parler.
- Conversation avec entrée multimodale + accès aux sources des contenus.
- Parent : activité et progrès de chaque enfant, thèmes abordés, prochaines révisions, objectifs, réglages.
- Surnom et avatar/persona configurables sans modifier le moteur pédagogique.
- Favoriser rapidité, lisibilité, navigation clavier, appareils tactiles et formats audio.

## 13. Plan d'implémentation

### Sprint 0 — Audit et décisions
Auditer le dépôt actuel avant toute modification ; audit OSS, ADR stack/auth/multi-tenant, modèle de données, menaces, design système, roadmap avec estimations relatives. Ne pas supprimer du code existant.

### Sprint 1 — Socle démontrable
Monorepo initialisé, PWA responsive, Docker local, DB/migrations, auth et rôles, deux foyers fictifs isolés, sélection profils enfant/adulte, navigation, dashboards mockés, tests d'isolation, CI, `.env.example`.

### Sprint 2 — Premier tutorat réel
Import PDF/photo, extraction/validation, association sources, conversation tutorat guidé, exercices et tentatives, événements de compétences, dashboard relié aux résultats, révisions FSRS, tests pédagogiques.

### Sprint 3 — Culture et langues
Parcours culture générale, lecture, conversation orale multilingue, support accents/feedback avec niveau de confiance, intérêts et objectifs par utilisateur.

### Sprint 4 — Actualités et médias
Pipeline de news sourcées avec validation, podcasts + transcription, quiz de compréhension, premier rendu vidéo court (sans production massive).

### Sprint 5 — Pilote puis extension
Tests sur iPhone/iPad/Android/Mac/PC, revue de confidentialité, optimisation latence/coûts, pilotage familial, onboarding familles supplémentaires et architecture de plans tarifaires sans paiement avant décision.

## 14. Critères d'acceptation Sprint 1

1. `README.md` documente installation, variables et commandes.
2. `docker compose up` et scripts de développement démarrent sans secret réel.
3. PWA installable, responsive sur mobile/tablette/desktop, états chargement/erreur.
4. Deux foyers de démonstration isolés ; tests automatiques d'accès interdit croisé.
5. Comptes adultes et enfants fictifs avec rôles ; chaque membre a profil et surnom de Suzanne.
6. Dashboards enfant, adulte, parent navigables avec données explicitement simulées.
7. API documentée, migrations reproductibles, tests/CI verts.
8. Aucun contenu utilisateur privé commité ; `.gitignore` approprié.
9. Documentation des choix, limites, risques, coûts et prochaines étapes.
10. Aucun déploiement public ou dépense cloud sans accord explicite.

## 15. Consigne initiale à Codex

> Tu travailles dans le dépôt **hugolahutte/projet-suzanne**, **personnel**, sans jamais toucher aux organisations de l'utilisateur.
>
> Lis ce document intégralement. Inspecte le dépôt actuel, étudie les solutions open source nommées, puis produis l'audit, les ADR et un plan court. Ensuite **réalise réellement le Sprint 1**, en écrivant le code, tests, scripts et documentation. Fais des choix pragmatiques en indiquant les hypothèses. Utilise des fixtures fictives ; n'expose aucune donnée familiale réelle.
>
> Travaille dans une branche dédiée, crée une PR de revue si possible, et fournis à la fin le bilan des fichiers, commandes, tests passés/échoués, risques et prochaine étape. Ne fais ni déploiement public, ni création de ressources cloud payantes, ni mise en production de fonctionnalités sensibles sans validation.

## 16. Vision produit à long terme

Suzanne est un **compagnon d'apprentissage intelligent pour toute la vie** : de la première lecture aux langues, sciences, actualités, culture, découverte et formation continue. Une identité reconnaissable, un moteur pédagogique solide, plusieurs supports, plusieurs générations, et une relation centrée sur **l'autonomie de l'utilisateur**.
