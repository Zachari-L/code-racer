# Cahier des charges — CodeRacer

## 1. Vision du produit

CodeRacer est une application web d'entraînement à la frappe au clavier qui transforme un exercice répétitif en compétition amicale. Elle s'adresse principalement aux élèves de 12 à 17 ans, ainsi qu'aux enseignants et à toute personne souhaitant améliorer sa vitesse et sa précision de frappe.

Le produit associe l'entraînement individuel, à la manière de Monkeytype, à l'animation d'un quiz multijoueur, à la manière de Kahoot. Tous les participants saisissent le même texte en temps réel, suivent la progression de la course et consultent leurs statistiques à la fin de la partie. L'objectif est de favoriser une pratique régulière tout en préservant la valeur pédagogique de l'exercice.

L'application sera disponible en français et en anglais, optimisée pour une utilisation sur ordinateur et déployée de manière sécurisée en HTTPS. **CodeRacer** est le nom retenu pour la production; l'identité visuelle sera confirmée lors de la direction artistique.

## 2. Glossaire

| Terme | Définition |
|---|---|
| Course | Session de frappe durant laquelle les participants saisissent un texte commun selon une configuration définie. |
| Hôte | Utilisateur qui crée une course et en gère les paramètres, les participants, le redémarrage et la clôture. |
| Participant | Utilisateur qui prend part activement à la frappe et dont la progression est prise en compte dans le classement. |
| Spectateur | Utilisateur présent dans une course sans y prendre part activement ni figurer au classement. |
| Invité | Utilisateur qui rejoint une course sous un pseudonyme, sans créer de compte permanent. |
| Course publique | Course visible et accessible selon les règles définies par l'application. |
| Course semi-publique | Course accessible au moyen d'un code fourni par l'hôte. |
| Course privée | Course accessible uniquement au moyen d'un lien d'invitation valide jusqu'à la fin de la course. |
| WPM | « Words per minute » (mots par minute), indicateur de vitesse de frappe. |
| Précision | Proportion de caractères saisis correctement par rapport au nombre total de caractères saisis. |
| Pénalité | Temps ajouté au résultat ou autre effet négatif appliqué après une erreur de saisie. |
| Heatmap | Représentation visuelle des touches associées aux erreurs les plus fréquentes. |
| Bot | Participant contrôlé par l'application, dont la vitesse et le taux d'erreur dépendent du niveau choisi. |

## 3. Exigences fonctionnelles et techniques

### 3.1 Authentification et utilisateurs

- **AUTH-1 :** L'utilisateur peut créer un compte standard à l'aide d'un nom d'utilisateur et d'un mot de passe.
- **AUTH-2 :** La connexion privilégie les services tiers Discord et GitHub.
- **AUTH-3 :** Un invité peut participer à une course sous un pseudonyme, sans compte permanent, mais ne peut pas en créer ni en héberger une.
- **AUTH-4 :** Un utilisateur connecté dispose d'un profil présentant ses statistiques personnelles (nombre de courses, WPM moyen et précision moyenne) ainsi que l'historique des résultats de chacune de ses courses.
- **AUTH-5 :** La récupération de mot de passe est exclue du périmètre de la première version.
- **AUTH-6 :** Si sa course est toujours en cours, un utilisateur déconnecté retrouve son état à sa reconnexion.

### 3.2 Courses et accès

