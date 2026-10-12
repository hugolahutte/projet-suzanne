# Navigation et univers Suzanne

La navigation suit les principes de la documentation Shopify App nav : libellés courts, destinations regroupées, navigation persistante, état actif visible et adaptation mobile. Référence consultée le 12 octobre 2026 : https://shopify.dev/docs/api/app-home/v1.1/app-bridge-web-components/app-nav.

Suzanne est une application autonome, sans App Bridge ni dépendance au back-office Shopify. La structure est implémentée en React. Sur ordinateur, trois groupes séparent activités quotidiennes, exploration et personnalisation. Le compte et la famille restent en bas. Sur téléphone, quatre destinations fréquentes et un bouton Menu ouvrant une boîte de dialogue accessible remplacent la longue rangée de liens. Une recherche de destinations, accessible avec Ctrl/Cmd K, est disponible sur tous les formats. Elle ne cherche pas encore dans les documents personnels.

Actualités, lectures et studio restent accessibles par la recherche et le menu complet mobile ; ces espaces en préparation ne prennent plus de place dans la navigation principale. L'accès familial reste conditionné au rôle de responsable légal ; l'API conserve le contrôle d'autorisation.

Le nouveau personnage est une illustration SD manga originale. Cinq tenues sont incluses, ainsi que deux versions du logo et l'emblème étincelle. Les fichiers source PNG et les prompts sont dans `apps/web/public/brand/`. `suzanne-pack-v1.zip` contient seulement ces assets publics et une galerie autonome, jamais les fichiers `.local`.

Le vestiaire propose un mode saisonnier (Europe/Paris), une tenue fixe et le retour au portrait réaliste. Les préférences sont enregistrées sous une clé localStorage propre au profil. Elles ne contiennent pas de données scolaires et ne sont pas synchronisées avec le serveur. Si le stockage est indisponible, le look fonctionne pour la visite courante et un message le signale. L'illustration ne déclenche aucun appel payant. L'animation CSS reste facultative et respecte prefers-reduced-motion.

La vidéo parlante, les animations articulées, les expressions liées aux réponses pédagogiques et le déblocage de récompenses restent à développer. Cette collection est entièrement disponible : aucun achat, compteur fictif de monnaie ou récompense présenté comme acquis.
