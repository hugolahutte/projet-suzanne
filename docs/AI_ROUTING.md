# Suzanne — routage, ressources et vidéo

Décision du 12 octobre 2026. Aucune clé ni connexion payante activée dans cette version. Les fonctions de `apps/api/suzanne/ai_contracts.py` construisent et vérifient des contrats de requêtes, sans transport HTTP. Elles ne sont pas exposées à l’interface et ne constituent pas encore un chatbot.

## Architecture retenue

1. Logique locale : scores des jeux, filtres de programmes, objectifs et navigation. Coût IA nul.
2. Jev pour classer une demande courte ou choisir une action pédagogique bornée. Pas d’appel Jev sur un bouton dont l’intention est déjà connue. Une incertitude conduit à clarifier ; une sortie du modèle ne peut jamais donner un droit d’accès ou activer une dépense.
3. Un modèle génératif explicitement choisi via OpenRouter pour expliquer, dialoguer, adapter un exercice. Pas de modèle coûteux sélectionné automatiquement. Le nom du modèle restera à fixer après essais pédagogiques et vérification de ses prix.

Jev est un modèle de décisions structurées, pas un générateur de conversation. Il retourne Choice, Score ou Noul avec probabilités/confiance. Sources officielles : [TypeSafe, introduction](https://docs.typesafe.ai/introduction), [requêtes et réponses](https://docs.typesafe.ai/introduction/quickstart).

Une seule clé OpenRouter peut donner accès à Jev et aux modèles génératifs : [Jev sur OpenRouter](https://openrouter.ai/docs/guides/community/jev), [SDK TypeSafe via OpenRouter](https://openrouter.ai/docs/guides/community/typesafe-sdk). Le contrat utilise `https://openrouter.ai/api/v1/systemone`, modèle `typesafe/jev-1.13`. Pour un accès direct TypeSafe ultérieur : `https://api.typesafe.ai/v1/systemone`, modèle `jev-1.13.0`, clé distincte. Les versions devront être revérifiées à l’activation.

Le contrat chat utilise `/api/v1/chat/completions`, un modèle figurant dans une liste autorisée, 4 000 caractères de demande maximum, 600 tokens de sortie, aucun repli automatique et des plafonds de tarif par million de tokens. `data_collection: deny`, `zdr: true` et `require_parameters: true` sont demandés ; si aucun endpoint ne les satisfait, le futur transport doit refuser sans affaiblir ces conditions. Ces paramètres chat ne sont pas ajoutés arbitrairement au schéma System One : ses garanties de rétention devront être vérifiées séparément. [Documentation officielle du routage](https://openrouter.ai/docs/guides/routing/provider-selection).

## Conditions avant de connecter le dialogue

- Accord sur le fournisseur et le budget, clé serveur dans un secret local (jamais `NEXT_PUBLIC_*`, Git ou navigateur).
- Contrôles du compte fournisseur et compteur monétaire durable par foyer avec réservation atomique avant requête, réconciliation à l’usage réel et arrêt au plafond. Les plafonds de tarif du contrat ne sont PAS un plafond de dépense mensuelle.
- Transport HTTP à délai borné, sans retry facturant implicite, gestion des erreurs sans fuite de données ; tests avec mocks puis essai autorisé à faible budget.
- Adaptation à l’âge, corpus officiel correctement sélectionné, réponses sourcées, évaluation de l’exactitude et des comportements pédagogiques. Jev ne remplace ni les permissions ni l’évaluation des réponses.
- Minimisation du contexte : ne jamais envoyer tout un foyer, des notes ou des livres par défaut. Le carnet actuel n’est envoyé à aucun fournisseur.

L’accueil actuel compose un message à partir du prénom fictif, du surnom de Suzanne et du nombre d’objectifs en cours. Il est lu sur action de l’utilisateur par `speechSynthesis`, avec une voix française locale si disponible, sinon la voix fournie par le navigateur. Il ne s’agit pas d’une voix personnalisée ni d’un dialogue généré. Le texte reste utilisable sans audio.

## Notes, devoirs et livres

Disponible : carnet personnel persistant, types livre / note / devoir, titre, matière ou auteur, observations, suppression. Accès limité au propriétaire et au foyer dans chaque requête ; un parent n’accède pas implicitement au carnet privé d’un enfant.

À développer : imports de fichiers dans un stockage privé, limites de taille et contrôle du type réel, OCR, affichage de la copie et validation de la transcription (notes, barème, annotations), puis extraction de points à retravailler. Connexion scolaire selon le fournisseur et ses possibilités officielles ; ne pas demander les identifiants scolaires tant que le connecteur n’est pas défini. Livres : métadonnées d’abord, extraits et fichiers autorisés ensuite, références de pages et progression. Aucun fichier scolaire réel ni scan de jeu ne doit entrer dans le dépôt public.

## Suzanne live

Disponible : préférence `live_allowed` par foyer, désactivée par défaut, modification exclusivement par responsable légal authentifié. La réponse serveur annonce toujours `available: false` et `provider_ready: false` tant que le service vidéo n’existe pas. Aucun micro ni caméra ouvert.

Le futur service doit exiger simultanément autorisation du foyer à chaque session, fournisseur configuré, budget disponible, action explicite de l’utilisateur et connexion Wi-Fi satisfaisante. La seule valeur navigateur `effectiveType: 4g` ne prouve pas le Wi-Fi. Safari ne fournit pas toujours cette information : prévoir confirmation du réseau par l’utilisateur + mesure réseau bornée et signaler ce qui n’est pas vérifiable. Si une condition manque, proposer texte/audio. Recontrôler à la reprise, couper à la révocation/épuisement du budget et prévoir retour audio si dégradation. L’API d’avatar vidéo, sa voix, ses tarifs et sa politique de données restent à sélectionner et approuver.

## Jeux

Disponible : capitales (20 questions originales, cinq par joueur sans répétition dans une partie), petit bac (une manche, catégories prénom/pays/animal/objet, validation collective explicite puis calcul 10 unique / 5 partagé / 0 refusé). 1–4 personnes sur un appareil ; pas encore de jeu en réseau. Réponses et prénoms conservés uniquement dans l’état de la partie.

Chili Quiz d’Antonin Boccara, édité par Prétexte, a été identifié. Son principe de quiz en équipes avec contestation/bluff est décrit par [Philibert](https://www.philibertnet.com/fr/pretexte/179502-chili-quiz-3770024165098.html) et [Esprit Jeu](https://www.espritjeu.com/chili-quiz.html). Le site [Prétexte](https://pretexte.co/) consulté n’expose pas la notice : la notice complète n’a donc pas été vérifiée. Attendre le scan de l’utilisateur pour confirmer les règles et préciser la variante souhaitée. Les scans pourront servir de références privées ; construire des questions originales pour Suzanne, sans publier les cartes commerciales dans le dépôt.
