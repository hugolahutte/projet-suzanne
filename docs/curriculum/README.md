# Programmes scolaires français — référentiel Suzanne

Vérifié le **12 octobre 2026**, pour **l’année scolaire 2026–2027**. Sources exclusivement ministère de l’Éducation nationale et Éduscol. Ce dossier contient des programmes officiels et un catalogue documentaire, pas des cours Suzanne déjà rédigés ni un moteur de suivi des compétences.

## Fichiers

- `packages/curriculum/catalog.json` : catalogue JSON destiné à l’application, 308 entrées (280 programmes/versions et 28 index) par matière, classe et version ; certaines entrées pointent vers un index.
- `docs/curriculum/sources/` : PDF officiels téléchargés, sans modification.
- `docs/curriculum/documents.json` : liste des 166 documents à télécharger, avec URL officielle.
- `docs/curriculum/manifest.json` : provenance, date de récupération, taille et empreinte SHA-256 de chaque PDF.
- `packages/curriculum/build_catalog.py` : source éditable du catalogue, sans réseau ; `extend_catalog.py` et `lycee_sources.json` contiennent l’extension lycée et langues.
- `docs/curriculum/download_sources.py` : téléchargement explicite des seuls PDF répertoriés ; nécessite un accès réseau.
- `packages/curriculum/validate_catalog.py` : intégrité du catalogue, fichiers et cas de transition.

## Couverture exacte

**CM2 et collège** : français, mathématiques, histoire-géographie, sciences et technologie du cycle 3, physique-chimie, SVT, technologie du cycle 4, arts plastiques, éducation musicale, histoire des arts, EPS, EMC, EVAR/EVARS, EMI au cycle 4. Les PDF de cycle regroupent plusieurs matières : l’application doit sélectionner les sections encore applicables, pas traiter le PDF entier comme le programme courant de toutes les matières.

**Langues vivantes étrangères** : anglais CM2, collège et lycée GT ; les 25 annexes de langues vivantes du BO de 2025 sont téléchargées (collège/lycée : anglais, allemand, arabe, chinois, espagnol, hébreu, italien, japonais, néerlandais, portugais, russe ; polonais au lycée ; cadres pour les langues à faible diffusion). Les anciens programmes de cycle restent référencés pour les classes concernées par le déploiement progressif. Les langues régionales ne sont pas intégrées.

**Langues anciennes et spécialités de langues** : latin et grec au collège, français et culture antique en sixième, options LCA et spécialités LLCA au lycée, programme limitatif LLCA 2026–2028. LLCER anglais, allemand, espagnol, italien, portugais : programmes permanents de première et terminale et œuvres imposées 2025–2027 en première / 2026–2028 en terminale. Anglais monde contemporain : première et terminale. LSF L1 et L2 : options du lycée. Les textes LCA du collège et des œuvres LLCA sont publiés intégralement en HTML au BO et référencés sans copie locale.

**Lycée général et enseignements communs technologiques** : français et œuvres de première 2026–2027, histoire-géographie, mathématiques (versions 2026 et transition terminale 2027), enseignement scientifique, philosophie, EPS commun/option/spécialité EPPCS, EMC, EVARS, SNT, SES, physique-chimie et SVT de seconde. Spécialités : HGGSP, HLP, mathématiques, physique-chimie, SVT, SES, NSI, SI avec complément de sciences physiques, EPPCS, LLCER/LLCA et arts. Options complémentaires : mathématiques complémentaires/expertes, DGEMC, sciences et laboratoire et options technologiques ci-dessous.

**Arts** : les cinq annexes communes aux disciplines sont téléchargées : option seconde, option première/cycle terminal, option terminale, spécialité première/cycle terminal, spécialité terminale. Elles couvrent arts plastiques, cinéma-audiovisuel, danse, histoire des arts, musique, théâtre, ainsi que cirque en seconde et en spécialité. **Attention** : dans les annexes de première/cycle terminal, seule la musique couvre la terminale ; les autres disciplines de terminale se trouvent dans leur annexe distincte. Les documents annuels ou limitatifs applicables en 2026–2027 sont intégrés pour cirque, cinéma-audiovisuel, danse, histoire des arts, musique, théâtre et arts plastiques. Les nouvelles œuvres de danse terminale ne s’appliquent qu’en 2027.

