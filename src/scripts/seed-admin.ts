import { hashPassword } from "@/lib/password";
import { db } from "@/lib/db";

async function seedAdmin() {
  const email = "admin@seruyankab.go.id";
  const password = "admin123";
  const name = "Administrator";

  // Check if admin already exists
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    console.log("Admin user already exists:", email);
    return;
  }

  const hashedPassword = hashPassword(password);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
      aktif: true,
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log("   Role: superadmin");
  console.log("\n   ⚠️  Please change the default password after first login!");
}

seedAdmin()
  .catch((e) => {
    console.error("Failed to seed admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
