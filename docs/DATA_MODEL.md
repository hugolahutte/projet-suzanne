# Modèle de données

## Tables réellement migrées au Sprint 1

| Table | Clé / portée | Usage |
|---|---|---|
| households | id | foyer isolé |
| users | id, email unique | principal de connexion, mot de passe Argon2, prénom/âge fictifs |
| memberships | household_id + user_id | rôle guardian/adult/child, vérifié à chaque requête de foyer |
| guardian_links | household_id + guardian_id + child_id | relations de supervision explicites ; vérification supplémentaire du rôle enfant dans ce foyer |
| learning_profiles | user_id | niveau/intérêt de démo, surnom, texte agrandi ; accès au seul principal |
| sessions | token_hash | empreinte du jeton, principal, expiration absolue ; suppression au logout |
| goals | id, household_id, user_id | objectifs privés au principal et au foyer, état accompli déclaré par l'utilisateur |

| notebook_entries | id, household_id, user_id | fiches privées livre/note/devoir, titre, matière, observations, date |
| household_settings | household_id | autorisation future de vidéo, fausse par défaut ; ne connecte aucun fournisseur |

Migrations Alembic versionnées, upgrade/downgrade testés. Les métriques de dashboard et summaries enfants sont des constantes **simulées**, pas des tables de maîtrise. Un objectif coché par l'utilisateur ne prouve pas la compréhension.

Le profil personnel suit le principal, tandis que le rôle appartient au foyer. Un principal pourra donc appartenir à plusieurs foyers ; la première interface affiche le premier foyer et ne prétend pas encore offrir le changement de foyer d'un même compte. Les fixtures représentent deux familles séparées.

## Modèle conceptuel prévu, non implémenté

Tous les enregistrements personnels futurs comporteront le principal et/ou le foyer de propriétaire, ainsi que des clés étrangères cohérentes avec membership. Ne jamais accepter le tenant comme autorité depuis le navigateur. Les exports/suppressions doivent suivre ces dépendances.

- Identité : `consents` (finalité, version, représentant, date), `preferences`, événements de retrait de consentement.
- Pédagogie : `interests`, `learning_plans`, `subjects`, `topics`, `skills`, `prerequisites`, `skill_mastery_events`. Maîtrise estimée séparée de l'activité et confiance explicite.
- Sources : `documents`, `document_chunks`, `sources`, `curriculum_units`. Stockage par foyer, provenance, empreinte, durée de conservation et validation de fichiers.
- Activités : `lessons`, `activities`, `questions`, `attempts`, `feedback`. Identité stable d'un objet pédagogique, formats texte/quiz/audio/vidéo distincts ; chaque tentative référence objet/version/principal.
- Révision : `review_cards`, `review_events`, `active_time_events`, sessions d'apprentissage (table séparée des `sessions` d'auth), version du moteur FSRS et échéances calculées côté serveur.
- Dialogue : `conversations`, `messages`, `tutoring_strategies`, `memory_items`. Propriétaire individuel, ACL spécifiques, absence d'accès parental global implicite.
- Lecture/culture : `books`, `reading_logs`, `culture_topics` ; séparation catalogue/licences et activité privée.
- Éditorial : `news_items`, `news_sources`, `age_variants`, `media_assets` ; statut de validation, date des faits/publication/collecte, références et droits.
- Gouvernance : `audit_events`, `data_deletion_requests`, `billing_accounts` (concept uniquement, aucun paiement).

RLS avec rôle applicatif non propriétaire et tests inter-foyers PostgreSQL à ajouter avant ouverture. Ne pas utiliser une clé administrateur comme repli si la session ou le contexte tenant manque.
