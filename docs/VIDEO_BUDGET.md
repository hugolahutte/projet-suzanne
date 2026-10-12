# Vidéo Suzanne à la demande

Proposition du 12 octobre 2026, sans souscription ni appel payant. Le portrait,
son animation CSS et la lecture vocale du navigateur fonctionnent déjà. Le
fournisseur vidéo, le compteur de consommation et le coupe-circuit décrit ici
restent à implémenter avant toute activation réelle.

## Budget proposé

[Tarifs développeurs Tavus](https://www.tavus.io/pricing), vérifiés sur la page
rendue dans le navigateur (le HTML contient aussi des grilles anciennes masquées) :

| Offre | Prix affiché / mois | Vidéo incluse | Dépassement |
| --- | ---: | ---: | --- |
| Starter | 22 USD | 60 minutes | Aucun dépassement à la consommation |
| Builder | 59 USD | 175 minutes | 0,35 USD/minute |

Starter inclut un visage personnalisé créé à partir d'une image et une session
simultanée. Recommandation initiale : enveloppe vidéo de 30 EUR/mois pour tout le
foyer, à confirmer au paiement selon TVA/change/frais ; ce n'est ni une conversion
garantie des 22 USD ni une autorisation d'abonnement. 60 minutes représentent au
maximum 12 échanges de 5 minutes, moins la marge technique. À titre de comparaison,
300 minutes/mois (2 personnes × 5 minutes × 30 jours) sur Builder coûteraient
102,75 USD avant taxes/frais. La vidéo continue n'est pas le mode économique.

La pile voix/LLM/WebRTC du fournisseur est incluse. Un LLM externe OpenRouter,
l'hébergement et d'autres services éventuels auraient leur propre coût, à intégrer
au budget global de Suzanne. Le mode audio seul chez Tavus a le même tarif que la
vidéo : le repli économique doit fermer Tavus et revenir au texte/à la voix locale.

## Activation et plafond à implémenter

1. Accueil : portrait immédiatement visible ; aucune création de conversation
   payante au chargement. Bouton vidéo après connexion, accord du responsable et
   vérification de qualité réseau. Sur iOS, ne pas prétendre déduire le Wi-Fi si
   le navigateur ne le révèle pas : confirmation utilisateur et mesure réseau.
2. Politique serveur par foyer : budget mensuel en centimes EUR, quota de secondes,
   durée maximale de 5 minutes/session, une session simultanée pour Starter ;
   plafond global du compte fournisseur pour l'infrastructure multi-familles.
   Tous les montants restent désactivés tant qu'aucun forfait n'est approuvé.
3. Inclure les abonnements/frais fixes et une marge change/taxes dans le budget.
   Utiliser la période de facturation du fournisseur, pas une remise à zéro arbitraire
   au premier jour du mois. Afficher période, dépensé, réservé et restant dans l'admin.
4. Avant tout appel fournisseur, réserver atomiquement le pire coût et les secondes
   de la session, avec clé d'idempotence. Refuser si le disponible ne suffit pas ;
   deux appareils ne doivent pas pouvoir réserver le même solde. Aucun upgrade ni
   rechargement automatique. Conserver les réservations en base lors des redémarrages.
5. Durée maximale imposée au fournisseur, arrêt serveur à échéance et arrêt après
   déconnexion/inactivité. Ne pas dépendre d'un minuteur JavaScript ou d'un onglet
   ouvert. Facturation Tavus dès création, minimum 30 secondes et pas de 6 secondes :
   réserver une marge et rapprocher ensuite les consommations réellement facturées.
6. Webhooks vérifiés, rapprochement idempotent, alertes à 80 % et 95 %. Bloquer
   les nouveaux appels si l'état de consommation est incertain. À épuisement,
   fermer la vidéo et proposer texte/voix locale ; l'apprentissage reste accessible.

## Conditions de mise en service

Avant paiement : confirmer le tarif/les taxes, tester la qualité du portrait fictif
et de la voix française, vérifier le traitement des conversations de mineurs et
limiter les données transmises. Les tests sans dépense doivent couvrir refus
parental, réseau insuffisant, double réservation, abonnement supérieur au plafond,
épuisement, panne fournisseur, onglet fermé, reprise après crash et nouvelle période.
Un simple réglage d'interface ne constitue pas une garantie de plafond bancaire.
