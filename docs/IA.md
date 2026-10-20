# Utilisation de l'IA

> Brouillon factuel. Les sections 1 à 3 décrivent ce qui s'est réellement passé pendant le développement. **La section 4 (réflexion) doit être écrite par l'étudiant.** Relisez et ajustez le tout : vous restez responsable de chaque ligne remise.

## 1. Agents et outils

- **Claude Code** (modèle Claude Opus) en terminal : refactorisations, moteur de jeu, serveur temps réel, interface, tests, documentation. L'agent exécutait lui-même `typecheck`, `lint`, les tests unitaires, la build et Playwright avant chaque commit.
- **Playwright** piloté par l'agent pour parcourir l'application dans un vrai navigateur (captures d'écran, mesure de fluidité de la piste).
- **Lighthouse** pour la performance et l'accessibilité de la page d'accueil.
- Le validateur de palette d'une compétence (skill) de visualisation de données, pour vérifier les couleurs des graphiques contre le daltonisme.
- **Gemini** : un fichier `GEMINI.md` est présent dans le dépôt (à préciser par l'étudiant s'il a servi).

## 2. Fichiers d'instructions d'agent

Tous sont commités :

- `AGENTS.md` (repris par `CLAUDE.md` et `GEMINI.md`) : pile technique, conventions (Server Components par défaut, Server Actions avec Zod et réponse normalisée, singleton Prisma), direction artistique, règles de course (coller interdit, protection des mineurs), commandes de vérification.
- `.agents/skills/*/SKILL.md` : guides par domaine (style, conventions de code, base de données, moteur de course, tests).

## 3. Situations où l'IA s'est trompée

### 3.1 Un commit avec un test en échec

L'agent enchaînait `bun test … | grep … && git commit`. Le `grep` réussissait même quand un test échouait, donc le commit est passé avec un test rouge (règle de « partie rapide »). **Détection** : la sortie affichait `1 fail` juste au-dessus du message de commit. **Correction** : le test était faux (le code choisissait correctement la salle avec le moins de places libres) ; il a été corrigé et le commit refait. Ensuite, un script de vérification qui s'arrête à la première erreur (`set -e`) a été utilisé avant chaque commit.

### 3.2 Une constante exportée d'un module client utilisée côté serveur

L'agent a exporté le script anti-flash du thème (puis les variantes de bouton) depuis un fichier `"use client"` et l'a importé dans le layout racine, un Server Component. Next.js remplace alors l'export par une « référence client », pas par la chaîne attendue. **Détection** : relecture du code à l'écriture, avant que le bogue n'arrive en production. **Correction** : ces valeurs ont été déplacées dans des modules sans `"use client"` (`src/lib/theme.ts`, `src/components/ui/button-variants.ts`).

### 3.3 La reconnexion perdait le texte tapé

Le serveur renvoie l'état du joueur avant l'instantané de la salle quand on recharge la page. Le réducteur côté client considérait ce premier instantané comme « une nouvelle course » et effaçait l'état ; la zone de frappe ignorait aussi son état initial. **Détection** : le test de bout en bout « recharger la page en pleine course » échouait (curseur revenu à 0 au lieu de la moitié du texte). **Correction** : l'état personnel vit maintenant dans le réducteur, n'est remis à zéro que lorsqu'une course en remplace une autre, et initialise la zone de frappe ; un test unitaire couvre cet ordre de messages.

Autres erreurs repérées en cours de route : des bots environ 25 % plus lents que les plages visées (corrigé par une calibration après mesure sur 40 graines), un commit qui embarquait par erreur des suppressions de fichiers déjà indexées (commits refaits), et une barre de navigation qui débordait de 210 px à 360 px de large (révélé par un test Playwright).

## 4. Réflexion sur le travail avec les agents

**À rédiger par l'étudiant** (quelques paragraphes) : ce qui a bien fonctionné, ce qui demandait le plus de vérification, comment vous avez relu le code produit, ce que vous feriez autrement.
