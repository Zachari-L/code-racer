/**
 * Public-domain passages for coherent texts (CONF-03). The seed grades each one
 * with `classifyPassage`, so complexity always follows the documented metrics.
 */

import type { Locale } from "../../src/lib/i18n";

export interface PassageSeed {
  id: string;
  language: Locale;
  title: string;
  author: string;
  content: string;
}

export const PASSAGES: readonly PassageSeed[] = [
  // ----- Français -----
  {
    id: "fr-clair-de-la-lune",
    language: "fr",
    title: "Au clair de la lune",
    author: "Chanson traditionnelle",
    content:
      "Au clair de la lune, mon ami Pierrot, prête-moi ta plume pour écrire un mot. Ma chandelle est morte, je n'ai plus de feu. Ouvre-moi ta porte pour l'amour de Dieu.",
  },
  {
    id: "fr-frere-jacques",
    language: "fr",
    title: "Frère Jacques",
    author: "Chanson traditionnelle",
    content:
      "Frère Jacques, frère Jacques, dormez-vous ? Dormez-vous ? Sonnez les matines, sonnez les matines. Ding, dang, dong. Ding, dang, dong.",
  },
  {
    id: "fr-corbeau-renard",
    language: "fr",
    title: "Le Corbeau et le Renard",
    author: "Jean de La Fontaine",
    content:
      "Maître Corbeau, sur un arbre perché, tenait en son bec un fromage. Maître Renard, par l'odeur alléché, lui tint à peu près ce langage : « Hé ! bonjour, Monsieur du Corbeau. Que vous êtes joli ! que vous me semblez beau ! Sans mentir, si votre ramage se rapporte à votre plumage, vous êtes le Phénix des hôtes de ces bois. »",
  },
  {
    id: "fr-cigale-fourmi",
    language: "fr",
    title: "La Cigale et la Fourmi",
    author: "Jean de La Fontaine",
    content:
      "La Cigale, ayant chanté tout l'été, se trouva fort dépourvue quand la bise fut venue : pas un seul petit morceau de mouche ou de vermisseau. Elle alla crier famine chez la Fourmi sa voisine, la priant de lui prêter quelque grain pour subsister jusqu'à la saison nouvelle.",
  },
  {
    id: "fr-lievre-tortue",
    language: "fr",
    title: "Le Lièvre et la Tortue",
    author: "Jean de La Fontaine",
    content:
      "Rien ne sert de courir ; il faut partir à point. Le Lièvre et la Tortue en sont un témoignage. « Gageons, dit celle-ci, que vous n'atteindrez point sitôt que moi ce but. »",
  },
  {
    id: "fr-chaperon-rouge",
    language: "fr",
    title: "Le Petit Chaperon rouge",
    author: "Charles Perrault",
    content:
      "Il était une fois une petite fille de village, la plus jolie qu'on eût su voir ; sa mère en était folle, et sa mère-grand plus folle encore. Cette bonne femme lui fit faire un petit chaperon rouge, qui lui seyait si bien, que partout on l'appelait le Petit Chaperon rouge.",
  },
  {
    id: "fr-demain-des-l-aube",
    language: "fr",
    title: "Demain, dès l'aube",
    author: "Victor Hugo",
    content:
      "Demain, dès l'aube, à l'heure où blanchit la campagne, je partirai. Vois-tu, je sais que tu m'attends. J'irai par la forêt, j'irai par la montagne. Je ne puis demeurer loin de toi plus longtemps.",
  },
  {
    id: "fr-miserables-myriel",
    language: "fr",
    title: "Les Misérables",
    author: "Victor Hugo",
    content:
      "En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C'était un vieillard d'environ soixante-quinze ans ; il occupait le siège de Digne depuis 1806.",
  },
  {
    id: "fr-tour-du-monde",
    language: "fr",
    title: "Le Tour du monde en quatre-vingts jours",
    author: "Jules Verne",
    content:
      "En l'année 1872, la maison portant le numéro 7 de Saville-row, Burlington Gardens, maison dans laquelle Sheridan mourut en 1814, était habitée par Phileas Fogg, esq., l'un des membres les plus singuliers et les plus remarqués du Reform-Club de Londres, bien qu'il semblât prendre à tâche de ne rien faire qui pût attirer l'attention.",
  },
  {
    id: "fr-horla",
    language: "fr",
    title: "Le Horla",
    author: "Guy de Maupassant",
    content:
      "Quelle journée admirable ! J'ai passé toute la matinée étendu sur l'herbe, devant ma maison, sous l'énorme platane qui la couvre, l'abrite et l'ombrage tout entière.",
  },
  {
    id: "fr-avare",
    language: "fr",
    title: "L'Avare",
    author: "Molière",
    content:
      "Au voleur ! au voleur ! à l'assassin ! au meurtrier ! Justice, juste Ciel ! je suis perdu, je suis assassiné, on m'a coupé la gorge, on m'a dérobé mon argent.",
  },
  {
    id: "fr-discours-methode",
    language: "fr",
    title: "Discours de la méthode",
    author: "René Descartes",
    content:
      "Le bon sens est la chose du monde la mieux partagée : car chacun pense en être si bien pourvu, que ceux même qui sont les plus difficiles à contenter en toute autre chose n'ont point coutume d'en désirer plus qu'ils en ont.",
  },
  // ----- English -----
  {
    id: "en-jack-and-jill",
    language: "en",
    title: "Jack and Jill",
    author: "Nursery rhyme",
    content:
      "Jack and Jill went up the hill to fetch a pail of water. Jack fell down and broke his crown, and Jill came tumbling after.",
  },
  {
    id: "en-hey-diddle-diddle",
    language: "en",
    title: "Hey Diddle Diddle",
    author: "Nursery rhyme",
    content:
      "Hey diddle diddle, the cat and the fiddle, the cow jumped over the moon. The little dog laughed to see such sport, and the dish ran away with the spoon.",
  },
  {
    id: "en-twinkle",
    language: "en",
    title: "The Star",
    author: "Jane Taylor",
    content:
      "Twinkle, twinkle, little star, how I wonder what you are! Up above the world so high, like a diamond in the sky.",
  },
  {
    id: "en-alice",
    language: "en",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    content:
      'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"',
  },
  {
    id: "en-tom-sawyer",
    language: "en",
    title: "The Adventures of Tom Sawyer",
    author: "Mark Twain",
    content:
      '"Tom!" No answer. "Tom!" No answer. "What\'s gone with that boy, I wonder? You TOM!" No answer.',
  },
  {
    id: "en-moby-dick",
    language: "en",
    title: "Moby-Dick",
    author: "Herman Melville",
    content:
      "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
  },
  {
    id: "en-two-cities",
    language: "en",
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    content:
      "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.",
  },
  {
    id: "en-pride-prejudice",
    language: "en",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    content:
      "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
  },
  {
    id: "en-frankenstein",
    language: "en",
    title: "Frankenstein",
    author: "Mary Shelley",
    content:
      "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.",
  },
  {
    id: "en-war-of-the-worlds",
    language: "en",
    title: "The War of the Worlds",
    author: "H. G. Wells",
    content:
      "No one would have believed in the last years of the nineteenth century that this world was being watched keenly and closely by intelligences greater than man's and yet as mortal as his own.",
  },
  {
    id: "en-gettysburg",
    language: "en",
    title: "Gettysburg Address",
    author: "Abraham Lincoln",
    content:
      "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.",
  },
  {
    id: "en-tortoise-hare",
    language: "en",
    title: "The Hare and the Tortoise",
    author: "Aesop (tr. G. F. Townsend)",
    content:
      'A Hare one day ridiculed the short feet and slow pace of the Tortoise, who replied, laughing: "Though you be swift as the wind, I will beat you in a race."',
  },
];
