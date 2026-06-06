import { db } from './db';

async function createHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function main() {
  // Update admin user with correct credentials
  const hashedPassword = await createHash('admin123');
  
  try {
    // Try to update existing user
    const existingUser = await db.user.findFirst();
    
    if (existingUser) {
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          email: 'bkad@seruyankab.go.id',
          password: hashedPassword,
          name: 'Administrator BKAD',
          role: 'admin',
        },
      });
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin user
      await db.user.create({
        data: {
          email: 'bkad@seruyankab.go.id',
          password: hashedPassword,
          name: 'Administrator BKAD',
          role: 'admin',
        },
      });
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('📧 Email: bkad@seruyankab.go.id');
    console.log('🔑 Password: admin123');
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
