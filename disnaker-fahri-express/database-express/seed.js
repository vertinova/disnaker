// Database Seeder Runner for Express
// Run all seeders in order

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runSeeders() {
  let connection;
  
  try {
    console.log('🌱 Running seeders...\n');

    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dpmd'
    });

    console.log('✅ Database connected\n');

    const seedersDir = path.join(__dirname, 'seeders');
    const files = fs.readdirSync(seedersDir)
      .filter(file => file.endsWith('.js') || file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`📄 Running seeder: ${file}`);
      
      if (file.endsWith('.sql')) {
        // Run SQL seeder
        const sql = fs.readFileSync(path.join(seedersDir, file), 'utf8');
        
        // Split by INSERT statements and run them separately to avoid timeout
        const statements = sql.split(';\n').filter(s => s.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
          try {
            await connection.query(statements[i]);
            if ((i + 1) % 100 === 0) {
              console.log(`   Processed ${i + 1}/${statements.length} statements...`);
            }
          } catch (error) {
            console.error(`   ⚠️  Error in statement ${i + 1}:`, error.message.substring(0, 100));
          }
        }
        console.log(`✅ Completed ${statements.length} statements`);
      } else {
        // Run JS seeder
        const seeder = require(path.join(seedersDir, file));
        
        if (seeder.up && typeof seeder.up === 'function') {
          await seeder.up(connection);
        } else {
          console.warn(`⚠️  Seeder ${file} has no up() function`);
        }
      }
      console.log('');
    }

    console.log('🎉 All seeders completed!');
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;
