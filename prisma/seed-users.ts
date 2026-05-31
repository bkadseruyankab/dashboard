import { PrismaClient } from '@prisma/client'
import { createHash, randomBytes, pbkdf2Sync } from 'crypto'

const prisma = new PrismaClient()

const ITERATIONS = 10000
const KEY_LENGTH = 64
const SALT_LENGTH = 32
const DIGEST = "sha512"

function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex")
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex")
  return `${salt}:${hash}`
}

const opdUsers = [
  { kodeOpd: "1.01", namaOpd: "Sekretariat Daerah", email: "setda@seruyankab.go.id" },
  { kodeOpd: "1.02", namaOpd: "Sekretariat DPRD", email: "setdprd@seruyankab.go.id" },
  { kodeOpd: "1.03", namaOpd: "Inspektorat Daerah", email: "inspektorat@seruyankab.go.id" },
  { kodeOpd: "2.01", namaOpd: "Dinas Pendidikan", email: "disdik@seruyankab.go.id" },
  { kodeOpd: "2.02", namaOpd: "Dinas Kesehatan", email: "dinkes@seruyankab.go.id" },
  { kodeOpd: "2.03", namaOpd: "Dinas Pekerjaan Umum dan Penataan Ruang", email: "pupr@seruyankab.go.id" },
  { kodeOpd: "2.04", namaOpd: "Dinas Perumahan Rakyat dan Kawasan Permukiman", email: "perkimtan@seruyankab.go.id" },
  { kodeOpd: "2.05", namaOpd: "Dinas Sosial", email: "dinsos@seruyankab.go.id" },
  { kodeOpd: "2.06", namaOpd: "Dinas Ketahanan Pangan dan Pertanian", email: "dispertani@seruyankab.go.id" },
  { kodeOpd: "2.07", namaOpd: "Dinas Lingkungan Hidup", email: "dlh@seruyankab.go.id" },
  { kodeOpd: "2.08", namaOpd: "Dinas Kependudukan dan Pencatatan Sipil", email: "disdukcapil@seruyankab.go.id" },
  { kodeOpd: "2.09", namaOpd: "Dinas Pemberdayaan Masyarakat dan Desa", email: "dpmd@seruyankab.go.id" },
  { kodeOpd: "2.10", namaOpd: "Dinas Perhubungan", email: "dishub@seruyankab.go.id" },
  { kodeOpd: "2.11", namaOpd: "Dinas Komunikasi dan Informatika", email: "diskominfo@seruyankab.go.id" },
  { kodeOpd: "2.12", namaOpd: "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu", email: "dpmptsp@seruyankab.go.id" },
  { kodeOpd: "2.13", namaOpd: "Dinas Pemuda, Olahraga, Pariwisata dan Kebudayaan", email: "disporparbud@seruyankab.go.id" },
  { kodeOpd: "2.14", namaOpd: "Dinas Perpustakaan dan Kearsipan", email: "dispursip@seruyankab.go.id" },
  { kodeOpd: "2.15", namaOpd: "Dinas Perikanan", email: "diskan@seruyankab.go.id" },
  { kodeOpd: "2.16", namaOpd: "Dinas Koperasi, UKM, Perindustrian dan Perdagangan", email: "diskumindag@seruyankab.go.id" },
  { kodeOpd: "2.17", namaOpd: "Dinas Tenaga Kerja dan Transmigrasi", email: "disnakertrans@seruyankab.go.id" },
  { kodeOpd: "3.01", namaOpd: "Badan Perencanaan Pembangunan Daerah, Penelitian dan Pengembangan", email: "bappeda@seruyankab.go.id" },
  { kodeOpd: "3.02", namaOpd: "Badan Pengelolaan Keuangan dan Aset Daerah", email: "bpkad@seruyankab.go.id" },
  { kodeOpd: "3.03", namaOpd: "Badan Kepegawaian dan Pengembangan SDM", email: "bkpsdm@seruyankab.go.id" },
  { kodeOpd: "3.04", namaOpd: "Badan Penanggulangan Bencana Daerah", email: "bpbd@seruyankab.go.id" },
  { kodeOpd: "3.05", namaOpd: "Badan Kesatuan Bangsa dan Politik", email: "kesbangpol@seruyankab.go.id" },
  { kodeOpd: "3.06", namaOpd: "Badan Pendapatan Daerah", email: "bapenda@seruyankab.go.id" },
  { kodeOpd: "4.01", namaOpd: "Kecamatan Seruyan Hilir", email: "kec.hilir@seruyankab.go.id" },
  { kodeOpd: "4.02", namaOpd: "Kecamatan Seruyan Hilir Timur", email: "kec.hilirtimur@seruyankab.go.id" },
  { kodeOpd: "4.03", namaOpd: "Kecamatan Danau Sembuluh", email: "kec.danausembuluh@seruyankab.go.id" },
  { kodeOpd: "4.04", namaOpd: "Kecamatan Hanau", email: "kec.hanau@seruyankab.go.id" },
  { kodeOpd: "4.05", namaOpd: "Kecamatan Seruyan Raya", email: "kec.raya@seruyankab.go.id" },
  { kodeOpd: "4.06", namaOpd: "Kecamatan Danau Seluluk", email: "kec.danauseluluk@seruyankab.go.id" },
  { kodeOpd: "4.07", namaOpd: "Kecamatan Batu Ampar", email: "kec.batuampar@seruyankab.go.id" },
  { kodeOpd: "4.08", namaOpd: "Kecamatan Seruyan Tengah", email: "kec.tengah@seruyankab.go.id" },
  { kodeOpd: "4.09", namaOpd: "Kecamatan Seruyan Hulu", email: "kec.hulu@seruyankab.go.id" },
  { kodeOpd: "4.10", namaOpd: "Kecamatan Suling Tambun", email: "kec.sulingtambun@seruyankab.go.id" },
]