**Sept séries technologiques de l’Éducation nationale** :

| Série | Programmes spécifiques récupérés |
|---|---|
| ST2S | Option santé et social ; biologie et physiopathologie humaines ; physique-chimie pour la santé ; sciences et techniques sanitaires et sociales ; chimie-biologie-physiopathologie humaines |
| STL | Option biotechnologie ; biochimie-biologie ; biotechnologies ; sciences physiques et chimiques en laboratoire ; physique-chimie et mathématiques ; biochimie-biologie-biotechnologies |
| STD2A | Option création et culture design ; physique-chimie ; outils et langages numériques ; design et métiers d’arts ; analyse et méthodes en design ; conception et création en design et métiers d’arts |
| STI2D | Options création et innovation technologique / sciences de l’ingénieur ; innovation technologique ; ingénierie et développement durable ; ingénierie, innovation et développement durable (enseignements spécifiques dans l’annexe) ; physique-chimie et mathématiques |
| STMG | Option management et gestion ; sciences de gestion et numérique ; management ; droit et économie ; management, sciences de gestion et numérique (enseignements spécifiques dans l’annexe) |
| STHR | Seconde spécifique : sciences, mathématiques, économie et gestion hôtelière, sciences et technologies culinaires / des services ; cycle terminal : enseignement scientifique alimentation-environnement, sciences et technologies culinaires / des services, économie et gestion hôtelière |
| S2TMD | Option culture et pratique de la danse, musique ou théâtre ; économie, droit et environnement du spectacle vivant ; culture et sciences chorégraphiques, musicales ou théâtrales et pratique correspondante |

**Volume vérifié** : 166 fichiers PDF, 98 350 105 octets (93,79 Mio), 3 336 pages. Les 28 index officiels restent disponibles comme portes d’entrée et pour la maintenance. Un PDF regroupant plusieurs matières ou niveaux est téléchargé une fois ; les entrées sont des références documentaires, pas une liste atomisée de compétences. Des éditions différentes peuvent partager le même contenu. Les programmes publiés uniquement en HTML (notamment certains programmes limitatifs de danse, histoire des arts et français) sont liés, pas convertis artificiellement en PDF.

**Exclusions exactes** : lycée professionnel et CAP ; STAV et spécialité biologie-écologie de l’enseignement agricole ; langues et littératures régionales ; sections internationales/BFI et binationales ; adaptations territoriales ; enseignements spécifiques LSF au collège ; dispositions détaillées d’examen et rotations de sujets HGGSP ; repères annuels détaillés du primaire/collège ; annales et ensemble des ressources d’accompagnement. Les programmes futurs du cycle 3 concernant d’abord le CM1 en 2026 ne constituent pas le corpus CM2/6e courant. Le catalogue ne promet donc pas l’exhaustivité de toutes les formations et de toutes les situations particulières du système français. Aucun profil familial réel n’est enregistré ici.

## Calendrier à respecter

