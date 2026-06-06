import { db } from './db';
import { hash } from 'crypto';

async function createHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function main() {
  // Create admin user
  const hashedPassword = await createHash('admin123');
  const admin = await db.user.create({
    data: {
      email: 'admin@bkad-seruyan.go.id',
      name: 'Administrator',
      password: hashedPassword,
      role: 'admin',
    },
  });

  // Create categories
  const categories = await Promise.all([
    db.category.create({
      data: {
        name: 'Berita Utama',
        slug: 'berita-utama',
        description: 'Berita utama dari BKAD Kabupaten Seruyan',
        icon: 'newspaper',
        color: '#dc2626',
        order: 1,
      },
    }),
    db.category.create({
      data: {
        name: 'Pengumuman',
        slug: 'pengumuman',
        description: 'Pengumuman resmi dari BKAD',
        icon: 'megaphone',
        color: '#2563eb',
        order: 2,
      },
    }),
    db.category.create({
      data: {
        name: 'Kegiatan',
        slug: 'kegiatan',
        description: 'Kegiatan dan acara BKAD',
        icon: 'calendar',
        color: '#16a34a',
        order: 3,
      },
    }),
    db.category.create({
      data: {
        name: 'Regulasi',
        slug: 'regulasi',
        description: 'Peraturan dan regulasi terkait',
        icon: 'scale',
        color: '#9333ea',
        order: 4,
      },
    }),
    db.category.create({
      data: {
        name: 'Informasi Publik',
        slug: 'informasi-publik',
        description: 'Informasi untuk masyarakat',
        icon: 'info',
        color: '#ea580c',
        order: 5,
      },
    }),
  ]);

  // Create news articles
  const newsData = [
    {
      title: 'BKAD Seruyan Gelar Rapat Koordinasi Pengelolaan Keuangan Daerah',
      slug: 'bkad-seruyan-gelar-rapat-koordinasi',
      excerpt: 'Badan Keuangan dan Aset Daerah Kabupaten Seruyan menggelar rapat koordinasi pengelolaan keuangan daerah yang dihadiri oleh seluruh OPD.',
      content: `<p>Badan Keuangan dan Aset Daerah (BKAD) Kabupaten Seruyan menggelar rapat koordinasi pengelolaan keuangan daerah yang dihadiri oleh seluruh Organisasi Perangkat Daerah (OPD). Rapat ini membahas tentang evaluasi pelaksanaan APBD semester pertama dan perencanaan anggaran tahun depan.</p>
      <p>Kepala BKAD Seruyan dalam sambutannya menekankan pentingnya transparansi dan akuntabilitas dalam pengelolaan keuangan daerah. "Kita harus memastikan setiap rupiah yang dibelanjakan dapat dipertanggungjawabkan kepada masyarakat," ujarnya.</p>
      <p>Rapat juga membahas tentang percepatan penyerapan anggaran dan antisipasi menghadapi akhir tahun anggaran. Seluruh peserta sepakat untuk meningkatkan koordinasi dan komunikasi antar OPD.</p>`,
      thumbnail: '/images/news-1.jpg',
      categoryId: categories[0].id,
      authorId: admin.id,
      isFeatured: true,
      viewCount: 234,
    },
    {
      title: 'Pelatihan Sistem Akuntansi Keuangan Daerah untuk Bendahara',
      slug: 'pelatihan-sakd-bendahara',
      excerpt: 'BKAD Seruyan menyelenggarakan pelatihan Sistem Akuntansi Keuangan Daerah bagi para bendahara di lingkungan Pemkab Seruyan.',
      content: `<p>Dalam rangka meningkatkan kompetensi para bendahara di lingkungan Pemkab Seruyan, BKAD menyelenggarakan pelatihan Sistem Akuntansi Keuangan Daerah (SAKD) yang berlangsung selama 3 hari.</p>
      <p>Pelatihan ini diikuti oleh lebih dari 50 bendahara dari berbagai OPD. Materi yang disampaikan meliputi proses penganggaran, penatausahaan, pembukuan, pelaporan, dan pertanggungjawaban keuangan daerah.</p>
      <p>"Dengan pelatihan ini, diharapkan para bendahara dapat lebih memahami dan mengimplementasikan SAKD dengan baik sehingga laporan keuangan daerah dapat disusun tepat waktu dan akurat," jelas narasumber dari BKAD.</p>`,
      thumbnail: '/images/news-2.jpg',
      categoryId: categories[2].id,
      authorId: admin.id,
      isFeatured: true,
      viewCount: 156,
    },
    {
      title: 'Seruyan Raih Opini WTP ke-5 Kalinya',
      slug: 'seruyan-raih-opini-wtp',
      excerpt: 'Kabupaten Seruyan kembali meraih opini Wajar Tanpa Pengecualian (WTP) dari BPK untuk laporan keuangan tahun 2023.',
      content: `<p>Kabupaten Seruyan kembali meraih prestasi membanggakan dengan mendapatkan opini Wajar Tanpa Pengecualian (WTP) dari Badan Pemeriksa Keuangan (BPK) untuk laporan keuangan pemerintah daerah tahun 2023.</p>
      <p>Ini merupakan kali ke-5 berturut-turut Seruyan meraih opini terbaik tersebut. Pencapaian ini merupakan hasil kerja keras seluruh jajaran Pemkab Seruyan dalam mengelola keuangan daerah dengan baik.</p>
      <p>Bupati Seruyan menyampaikan apresiasi kepada seluruh tim yang telah bekerja keras meraih opini WTP. "Ini adalah bukti komitmen kita dalam menerapkan prinsip good governance," katanya.</p>`,
      thumbnail: '/images/news-3.jpg',
      categoryId: categories[0].id,
      authorId: admin.id,
      isFeatured: true,
      viewCount: 412,
    },
    {
      title: 'Pengumuman: Jadwal Libur Nasional dan Cuti Bersama 2024',
      slug: 'pengumuman-jadwal-libur-2024',
      excerpt: 'BKAD Seruyan mengumumkan jadwal libur nasional dan cuti bersama tahun 2024 bagi seluruh ASN di lingkungan Pemkab Seruyan.',
      content: `<p>Berdasarkan Keputusan Bersama Menteri Agama, Menteri Ketenagakerjaan, dan Menteri PAN-RB, berikut adalah jadwal libur nasional dan cuti bersama tahun 2024.</p>
      <p>Seluruh ASN di lingkungan Pemkab Seruyan diharapkan dapat memperhatikan jadwal tersebut dan tetap melaksanakan tugas dengan baik sebelum dan sesudah masa libur.</p>`,
      thumbnail: '/images/news-4.jpg',
      categoryId: categories[1].id,
      authorId: admin.id,
      isFeatured: false,
      viewCount: 89,
    },
    {
      title: 'Sosialisasi Peraturan Daerah tentang Pajak Daerah',
      slug: 'sosialisasi-perda-pajak-daerah',
      excerpt: 'BKAD Seruyan mengadakan sosialisasi Peraturan Daerah tentang Pajak Daerah dan Retribusi Daerah kepada masyarakat.',
      content: `<p>Dalam rangka meningkatkan pemahaman masyarakat tentang kewajiban perpajakan daerah, BKAD Seruyan mengadakan sosialisasi Peraturan Daerah tentang Pajak Daerah dan Retribusi Daerah.</p>
      <p>Kegiatan ini dilaksanakan di berbagai kecamatan dan dihadiri oleh pelaku usaha, tokoh masyarakat, dan masyarakat umum. Materi yang disampaikan meliputi jenis-jenis pajak daerah, tata cara pembayaran, dan sanksi bagi yang tidak mematuhi.</p>
      <p>"Pajak daerah merupakan sumber pendapatan yang sangat penting untuk pembangunan daerah. Mari bersama-sama mendukung pembangunan dengan membayar pajak dengan patuh," ajak Kepala BKAD.</p>`,
      thumbnail: '/images/news-5.jpg',
      categoryId: categories[4].id,
      authorId: admin.id,
      isFeatured: false,
      viewCount: 178,
    },
    {
      title: 'Verifikasi dan Validasi Aset Daerah Tahun 2024',
      slug: 'verifikasi-aset-daerah-2024',
      excerpt: 'BKAD Seruyan melaksanakan kegiatan verifikasi dan validasi aset daerah untuk memperbarui data inventaris.',
      content: `<p>BKAD Seruyan melaksanakan kegiatan verifikasi dan validasi aset daerah tahun 2024. Kegiatan ini bertujuan untuk memperbarui data inventaris aset dan memastikan seluruh aset daerah tercatat dengan baik.</p>
      <p>Tim verifikasi akan mendatangi seluruh lokasi aset di berbagai OPD untuk melakukan pengecekan fisik dan pencocokan dengan data yang ada. Hasil verifikasi akan menjadi dasar untuk pemutakhiran data aset.</p>`,
      thumbnail: '/images/news-6.jpg',
      categoryId: categories[2].id,
      authorId: admin.id,
      isFeatured: false,
      viewCount: 92,
    },
  ];

  for (const news of newsData) {
    await db.news.create({ data: news });
  }

  // Create banners
  await Promise.all([
    db.banner.create({
      data: {
        title: 'Selamat Datang di Portal BKAD Seruyan',
        subtitle: 'Badan Keuangan dan Aset Daerah Kabupaten Seruyan - Melayani dengan Integritas',
        imageUrl: '/images/banner-1.jpg',
        link: '/profil',
        order: 1,
        isActive: true,
      },
    }),
    db.banner.create({
      data: {
        title: 'Transparansi Keuangan Daerah',
        subtitle: 'Mewujudkan Tata Kelola Keuangan yang Baik dan Akuntabel',
        imageUrl: '/images/banner-2.jpg',
        link: '/informasi-publik',
        order: 2,
        isActive: true,
      },
    }),
    db.banner.create({
      data: {
        title: 'Layanan Informasi Publik',
        subtitle: 'Akses informasi keuangan daerah dengan mudah dan cepat',
        imageUrl: '/images/banner-3.jpg',
        link: '/layanan',
        order: 3,
        isActive: true,
      },
    }),
  ]);

  // Create services
  await Promise.all([
    db.service.create({
      data: {
        title: 'Informasi APBD',
        slug: 'informasi-apbd',
        description: 'Anggaran Pendapatan dan Belanja Daerah Kabupaten Seruyan',
        icon: 'file-text',
        link: '/layanan/apbd',
        order: 1,
        isActive: true,
      },
    }),
    db.service.create({
      data: {
        title: 'Data Aset Daerah',
        slug: 'data-aset-daerah',
        description: 'Informasi aset dan kekayaan daerah Kabupaten Seruyan',
        icon: 'building-2',
        link: '/layanan/aset',
        order: 2,
        isActive: true,
      },
    }),
    db.service.create({
      data: {
        title: 'Laporan Keuangan',
        slug: 'laporan-keuangan',
        description: 'Laporan Realisasi APBD dan Laporan Keuangan Pemerintah Daerah',
        icon: 'bar-chart-3',
        link: '/layanan/laporan',
        order: 3,
        isActive: true,
      },
    }),
    db.service.create({
      data: {
        title: 'Pajak Daerah',
        slug: 'pajak-daerah',
        description: 'Informasi pajak daerah dan tata cara pembayaran',
        icon: 'receipt',
        link: '/layanan/pajak',
        order: 4,
        isActive: true,
      },
    }),
    db.service.create({
      data: {
        title: 'Retribusi Daerah',
        slug: 'retribusi-daerah',
        description: 'Informasi retribusi daerah dan layanan terkait',
        icon: 'credit-card',
        link: '/layanan/retribusi',
        order: 5,
        isActive: true,
      },
    }),
    db.service.create({
      data: {
        title: 'Pengaduan',
        slug: 'pengaduan',
        description: 'Sampaikan pengaduan dan aspirasi Anda',
        icon: 'message-square',
        link: '/layanan/pengaduan',
        order: 6,
        isActive: true,
      },
    }),
  ]);

  // Create documents
  await Promise.all([
    db.document.create({
      data: {
        title: 'APBD Kabupaten Seruyan 2024',
        slug: 'apbd-2024',
        description: 'Anggaran Pendapatan dan Belanja Daerah Kabupaten Seruyan Tahun Anggaran 2024',
        fileUrl: '/documents/APBD-2024.pdf',
        fileType: 'pdf',
        category: 'anggaran',
        authorId: admin.id,
        downloadCount: 234,
      },
    }),
    db.document.create({
      data: {
        title: 'Laporan Keuangan Semester I 2024',
        slug: 'laporan-keuangan-sem1-2024',
        description: 'Laporan Keuangan Pemerintah Daerah Semester I Tahun 2024',
        fileUrl: '/documents/LK-Sem1-2024.pdf',
        fileType: 'pdf',
        category: 'laporan',
        authorId: admin.id,
        downloadCount: 156,
      },
    }),
    db.document.create({
      data: {
        title: 'Peraturan Daerah tentang Pajak Daerah',
        slug: 'perda-pajak-daerah',
        description: 'Peraturan Daerah Kabupaten Seruyan tentang Pajak Daerah',
        fileUrl: '/documents/Perda-Pajak.pdf',
        fileType: 'pdf',
        category: 'regulasi',
        authorId: admin.id,
        downloadCount: 89,
      },
    }),
    db.document.create({
      data: {
        title: 'Peraturan Daerah tentang Retribusi Daerah',
        slug: 'perda-retribusi-daerah',
        description: 'Peraturan Daerah Kabupaten Seruyan tentang Retribusi Daerah',
        fileUrl: '/documents/Perda-Retribusi.pdf',
        fileType: 'pdf',
        category: 'regulasi',
        authorId: admin.id,
        downloadCount: 67,
      },
    }),
  ]);

  // Create statistics
  await Promise.all([
    db.statistics.create({
      data: {
        label: 'OPD Terlayani',
        value: 45,
        icon: 'building',
        description: 'Organisasi Perangkat Daerah',
        order: 1,
      },
    }),
    db.statistics.create({
      data: {
        label: 'ASN Terlatih',
        value: 520,
        icon: 'users',
        description: 'Aparatur Sipil Negara',
        order: 2,
      },
    }),
    db.statistics.create({
      data: {
        label: 'Dokumen Terbit',
        value: 120,
        icon: 'file-text',
        description: 'Dokumen keuangan daerah',
        order: 3,
      },
    }),
    db.statistics.create({
      data: {
        label: 'Opini WTP',
        value: 5,
        icon: 'award',
        description: 'Tahun berturut-turut',
        order: 4,
      },
    }),
  ]);

  // Create quick links
  await Promise.all([
    db.quickLink.create({
      data: {
        title: 'Pemerintah Kabupaten Seruyan',
        url: 'https://seruyankab.go.id',
        order: 1,
        isActive: true,
      },
    }),
    db.quickLink.create({
      data: {
        title: 'BPK Provinsi Kalimantan Tengah',
        url: 'https://bpk.kalteng.go.id',
        order: 2,
        isActive: true,
      },
    }),
    db.quickLink.create({
      data: {
        title: 'Kementerian Keuangan RI',
        url: 'https://kemenkeu.go.id',
        order: 3,
        isActive: true,
      },
    }),
    db.quickLink.create({
      data: {
        title: 'BPK RI',
        url: 'https://bpk.go.id',
        order: 4,
        isActive: true,
      },
    }),
    db.quickLink.create({
      data: {
        title: 'BPKP',
        url: 'https://bpkp.go.id',
        order: 5,
        isActive: true,
      },
    }),
    db.quickLink.create({
      data: {
        title: 'DJPK Kemenkeu',
        url: 'https://djpk.kemenkeu.go.id',
        order: 6,
        isActive: true,
      },
    }),
  ]);

  // Create organization structure
  await Promise.all([
    db.organization.create({
      data: {
        name: 'Ir. H. Yulihadi, M.M.',
        position: 'Kepala Badan',
        description: 'Kepala Badan Keuangan dan Aset Daerah Kabupaten Seruyan',
        email: 'kepalabkad@seruyankab.go.id',
        phone: '(0513) 123456',
        order: 1,
        level: 1,
      },
    }),
    db.organization.create({
      data: {
        name: 'Drs. Ahmad Fauzi, M.Si.',
        position: 'Sekretaris',
        description: 'Sekretaris Badan Keuangan dan Aset Daerah',
        email: 'sekretaris@seruyankab.go.id',
        phone: '(0513) 123457',
        order: 2,
        level: 2,
      },
    }),
    db.organization.create({
      data: {
        name: 'Hj. Siti Rahmawati, S.E., M.Ak.',
        position: 'Kepala Bidang Anggaran',
        description: 'Kepala Bidang Anggaran',
        email: 'kabid-anggaran@seruyankab.go.id',
        order: 3,
        level: 3,
      },
    }),
    db.organization.create({
      data: {
        name: 'Budi Santoso, S.E.',
        position: 'Kepala Bidang Perbendaharaan',
        description: 'Kepala Bidang Perbendaharaan',
        email: 'kabid-perbendaharaan@seruyankab.go.id',
        order: 4,
        level: 3,
      },
    }),
    db.organization.create({
      data: {
        name: 'Ir. Agus Prayitno',
        position: 'Kepala Bidang Aset',
        description: 'Kepala Bidang Aset',
        email: 'kabid-aset@seruyankab.go.id',
        order: 5,
        level: 3,
      },
    }),
  ]);

  // Create site settings
  await Promise.all([
    db.siteSetting.create({
      data: {
        key: 'site_name',
        value: 'BKAD Kabupaten Seruyan',
        description: 'Nama situs',
      },
    }),
    db.siteSetting.create({
      data: {
        key: 'site_description',
        value: 'Portal Resmi Badan Keuangan dan Aset Daerah Kabupaten Seruyan',
        description: 'Deskripsi situs',
      },
    }),
    db.siteSetting.create({
      data: {
        key: 'address',
        value: 'Jl. S. Parman No. 1, Kuala Pembuang, Kab. Seruyan, Kalimantan Tengah 74211',
        description: 'Alamat kantor',
      },
    }),
    db.siteSetting.create({
      data: {
        key: 'phone',
        value: '(0513) 123456',
        description: 'Nomor telepon',
      },
    }),
    db.siteSetting.create({
      data: {
        key: 'email',
        value: 'bkad@seruyankab.go.id',
        description: 'Alamat email',
      },
    }),
    db.siteSetting.create({
      data: {
        key: 'working_hours',
        value: 'Senin - Kamis: 07.30 - 16.00 WIB, Jumat: 07.30 - 16.30 WIB',
        description: 'Jam kerja',
      },
    }),
  ]);

  // Create gallery
  await Promise.all([
    db.gallery.create({
      data: {
        title: 'Rapat Koordinasi Keuangan Daerah',
        description: 'Rapat koordinasi dengan seluruh OPD',
        imageUrl: '/images/gallery-1.jpg',
        category: 'kegiatan',
        eventDate: new Date('2024-06-15'),
        isActive: true,
      },
    }),
    db.gallery.create({
      data: {
        title: 'Pelatihan SAKD',
        description: 'Pelatihan Sistem Akuntansi Keuangan Daerah',
        imageUrl: '/images/gallery-2.jpg',
        category: 'kegiatan',
        eventDate: new Date('2024-05-20'),
        isActive: true,
      },
    }),
    db.gallery.create({
      data: {
        title: 'Penyerahan Opini WTP',
        description: 'Penyerahan opini WTP dari BPK',
        imageUrl: '/images/gallery-3.jpg',
        category: 'event',
        eventDate: new Date('2024-04-10'),
        isActive: true,
      },
    }),
  ]);

  // Create announcements
  await Promise.all([
    db.announcement.create({
      data: {
        title: 'Pendaftaran Pelatihan Bendahara 2024',
        content: 'Dibuka pendaftaran pelatihan bendahara tahun 2024. Silakan mendaftar melalui website atau datang langsung ke kantor BKAD.',
        link: '/layanan/pelatihan',
        startDate: new Date(),
        endDate: new Date('2024-12-31'),
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