async function main() {
  console.log("🔐 Seeding user accounts for OPD role...")

  // Find active tahun anggaran
  const ta = await prisma.tahunAnggaran.findFirst({ where: { aktif: true } })
  if (!ta) {
    console.error("❌ No active TahunAnggaran found. Run seed-opd.ts first.")
    process.exit(1)
  }
  console.log(`📅 Using TahunAnggaran: ${ta.tahun}`)

  // Default password for all OPD accounts
  const DEFAULT_PASSWORD = "opd2024"

  // ==========================================
  // Create/Update Super Admin account
  // ==========================================
  const existingSuper = await prisma.user.findFirst({ where: { role: "superadmin" } })
  if (!existingSuper) {
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "superadmin@seruyankab.go.id",
        password: hashPassword("admin123"),
        role: "superadmin",
        aktif: true,
      }
    })
    console.log("👑 Created Super Admin account (admin123)")
  } else {
    console.log("👑 Super Admin account already exists")
  }

  // Create/Update Admin account
  const existingAdmin = await prisma.user.findFirst({ where: { role: "admin" } })
  if (!existingAdmin) {
    // Check if email already taken
    const adminByEmail = await prisma.user.findUnique({ where: { email: "admin@seruyankab.go.id" } })
    if (adminByEmail) {
      // Update existing user to admin role
      await prisma.user.update({
        where: { id: adminByEmail.id },
        data: { role: "admin", name: "Admin BPKAD" }
      })
      console.log("👤 Updated existing user to Admin role")
    } else {
      await prisma.user.create({
        data: {
          name: "Admin BPKAD",
          email: "admin@seruyankab.go.id",
          password: hashPassword("admin123"),
          role: "admin",
          aktif: true,
        }
      })
      console.log("👤 Created Admin account (admin123)")
    }
  } else {
    console.log("👤 Admin account already exists")
  }

  // ==========================================
  // Create OPD user accounts
  // ==========================================
  let created = 0
  let updated = 0
  let skipped = 0

  for (const opdUser of opdUsers) {
    // Find the OPD record
    const opd = await prisma.opd.findFirst({
      where: {
        kodeOpd: opdUser.kodeOpd,
        tahunAnggaranId: ta.id,
      }
    })

    if (!opd) {
      console.log(`⚠️  OPD not found: ${opdUser.kodeOpd} — ${opdUser.namaOpd}`)
      skipped++
      continue
    }

    // Check if user already exists for this OPD
    const existingUser = await prisma.user.findFirst({
      where: { opdId: opd.id }
    })

    if (existingUser) {
      // Update name and email if changed
      if (existingUser.name !== opdUser.namaOpd || existingUser.email !== opdUser.email) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: opdUser.namaOpd,
            email: opdUser.email,
          }
        })
        updated++
      } else {
        skipped++
      }
      continue
    }

    // Also check by email
    const existingByEmail = await prisma.user.findUnique({
      where: { email: opdUser.email }
    })

    if (existingByEmail) {
      // Update the existing user to link with OPD
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          name: opdUser.namaOpd,
          role: "opd",
          opdId: opd.id,
        }
      })
      updated++
      continue
    }

    // Create new OPD user
    await prisma.user.create({
      data: {
        name: opdUser.namaOpd,
        email: opdUser.email,
        password: hashPassword(DEFAULT_PASSWORD),
        role: "opd",
        opdId: opd.id,
        aktif: true,
      }
    })
    created++
  }

  console.log(`✅ OPD user seeding complete: ${created} created, ${updated} updated, ${skipped} skipped`)

  // Summary
  const totalUsers = await prisma.user.count()
  const opdUsers_count = await prisma.user.count({ where: { role: "opd" } })
  const adminUsers = await prisma.user.count({ where: { role: "admin" } })
  const superAdmins = await prisma.user.count({ where: { role: "superadmin" } })

  console.log("")
  console.log("══════════════════════════════════════════════")
  console.log("📊 RINGKASAN AKUN PENGGUNA")
  console.log("══════════════════════════════════════════════")
  console.log(`👑 Super Admin : ${superAdmins} akun`)
  console.log(`👤 Admin       : ${adminUsers} akun`)
  console.log(`🏢 OPD         : ${opdUsers_count} akun`)
  console.log(`📋 Total       : ${totalUsers} akun`)
  console.log("══════════════════════════════════════════════")
  console.log("")
  console.log("🔑 Default passwords:")
  console.log("   Super Admin / Admin: admin123")
  console.log("   OPD users          : opd2024")
  console.log("")
  console.log("⚠️  Harap ubah password setelah login pertama!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
