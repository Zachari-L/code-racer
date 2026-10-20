import { prisma } from "../src/lib/prisma";
import { BADGES, BADGE_CODES, toBadgeRecord } from "../src/lib/badges";

async function main() {
  console.log("🌱 Début du seed CodeRacer...");

  for (const badge of BADGES) {
    const record = toBadgeRecord(badge);
    await prisma.badge.upsert({
      where: { code: record.code },
      update: record,
      create: record,
    });
  }

  // Drop legacy badges (e.g. SPEED_DEMON_100) that left the registry and nobody holds.
  await prisma.badge.deleteMany({
    where: { code: { notIn: [...BADGE_CODES] }, users: { none: {} } },
  });

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
