const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database configuration using Railway's DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runDatabaseSetup() {
  try {
    console.log('🚀 Starting database setup...');

    // Check if we have application tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'packages', 'prealerts', 'deliveries', 'packagetracking')
      ORDER BY table_name
    `);

    const existingTables = result.rows.map(row => row.table_name);
    console.log(`📊 Found ${existingTables.length} application tables:`, existingTables);

    if (existingTables.length === 0) {
      console.log('🔄 No application tables found, attempting automatic restore...');

      try {
        // Try to restore from the included dump file
        const dumpPath = path.join(__dirname, '../pongs-shipping-dump.sql');
        if (fs.existsSync(dumpPath)) {
          console.log('📁 Found dump file, checking format...');

          // Check if it's a custom format dump by reading first few bytes
          const firstBytes = fs.readFileSync(dumpPath, { start: 0, end: 10 });
          const isCustomFormat = firstBytes.toString().includes('PGDMP');

          if (isCustomFormat) {
            console.log('⚠️  Dump file is in PostgreSQL custom format');
            console.log('❌ Cannot restore custom format automatically in container');
            console.log('🔧 Please use pg_restore manually:');
            console.log(`   pg_restore --verbose --clean --no-acl --no-owner -d "${process.env.DATABASE_URL}" pongs-shipping-dump.sql`);
            console.log('');
          } else {
            console.log('📄 Dump file is in SQL format, attempting restore...');
            const dumpContent = fs.readFileSync(dumpPath, 'utf8');

            // Execute the dump SQL
            await pool.query(dumpContent);
            console.log('✅ Database restored successfully from dump file!');
          }

          // Verify the restore
          const verifyResult = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
          `);
          console.log(`📊 After restore: Found ${verifyResult.rows.length} tables`);

        } else {
          console.log('❌ No dump file found at:', dumpPath);
          console.log('⚠️  Database appears empty. Manual restore required using Railway CLI:');
          console.log('   1. railway login');
          console.log('   2. railway link');
          console.log('   3. cat pongs-shipping-dump.sql | railway connect postgres');
          console.log('');
          console.log('🔄 Proceeding with empty database - API will still start...');
        }
      } catch (restoreError) {
        console.log('❌ Automatic restore failed:', restoreError.message);
        console.log('⚠️  Manual restore required using Railway CLI:');
        console.log('   1. railway login');
        console.log('   2. railway link');
        console.log('   3. cat pongs-shipping-dump.sql | railway connect postgres');
        console.log('🔄 Proceeding with empty database - API will still start...');
      }
    } else {
      // Check if we have users
      try {
        const userResult = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`👥 Found ${userResult.rows[0].count} users in database`);
      } catch (error) {
        console.log('⚠️  Could not query users table:', error.message);
      }

      console.log('✅ Database appears to be set up correctly');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Please check your DATABASE_URL environment variable');
    console.error('🔧 Make sure your PostgreSQL service is running');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run database setup if this file is executed directly
if (require.main === module) {
  runDatabaseSetup();
}

module.exports = { runDatabaseSetup };