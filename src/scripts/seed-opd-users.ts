import { hashPassword } from "@/lib/password";
import { db } from "@/lib/db";

async function seedOpdUsers() {
  const defaultPassword = "seruyan2024";

  // 1. Find the active TahunAnggaran
  const activeTahun = await db.tahunAnggaran.findFirst({
    where: { aktif: true },
  });

  if (!activeTahun) {
    console.error("❌ No active TahunAnggaran found. Please activate a fiscal year first.");
    process.exit(1);
  }

  console.log(`📅 Active Tahun Anggaran: ${activeTahun.tahun} (id: ${activeTahun.id})\n`);

  // 2. Get all OPD records for that fiscal year
  const opds = await db.opd.findMany({
    where: { tahunAnggaranId: activeTahun.id },
    orderBy: { kodeOpd: "asc" },
  });

  if (opds.length === 0) {
    console.log("⚠️  No OPD records found for the active fiscal year.");
    return;
  }

  console.log(`Found ${opds.length} OPD records. Creating user accounts...\n`);

  let created = 0;
  let skipped = 0;

  for (const opd of opds) {
    // Generate email: remove dots from kodeOpd
    const kodeWithoutDots = opd.kodeOpd.replace(/\./g, "");
    const email = `opd-${kodeWithoutDots}@seruyankab.go.id`;

    // 3. Check if user with that email already exists
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${email} — ${opd.namaOpd}`);
      skipped++;
      continue;
    }

    // Create user account
    const hashedPassword = hashPassword(defaultPassword);

    await db.user.create({
      data: {
        name: opd.namaOpd,
        email,
        password: hashedPassword,
        role: "opd",
        opdId: opd.id,
        aktif: true,
      },
    });

    console.log(`✅ Created: ${email} — ${opd.namaOpd}`);
    created++;
  }

  // 5. Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SEED SUMMARY");
  console.log("=".repeat(60));
  console.log(`   Total OPDs:     ${opds.length}`);
  console.log(`   Created:        ${created}`);
  console.log(`   Skipped:        ${skipped}`);
  console.log(`   Default password: ${defaultPassword}`);
  console.log("=".repeat(60));
  console.log("\n⚠️  Please remind users to change their default password after first login!");
}

seedOpdUsers()
  .catch((e) => {
    console.error("Failed to seed OPD users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
