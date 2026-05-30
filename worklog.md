---
Task ID: 1
Agent: Main Agent
Task: Implement login feature for the government financial dashboard

Work Log:
- Added User model to Prisma schema (id, name, email, password, role, aktif)
- Ran prisma db push to sync schema with database
- Created /src/lib/password.ts - custom PBKDF2 password hashing (avoids bcryptjs native module issues)
- Created /src/lib/auth.ts - NextAuth.js v4 configuration with Credentials provider
- Created /src/app/api/auth/[...nextauth]/route.ts - NextAuth API route
- Created /src/components/auth/AuthProvider.tsx - SessionProvider wrapper
- Created /src/components/auth/LoginForm.tsx - Beautiful government-themed login page
- Created /src/hooks/use-auth.ts - Custom hook for auth state (useAuth)
- Updated /src/app/layout.tsx - Added AuthProvider wrapping PengaturanProvider
- Updated /src/app/page.tsx - Shows LoginForm when accessing admin without auth
- Updated /src/components/dashboard/DashboardHeader.tsx - Added user avatar dropdown with logout
- Created /src/app/api/admin/users/route.ts - User listing API
- Created /src/app/api/admin/change-password/route.ts - Change password API
- Created /src/components/admin/UserManager.tsx - Account info + change password UI
- Updated /src/components/admin/AdminPanel.tsx - Added "Akun" tab for user management
- Updated /src/components/dashboard/types.ts - Added "akun" to AdminTab type
- Added auth checks (requireAuth) to all admin API write routes (POST, PUT, DELETE)
- Created /src/scripts/seed-admin.ts - Script to seed default admin user
- Seeded default admin user: admin@seruyankab.go.id / admin123

Stage Summary:
- Login feature fully implemented using NextAuth.js v4 with JWT sessions
- Admin panel is now protected - requires login to access
- When clicking "Admin" in sidebar without being logged in, a beautiful login form is shown
- After login, user sees the admin panel with a user avatar dropdown in the header
- User can logout from the dropdown menu
- User can change password from the "Akun" tab in admin
- All admin API write operations (POST/PUT/DELETE) are protected with auth checks
- Default credentials: admin@seruyankab.go.id / admin123
- Password hashing uses PBKDF2 (Node.js built-in crypto) instead of bcryptjs to avoid native module issues in sandbox
