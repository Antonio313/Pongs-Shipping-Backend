require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a pool connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🔄 Starting database migration for user roles...\n');

  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../migrations/update_user_roles.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements (excluding comments and test queries)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute the migration
    console.log('🚀 Executing migration...\n');

    // Drop old constraint
    console.log('1️⃣ Dropping old role constraint...');
    await pool.query('ALTER TABLE Users DROP CONSTRAINT IF EXISTS users_role_check');
    console.log('✅ Old constraint dropped\n');

    // Add new constraint
    console.log('2️⃣ Adding new role constraint with all staff roles...');
    await pool.query(`
      ALTER TABLE Users ADD CONSTRAINT users_role_check
      CHECK (role IN ('C', 'A', 'S', 'T', 'H', 'D', 'F'))
    `);
    console.log('✅ New constraint added\n');

    // Verify the constraint
    console.log('3️⃣ Verifying constraint...');
    const verifyResult = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass AND conname = 'users_role_check'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Constraint verified:');
      console.log('   Name:', verifyResult.rows[0].conname);
      console.log('   Definition:', verifyResult.rows[0].pg_get_constraintdef);
      console.log();
    } else {
      console.warn('⚠️  Constraint not found (this might be okay if it was already updated)');
      console.log();
    }

    // Show current user roles
    console.log('4️⃣ Current user roles in database:');
    const rolesResult = await pool.query(`
      SELECT role, COUNT(*) as user_count
      FROM Users
      GROUP BY role
      ORDER BY role
    `);

    if (rolesResult.rows.length > 0) {
      console.table(rolesResult.rows);
    } else {
      console.log('   No users found in database');
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📋 Summary:');
    console.log('   - Old roles: C (Customer), A (Admin), S (Super Admin)');
    console.log('   - New roles: C, A, S, T (Cashier), H (Package Handler), D (Transfer Personnel), F (Front Desk)');
    console.log('   - You can now create users with any of these roles!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();