Les synthèses officielles de rentrée font autorité pour choisir la version : [cycle 3](https://eduscol.education.gouv.fr/4356/enseigner-au-cycle-3), [cycle 4](https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4).

| Domaine | Applicable en 2026–2027 |
|---|---|
| Français et mathématiques CM2 / 6e | Programmes de 2025 ; CM2 depuis 2026, 6e depuis 2025 |
| Français et mathématiques 5e | Programmes de 2026 |
| Français et mathématiques 4e / 3e | Programmes de 2020 ; bascule respectivement en 2027 / 2028 |
| Anglais 6e / 5e | Programme de 2025, appliqué respectivement depuis 2025 / 2026 |
| Anglais 4e / 3e | Programme de cycle 2020 ; nouveau respectivement en 2027 / 2028 |
| Anglais lycée GT | Nouveau programme à tous les niveaux ; seconde depuis 2025, première et terminale depuis 2026 |
| Anglais CM2 | Ancien programme de cycle 3, le nouveau CM2 étant prévu en 2027 |
| Histoire-géographie, EPS, sciences du CM2 / 6e | Versions antérieures encore applicables ; les nouveaux programmes du cycle 3 affichés en 2026 concernent d’abord le CM1 |
| Technologie cycle 4 | Programme 2024 déployé dans toutes les classes en 2026 |
| EMC | Nouveau programme 2024 déployé au collège et au lycée entiers en 2026 ; CM2 depuis 2025 |
| Mathématiques lycée | Nouveaux programmes 2026 en seconde/première ; anciens programmes en terminale jusqu’à la rentrée 2027. Mathématiques expertes reste distinct |
| Danse, spécialité | Nouveau programme limitatif en première en 2026, en terminale seulement en 2027 |

La [page officielle de mathématiques lycée](https://eduscol.education.gouv.fr/5817/programmes-et-ressources-en-mathematiques-voie-gt) distingue les rentrées 2026 et 2027. Le [BO langues vivantes de 2025](https://www.education.gouv.fr/bo/2025/Hebdo22/MENE2504621A) précise le calendrier par classe. Les [programmes LCA du lycée](https://eduscol.education.gouv.fr/5808/programmes-et-ressources-en-langues-et-cultures-de-l-antiquite-voie-gt) distinguent programmes permanents et œuvres imposées ; les [ressources LLCER](https://eduscol.education.gouv.fr/5814/programmes-et-ressources-en-langues-litteratures-et-cultures-etrangeres-et-regionales-voie-g) font de même.

## Contrat JSON et utilisation

L’objet racine expose `schemaVersion`, `schoolYear`, `checkedAt`, `jurisdiction`, `dateConvention`, `coverage` et `entries`. Une entrée possède `id`, `title`, `subject`, `levels`, `track`, `sourceUrl`, `effectiveFrom`, `effectiveTo`, `status`, `notes`, `checkedAt`, `sourceKind`. Les PDF possèdent aussi `documentId` et `documentUrl`. Les dates inconnues ou non normalisées valent `null`.

- Niveaux canoniques : `CM2`, `6e`, `5e`, `4e`, `3e`, `2de`, `1re`, `Tle`.
- `current` : applicable aux classes indiquées lors de la vérification.
- `transition` : version ancienne encore valable ou version future publiée ; **toujours vérifier les bornes**, ne jamais filtrer uniquement sur le statut.
- `reference` : porte d’entrée officielle dont les programmes détaillés ne sont pas normalisés.
- `sourceKind: index` : lien documentaire, pas un ensemble de compétences exploitable automatiquement.
- Les dates sont normalisées au **1er septembre de la rentrée concernée**, ce ne sont pas les dates exactes de reprise des cours. Les bornes sont inclusives. Pour quelques documents anciens couvrant première et terminale ensemble, la borne commune correspond à la fin du déploiement (2020, ou 2017 pour STHR), et ne reconstitue pas l’historique antérieur de la première. Ce catalogue cible 2026–2027, pas toutes les années passées.
- Pour une année de référence, sélectionner les niveaux/voies pertinents puis `effectiveFrom <= date` et `effectiveTo == null || effectiveTo >= date`. Afficher séparément les index. Distinguer matières communes, options et spécialités : un même sujet peut avoir plusieurs programmes légitimes.
- La validation couvre 2026–2027. Une fin absente signifie « pas de fin normalisée », jamais « immuable ». Avant toute autre rentrée, revoir les BO et les pages de synthèse.

Pour passer de ce catalogue à un tutorat scolaire fiable : extraire chaque document par section/page, rattacher les compétences à la bonne classe/version, vérifier ces rattachements, puis créer et relire les activités. Un texte généré doit conserver sa provenance et ne pas être présenté comme une citation ministérielle.

## Vérification et maintenance

Depuis la racine :

```sh
python3 packages/curriculum/build_catalog.py
python3 docs/curriculum/download_sources.py
python3 packages/curriculum/validate_catalog.py
```

Le téléchargement vérifie HTTP et la signature PDF ; les fichiers déjà présents dont l’empreinte correspond au manifeste sont réutilisés. La validation indépendante recalcule les empreintes et contrôle les bascules 2026/2027/2028 de français, mathématiques et anglais, les mathématiques du lycée et les dates EPS/LSF. Les 166 PDF ont aussi été ouverts par un analyseur PDF (3 336 pages), sans erreur ; cela vérifie leur lisibilité technique, pas une extraction pédagogique intégrale. Les sources sont publiques ; les PDF sont conservés comme références officielles, sans suppression de leurs mentions. Les scans de livres/devoirs et les contenus privés doivent rester dans un stockage familial distinct de ce corpus public.
