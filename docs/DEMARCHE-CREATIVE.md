# Démarche créative

> **Sections à rédiger par l'étudiant, sans IA (DES-01, DES-02).** L'énoncé exige que le nom et le logo viennent de vous. Les parties marquées « À compléter » sont des gabarits vides : rien n'y a été inventé. La palette et les typographies reprennent la direction artistique déjà définie dans `doc/artistic-direction.md`.

## 1. Nom du site (DES-01)

**À compléter.**

- Noms envisagés (avec, pour chacun, pourquoi vous l'avez gardé ou écarté) :
  1. …
  2. …
  3. …
- Nom retenu et raison du choix : …
- Vérification d'originalité (recherches faites, résultats) : …

> Note : le nom de travail « CodeRacer » est déjà utilisé par un projet open source connu (« Code Racer » de WebDevCody). Il faudra le vérifier, et probablement en changer, avant de le déclarer original.

## 2. Logo (DES-02)

**À compléter.**

- Croquis papier ou tablette : ajouter les photos dans `docs/images/croquis/` et les afficher ici.
- Étapes de mise au propre (outil utilisé : Figma, Illustrator, Inkscape…) : …
- Fichier final : déposer le SVG dans `public/` et remplacer `src/app/favicon.ico` ; le logo est affiché dans la barre de navigation (`src/components/layout/Navbar.tsx`, actuellement un pneu provisoire dans `src/components/animated/TireIcon.tsx`).

## 3. Direction artistique (DES-03)

Thème : **« Arcade de classe vibrante »**. Un canevas clair et lisible pour la lecture, entouré de couleurs d'arcade très saturées, de lignes de vitesse et de formes « tactiles » (bordures épaisses, ombres franches, pilules).

### Moodboard

**À compléter** : 3 à 5 références (captures ou liens) et ce que chacune apporte. Pistes cohérentes avec la direction actuelle : bornes d'arcade des années 90, jeux de course jouet (Mario Kart), outils de frappe minimalistes (Monkeytype), quiz de classe (Kahoot).

| Référence | Ce qu'on en garde |
| --------- | ----------------- |
| …         | …                 |
| …         | …                 |
| …         | …                 |

### Palette

| Rôle             | Couleur                    | Usage                                                            |
| ---------------- | -------------------------- | ---------------------------------------------------------------- |
| Canevas          | `#F4F4ED` blanc cassé      | Fond clair, repos pour les yeux                                  |
| Texte principal  | `#111112` ardoise          | Texte et bordures (contraste élevé)                              |
| Appel à l'action | `#D2FF00` vert lime        | Boutons principaux et **progression du joueur local** uniquement |
| Coureur 1        | `#007BFF` bleu azur        | Adversaires, accents d'interface                                 |
| Coureur 2        | `#FF7A00` orange mandarine | Adversaires                                                      |
| Coureur 3        | `#D9008D` magenta arcade   | Adversaires                                                      |
| Coureur 4        | `#00BFA5` sarcelle         | Adversaires                                                      |

Ajustements pour l'accessibilité (A11Y-01), sans changer l'identité :

- `#0062CC` (azur foncé) derrière du texte blanc, car `#007BFF` n'offre que 3,97:1 ;
- texte foncé sur l'orange (le blanc n'atteint que 2,6:1) ;
- `#4DA3FF` pour le texte azur en thème sombre ;
- dans les graphiques, la même palette, validée pour le daltonisme ; en thème sombre, l'orange, le magenta et la sarcelle sont légèrement assombris (`#E06800`, `#C2007E`, `#00AC94`).

### Typographies

- **Nunito** (interface et menus) : sans empattement arrondie, énergique sans être enfantine pour des 12–17 ans.
- **JetBrains Mono** (zone de frappe) : chasse fixe nette qui distingue bien `0`/`O` et `1`/`l`, essentiel en course.

Les deux sont chargées en police variable par `next/font` (un seul fichier par famille).

### Langage de formes

- Bordures de 3 px, ombre portée franche `0 4px 0 #111112`, boutons en pilule.
- Seuls les éléments cliquables bougent au survol (soulèvement de 2 px) ; les cartes et conteneurs restent immobiles.
- Élément signature : **la piste** (voies en asphalte, ligne d'arrivée en damier, repères pointillés des bonus à 25/50/75 %, voitures colorées) ; le joueur local est toujours en lime avec un contour.

### Thèmes (DES-05)

Un thème clair et un thème sombre ; le thème du système est utilisé par défaut. Le thème sombre garde les mêmes accents sur un fond `#111112`.
