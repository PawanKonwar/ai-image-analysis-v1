import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

// Manually locate the .env file to be 100% sure Node finds it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log("--- Debugging Connection ---");
console.log("Checking for DATABASE_URL...");

if (!process.env.DATABASE_URL) {
    console.error("❌ Still Undefined! Node is looking in:", path.resolve(__dirname, '../.env'));
    console.error("Set DATABASE_URL in .env or .env.local");
} else {
    console.log("✅ DATABASE_URL found!");
}

const isLocalDb = /localhost|postgres:5432|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: isLocalDb ? {} : { ssl: { require: true, rejectUnauthorized: false } },
});

export default sequelize;