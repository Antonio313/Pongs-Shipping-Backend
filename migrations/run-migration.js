const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Starting migration: add-customer-number.sql');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add-customer-number.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify the results
    const result = await pool.query(`
      SELECT
        user_id,
        customer_number,
        first_name,
        last_name,
        branch,
        LEFT(address, 50) as address_preview
      FROM users
      WHERE role = 'C'
      ORDER BY customer_number
      LIMIT 10
    `);

    console.log('\n📊 First 10 customers with customer numbers:');
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
