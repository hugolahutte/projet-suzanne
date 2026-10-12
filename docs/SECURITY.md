# Menaces et périmètre de sécurité — Sprint 1

Le produit est une démonstration locale sur données fictives. `APP_ENV` autre que local/test fait échouer le démarrage. Les ports fournis écoutent sur loopback ; aucun service hébergé créé. Cette restriction n'empêche pas quelqu'un de modifier la configuration : ce n'est pas une barrière de déploiement absolue.

| Menace | Contrôle actuel | Limite / suite |
|---|---|---|
| Accès inter-foyers / IDOR | membership à chaque route de foyer ; propriétaire dans les mutations d'objectif ; tests croisés bidirectionnels | RLS et contraintes composites à renforcer avant pilote |
| Élévation enfant → parent | identité issue du cookie serveur ; rôle lu en base ; champs inattendus rejetés ; changer de compte nécessite authentification | tous les mots de passe de démo sont connus : aucune donnée réelle autorisée |
| Parent curieux / autre adulte | liens de responsabilité explicites ; résumés minimisés ; aucune conversation accessible | permissions fines et information selon âge/juridiction au pilote |
| Vol / fixation de session | jeton opaque 256 bits, empreinte SHA-256 en base, HttpOnly, SameSite strict, expiration 8 h, rotation à connexion et révocation logout | Secure désactivé pour HTTP loopback ; MFA/OIDC, révocation multi-appareil et récupération manquants |
| CSRF | Origin exact obligatoire sur POST/PATCH ; cookie strict ; pas de mutations GET | config d'origine à revalider derrière tout nouveau proxy |
| Bruteforce / charge | 20 tentatives/minute/IP ; tailles de champs ; 30 objectifs max/principal/foyer | limite mémoire par processus : stockage partagé/limites distribuées avant déploiement |
| Cache partagé entre personnes | API no-store, aucune API/page personnelle dans le service worker ; seule page de secours publique cachée | tests manuels appareils partagés et Safari à faire |
| XSS / injections | React échappe les textes, pas de HTML arbitraire, SQLAlchemy paramétré ; pas d'upload | CSP stricte à concevoir au pilote, future ingestion non fiable |
| Dépendances | locks versionnés, npm audit, pip-audit, CI | surveiller les nouveaux avis ; un audit vert n'est pas une garantie absolue |
| Données dans les logs | aucune journalisation du mot de passe ou corps utilisateur ; access logs Uvicorn désactivés dans les scripts | infrastructure future doit expurger erreurs et traces |
| Dépenses IA / fuite fournisseur | aucun SDK IA, aucune clé ou requête fournisseur | budgets, rétention, contrats et évaluation au Sprint 2 |

## Données et conservation

Minimisation : pseudonymes et âges fictifs, pas de date de naissance ni photo. La seule base de démonstration reste locale. Les sessions expirées sont nettoyées lors d'une connexion ; pas de rétention planifiée pour objectifs/préférences. La base peut être effacée volontairement pour réinitialiser les fixtures (procédure README). Cela ne remplace pas une procédure utilisateur d'export/suppression : elle reste à implémenter avant toute collecte réelle.

Aucun consentement réel n'est recueilli. Aucun micro/caméra n'est demandé ; Permissions-Policy les désactive. Pas de suivi externe, polices distantes, médias distants ni cookies marketing. Les deux liens pédagogiques externes s'ouvrent à la demande avec noreferrer.

## Prérequis avant pilote

Dépôt privé avant ajout de profils réels ; identité de production et MFA adultes ; vérification des liens parentaux ; isolation RLS/contraintes ; consentement et information adaptés ; export/suppression/rétention ; HTTPS et chiffrement du stockage ; tests de restauration ; revue CNIL/RGPD/CGU et sous-traitants ; tests Safari, VoiceOver et appareils partagés. Pour les uploads : limites, antivirus, stockage isolé et liens signés. Pour l'IA : documents traités comme données non fiables, modèles évalués sur sûreté mineurs et pédagogie, plafonds de coût.

Cette liste documente les limites techniques du prototype ; elle n'est pas une certification ni une analyse juridique exhaustive.

## Extension accueil, carnet, jeux et vidéo

Les fiches du carnet sont filtrées simultanément par foyer et principal ; aucune lecture implicite par un autre adulte ou un parent. Les types et tailles sont validés, les identifiants de propriétaire ne sont jamais acceptés depuis le corps de requête. La suppression suit le même contrôle et le middleware d’origine couvre aussi DELETE. Aucune pièce jointe n’est acceptée à ce stade.

Les permissions vidéo sont stockées par foyer, modifiables exclusivement par un rôle guardian authentifié. Le drapeau ne peut pas créer de session vidéo : le fournisseur est absent, la disponibilité reste fausse, micro et caméra restent interdits par Permissions-Policy.

Les jeux ne font aucun appel IA ; les réponses restent en mémoire de l’écran, effacées en quittant le jeu. Le corpus officiel est public et distinct du carnet. La lecture d’accueil utilise la synthèse du navigateur, uniquement après clic, et s’arrête à la sortie de l’accueil. Aucune voix enregistrée.

Les contrats Jev/OpenRouter ne possèdent ni transport HTTP ni clé. Une classification Jev ne peut modifier les rôles, permissions ou budgets. Leur activation reste conditionnée au travail décrit dans `AI_ROUTING.md`.
