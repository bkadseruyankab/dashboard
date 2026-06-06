import { db } from './db';

async function main() {
  // Add new site settings for logo and favicon
  try {
    await db.siteSetting.create({
      data: {
        key: 'site_logo',
        value: '/logo.svg',
        description: 'URL logo situs',
      },
    });
    console.log('✅ Added site_logo setting');
  } catch {
    console.log('ℹ️ site_logo setting already exists, updating...');
    await db.siteSetting.update({
      where: { key: 'site_logo' },
      data: { value: '/logo.svg' },
    });
  }

  try {
    await db.siteSetting.create({
      data: {
        key: 'site_favicon',
        value: '/logo.svg',
        description: 'URL favicon situs',
      },
    });
    console.log('✅ Added site_favicon setting');
  } catch {
    console.log('ℹ️ site_favicon setting already exists, updating...');
    await db.siteSetting.update({
      where: { key: 'site_favicon' },
      data: { value: '/logo.svg' },
    });
  }

  console.log('🎉 Settings migration completed!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
