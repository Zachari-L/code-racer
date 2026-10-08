import { prisma } from "../src/lib/prisma";

const SAMPLE_TEXTS = [
  {
    title: "Molière — L'Avare",
    content:
      "Au voleur ! au voleur ! à l'assassin ! au meurtrier ! Justice, juste Ciel ! je suis perdu, je suis assassiné, on m'a coupé la gorge, on m'a dérobé mon argent.",
    language: "fr",
    category: "moliere",
    difficulty: "MEDIUM",
  },
  {
    title: "Code TypeScript — Algorithme de Course",
    content:
      "function updatePosition(progress: number, wpm: number): { x: number; y: number } { return { x: progress * 10, y: Math.sin(progress) * 2 }; }",
    language: "fr",
    category: "code",
    difficulty: "HARD",
  },
  {
    title: "Citation — Motivation et Persévérance",
    content:
      "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte pour franchir la ligne d'arrivée.",
    language: "fr",
    category: "quotes",
    difficulty: "EASY",
  },
  {
    title: "Phrases d'échauffement",
    content:
      "Portez ce vieux whisky au juge blond qui fume. Les bolides vrombissent sur l'asphalte tandis que le départ est donné.",
    language: "fr",
    category: "sentences",
    difficulty: "MEDIUM",
  },
  {
    title: "Python Code — Async Racing Loop",
    content:
      "async def start_countdown(seconds: int):\n    for s in range(seconds, 0, -1):\n        await broadcast({'event': 'tick', 'remaining': s})",
    language: "en",
    category: "code",
    difficulty: "HARD",
  },
];

const INITIAL_BADGES = [
  {
    code: "FIRST_RACE",
    name: "Premier Tour de Piste",
    description: "Terminer sa toute première course sur CodeRacer.",
    iconName: "flag",
  },
  {
    code: "SPEED_DEMON_50",
    name: "Bolide 50 WPM",
    description: "Atteindre une vitesse de 50 mots par minute dans une course.",
    iconName: "zap",
  },
  {
    code: "SPEED_DEMON_100",
    name: "Supersonique 100 WPM",
    description: "Franchir la barre légendaire des 100 mots par minute.",
    iconName: "flame",
  },
  {
    code: "PERFECT_ACCURACY",
    name: "Précision Chirurgicale",
    description: "Terminer une course avec 100% de précision sans aucune faute.",
    iconName: "target",
  },
];

async function main() {
  console.log("🌱 Début du seed CodeRacer...");

  for (const text of SAMPLE_TEXTS) {
    const wordCount = text.content.split(/\s+/).length;
    const charCount = text.content.length;

    await prisma.textSnippet.create({
      data: {
        ...text,
        wordCount,
        charCount,
      },
    });
  }

  for (const badge of INITIAL_BADGES) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {},
      create: badge,
    });
  }

  console.log("✅ Seed terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
