# Design et étapes

## Design système Sprint 1

Palette crème (#f7f7f2), vert profond (#254d42), sauge et accents terracotta. Titres Georgia locaux, texte système sans téléchargement externe. Icône fleur originale et illustrations SVG originales, aucune photo de personne réelle. Suzanne se présente explicitement comme IA fictive. Portrait/personnalisation visuelle différés.

Navigation latérale sur grand écran ; navigation horizontale tactile sur téléphone. Dashboard à trois colonnes logiques (navigation, contenu, contexte), puis deux et une selon la largeur. Cartes et boutons natifs, focus visible, lien d'évitement, labels, dialogue natif avec Escape et focus restauré, réduction des animations. Préférence de lecture agrandie persistée et activée par défaut pour les profils seniors fictifs. L'audit axe contrôle les contrastes et autres règles automatisables ; la lecture à 5 ans et l'accessibilité réelle demandent des tests humains supplémentaires. Ne pas empêcher le zoom.

Priorité : choisir une curiosité, découvrir ou définir un objectif. Pas de classement, série punitive, dépendance affective, scores de maîtrise inventés. Les minutes simulées sont marquées ; objectifs personnels enregistrés et mini-quiz non enregistré sont distincts.

## Roadmap (tailles relatives, pas engagements calendaires)

| Étape | Taille | Résultat et critères |
|---|---|---|
| Sprint 1 | M | socle local, auth démo, deux familles, UI responsive, migrations, objectifs/préférences, tests, CI et PR |
| Sprint 2 | XL | document validé → objet pédagogique sourcé → questions/indices/explication → vraie tentative → vérification différée ; passerelle IA versionnée, quotas, évaluations, choix FSRS |
| Sprint 3 | L | culture, livres, langues et voix consentie ; sources, transcription et feedback avec incertitude |
| Sprint 4 | XL | pipeline éditorial recoupé et daté, variantes d'âge, podcasts/transcriptions et première vidéo ; validation humaine éditoriale |
| Sprint 5 | L | identité de production, consentements, RLS, export/suppression, revue confidentialité, appareils réels et pilote avant extension |

La taille dépend des choix fournisseurs et du volume de contenus. Invitations et gestion des membres doivent précéder le pilote ; pas d'ouverture multi-familles réelle à partir des comptes de démonstration.

## Coûts

Aucun service cloud créé ou dépense engagée par l'application. Fonctionnement Node/Python/base sur machine locale. GitHub Actions configuré pour les vérifications du dépôt ; pas de workflow de déploiement. Les coûts futurs (LLM, transcription, synthèse, stockage, vidéo, hébergement) nécessitent un benchmark par activité et des plafonds par utilisateur/foyer avant sélection. Aucune estimation tarifaire présentée comme acquise.