- **COURSE-1 :** Tout utilisateur, enseignant ou étudiant, peut créer et héberger une course. Les invités peuvent uniquement participer à une course.
- **COURSE-2 :** Une course multijoueur requiert au moins deux participants actifs et accueille au maximum 100 joueurs dans la première version.
- **COURSE-3 :** Une course peut être publique, semi-publique (accessible par un code numérique à 6 chiffres, saisissable ou scannable au moyen d'un QR code facultatif) ou privée (accessible uniquement par un lien d'invitation valide jusqu'à la fin de la course).
- **COURSE-4 :** La page d'accueil met en évidence le bouton « Rejoindre rapidement », qui permet d'intégrer une course en attente ou propose d'en créer une.
- **COURSE-5 :** Toute personne qui rejoint une course avant son départ devient participante par défaut, mais peut choisir de rejoindre comme spectatrice. Toute personne qui rejoint après le départ devient spectatrice.
- **COURSE-6 :** Un participant peut quitter volontairement une course en cours.
- **COURSE-7 :** Après 30 secondes d'inactivité, un participant est automatiquement retiré. Ce délai pourra être réglable dans les options avancées.
- **COURSE-8 :** L'hôte peut exclure un participant.
- **COURSE-9 :** L'hôte choisit la langue de la course; par défaut, celle-ci correspond à la langue de son interface.
- **COURSE-10 :** Après une courte déconnexion, l'hôte peut rejoindre de nouveau sa course et retrouver son rôle. S'il quitte définitivement la course, l'hôte peut désigner un successeur avant son départ; sinon, le participant présent depuis le plus longtemps devient le nouvel hôte.

### 3.3 Configuration et déroulement

- **CONFIG-1 :** L'hôte choisit la source du texte : phrases, mots mélangés, texte importé ou thème prédéfini.
- **CONFIG-2 :** Les textes générés s'adaptent à la langue, au thème, à la longueur et au niveau de difficulté choisis.
- **CONFIG-3 :** L'application propose plusieurs thèmes prédéfinis. C#, Java et Molière sont des exemples, non une liste exhaustive.
- **CONFIG-4 :** L'hôte peut régler la longueur du texte, la présence d'accents et de ponctuation, la longueur des mots et les caractères à exclure.
- **CONFIG-5 :** L'application estime la difficulté à partir des paramètres choisis.
- **CONFIG-6 :** L'hôte peut définir une durée maximale. La course se termine à l'expiration du délai ou lorsque tous les participants ont terminé.
- **CONFIG-7 :** Un compte à rebours visuel précède chaque course.
- **CONFIG-8 :** En mode strict, toute erreur doit être corrigée avant de poursuivre. En mode permissif, les erreurs sont autorisées et entraînent une pénalité.
- **CONFIG-9 :** Les participants peuvent consulter la configuration de la course, mais ne peuvent pas la modifier.
- **CONFIG-10 :** Le collage de texte est bloqué dans la zone de saisie pendant la course.
- **CONFIG-11 :** Chaque texte généré aléatoirement est propre à sa course et renouvelé au lancement d'une nouvelle course.
- **CONFIG-12 :** Avant le démarrage, l'hôte peut modifier les paramètres de la course. Les participants voient les changements en temps réel, sans pouvoir les modifier.

### 3.4 Compétition et statistiques

- **PLAY-1 :** Tous les participants saisissent simultanément le même texte et voient la progression de la course en temps réel.
- **PLAY-2 :** L'écran de course affiche au minimum le rang, la progression, la vitesse instantanée et l'état des autres participants.
- **PLAY-3 :** Un signal sonore, désactivable, peut annoncer le dépassement d'un autre participant.
- **PLAY-4 :** L'écran de fin affiche un podium et le classement complet.
- **PLAY-5 :** Chaque participant consulte son WPM, sa précision, son nombre d'erreurs, sa durée et son rang.
- **PLAY-6 :** Les résultats mettent en évidence des statistiques globales, comme les meilleures vitesses et précisions.
- **PLAY-7 :** Une heatmap du clavier indique les touches associées aux erreurs.
- **PLAY-8 :** L'hôte peut redémarrer la course ou y mettre fin.
- **PLAY-9 :** Les résultats des utilisateurs connectés sont conservés et consultables après chaque course ainsi que dans l'historique de leur profil. Les invités ne consultent que les résultats de leur session en cours.
- **PLAY-10 :** L'application propose un système de progression comprenant des récompenses ou des badges.

### 3.5 Bots et fonctionnalités bonus

- **BOT-1 :** L'hôte peut ajouter des bots à une course.
- **BOT-2 :** Quatre niveaux de difficulté sont proposés : facile, moyen, difficile et impossible.
- **BOT-3 :** La vitesse et le taux d'erreur des bots varient légèrement.
- **BONUS-1 :** Des bonus de rattrapage inspirés de Mario Kart aident les participants en difficulté à garder une chance de revenir dans la course. Leurs effets précis restent à définir.
- **BONUS-2 :** Les équipes, les objectifs de vitesse et le mode « mort subite » sont exclus du périmètre minimal.

### 3.6 Interface et technique

- **UI-1 :** L'application propose un thème clair et un thème sombre.
- **UI-2 :** L'interface est adaptative; l'expérience de frappe est optimisée pour un clavier physique.
- **UI-3 :** L'interface est lisible, dynamique et adaptée aux jeunes de 12 à 17 ans.
- **TECH-1 :** Le frontend utilise exclusivement React, Next.js et TypeScript.
- **TECH-2 :** Les styles sont réalisés avec Tailwind CSS.
- **TECH-3 :** Les données persistantes sont stockées dans PostgreSQL. Le choix de l'ORM est laissé à l'équipe.
- **TECH-4 :** Le projet est versionné sur GitHub et déployé sur Fly.io en HTTPS.
- **TECH-5 :** Le projet comprend une documentation complète pour le démarrage et l'utilisation.
- **TECH-6 :** Des tests unitaires, d'intégration et de bout en bout couvrent les parcours principaux.
- **TECH-7 :** Une GitHub Action exécute automatiquement les tests et les vérifications de qualité.

## 4. Décisions et limites

### Capacité et modes de jeu

- **Capacité :** la demande évoque à la fois un nombre illimité de joueurs et une limite de 100. La première version sera plafonnée à 100 joueurs; les performances seront mesurées avant toute hausse.
- **Mode solo :** bien qu'une course multijoueur exige au moins deux participants, l'entraînement individuel reste possible contre des bots ou dans un mode d'entraînement distinct.
- **Bonus :** les bonus de rattrapage aident les participants en difficulté à conserver une chance de revenir dans la course; leurs effets précis restent à définir.

### Rôles et accès

- **Arrivée en cours de partie :** avant le départ, une personne rejoint comme participante par défaut, mais peut choisir le statut de spectateur. Après le départ, toute nouvelle arrivée est spectatrice.
- **Visibilité :** « publique » décrit la visibilité d'une course, tandis que le code ou le lien définissent ses modalités d'accès.
- **Rôle des enseignants :** les enseignants et les étudiants sont des utilisateurs standards; tous peuvent héberger une course. Aucun espace ou rôle enseignant distinct n'est prévu dans la première version.
- **Invités :** un invité peut rejoindre et jouer une course, mais ne peut pas en créer ni en héberger une.
- **Accès semi-public :** le code est numérique et comporte 6 chiffres. Un QR code peut être proposé en complément du code.
- **Accès privé :** la course se rejoint uniquement par son lien d'invitation, qui reste valide jusqu'à la fin de la course.
- **Départ de l'hôte :** après une courte déconnexion, l'hôte peut revenir dans la course. S'il la quitte, il peut désigner un successeur avant son départ; à défaut, le participant présent depuis le plus longtemps hérite du rôle d'hôte.

### Comptes, données et reconnexion

- **Reconnexion :** l'état des participants et de l'hôte est conservé pendant une courte déconnexion, tant que la course est en cours.
- **Liaison des comptes :** les règles de fusion entre comptes locaux et comptes Discord ou GitHub ne sont pas définies. La première version privilégiera la connexion sociale.
- **Statistiques des invités :** elles ne sont conservées que pendant la session en cours.

## 5. Questions en attente de validation

- Lorsqu'un invité crée un compte, faut-il rattacher à son nouveau compte les statistiques enregistrées pendant sa session en tant qu'invité ?

## 6. Hypothèses de travail

- **Rôles :** un enseignant est considéré comme un utilisateur standard pouvant héberger une course. Aucun rôle distinct n'est nécessaire dans la première version.
- **Protection des mineurs :** aucune donnée personnelle identifiable, autre qu'un pseudonyme, n'est affichée publiquement.
- **Réseau :** une connexion persistante synchronise la progression; une courte déconnexion est tolérée et l'utilisateur peut retrouver son état tant que la course est en cours.
- **Contenus :** les textes intégrés sont validés à l'avance. Les textes importés utilisent un format simple.
- **Mobile :** les appareils mobiles permettent principalement de consulter les résultats; la frappe est optimisée pour un ordinateur et un clavier physique.
- **Difficulté :** l'indicateur est relatif et explicable, et non une mesure scientifique.
- **Redémarrage :** une relance crée une nouvelle course tout en conservant les résultats de la précédente.

## 7. Priorisation des livrables

### Essentiel — version minimale

- Mise en ligne de l'application et boucle multijoueur complète : créer une course, la rejoindre et jouer.
- Authentification Discord ou GitHub et accès invité.
- Création d'un salon et accès au moyen d'un code.
- Course multijoueur synchronisée en temps réel.
- Interface de frappe avec compte à rebours et blocage du collage.
- Classement en direct et statistiques de fin de partie essentielles.
- Reconnexion simple après une courte déconnexion.
- Interface en français.
- PostgreSQL.
- Tests de la boucle principale, documentation et GitHub Actions.

### Souhaitable

- Compte local et interface anglaise.
- Gestion complète des accès publics, semi-publics et privés.
- Configuration avancée et génération aléatoire des textes, avec estimation de difficulté.
- Bots, heatmap du clavier et badges.
- Signal sonore désactivable, thèmes clair et sombre et statistiques globales.
- Bonus et pénalités de rattrapage.
- Tests de bout en bout étendus.

### Moins prioritaire — évolutions ultérieures

- Équipes, objectifs de vitesse et mode « mort subite ».
- Import avancé et modération avancée.

La première version doit démontrer que la boucle « rejoindre, taper ensemble, suivre la progression et obtenir un résultat » est fiable et agréable. Les fonctionnalités avancées ne doivent pas retarder cet objectif.
