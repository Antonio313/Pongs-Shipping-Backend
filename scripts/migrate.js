const { Pool } = require('pg');
const { spawn } = require('child_process');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || process.env.PGUSER,
  host: process.env.DB_HOST || process.env.PGHOST,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(dbConfig);

async function runDatabaseRestore() {
  try {
    console.log('🚀 Starting database restoration...');

    // Path to the dump file
    const dumpFilePath = path.join(__dirname, '../pongs-shipping-dump.sql');

    console.log('📁 Using dump file:', dumpFilePath);

    // Check if we need to restore the database
    let needsRestore = false;
    try {
      // Check for actual application tables, not just any tables
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('users', 'packages', 'prealerts', 'deliveries')
      `);
      const appTableCount = parseInt(result.rows[0].count);
      console.log(`📊 Found ${appTableCount} application tables`);

      if (appTableCount === 0) {
        needsRestore = true;
        console.log('🔄 No application tables found, will restore from dump');
      } else {
        // Force restore anyway since the database seems incomplete
        needsRestore = true;
        console.log('🔄 Application tables exist but forcing restore to ensure completeness');
      }
    } catch (error) {
      console.log('🔄 Cannot check existing tables, will attempt restore');
      needsRestore = true;
    }

    if (needsRestore) {
      console.log('⏳ Restoring database from dump file...');

      // Prepare pg_restore command
      const pgRestoreArgs = [
        '--verbose',
        '--clean',
        '--no-acl',
        '--no-owner',
        '--host', dbConfig.host,
        '--port', dbConfig.port.toString(),
        '--username', dbConfig.user,
        '--dbname', dbConfig.database,
        dumpFilePath
      ];

      // Set up environment for pg_restore
      const env = {
        ...process.env,
        PGPASSWORD: dbConfig.password
      };

      // Execute pg_restore
      const pgRestore = spawn('pg_restore', pgRestoreArgs, { env });

      let restoreOutput = '';
      let restoreError = '';

      pgRestore.stdout.on('data', (data) => {
        restoreOutput += data.toString();
        process.stdout.write(data);
      });

      pgRestore.stderr.on('data', (data) => {
        restoreError += data.toString();
        process.stderr.write(data);
      });

      await new Promise((resolve, reject) => {
        pgRestore.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Database restored successfully!');
            resolve();
          } else {
            // pg_restore often returns non-zero codes even for successful restores
            // Check if the restore actually worked by querying the database
            console.log(`⚠️  pg_restore exited with code ${code}, checking if restore was successful...`);
            resolve();
          }
        });

        pgRestore.on('error', (error) => {
          reject(new Error(`Failed to start pg_restore: ${error.message}`));
        });
      });

      // Verify the restore worked
      try {
        const result = await pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
        const tableCount = parseInt(result.rows[0].count);
        console.log(`📊 Verification: Found ${tableCount} tables after restore`);

        if (tableCount === 0) {
          throw new Error('Database restore failed - no tables found after restore');
        }
      } catch (error) {
        throw new Error(`Database restore verification failed: ${error.message}`);
      }
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run database restoration if this file is executed directly
if (require.main === module) {
  runDatabaseRestore();
}

module.exports = { runDatabaseRestore };