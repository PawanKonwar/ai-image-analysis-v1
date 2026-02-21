import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

// Manually locate the .env file to be 100% sure Node finds it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("--- Debugging Connection ---");
console.log("Checking for DATABASE_URL...");

if (!process.env.DATABASE_URL) {
    console.error("❌ Still Undefined! Node is looking in:", path.resolve(__dirname, '../.env'));
    // Emergency Fallback: If the variable isn't loading, paste your URL here temporarily 
    // to test if the rest of the app works:
    // process.env.DATABASE_URL = "postgres://postgres:YourPassword@ai-image-analysis-db.ca5g48e20el8.us-east-1.rds.amazonaws.com:5432/ai_image_analysis?sslmode=no-verify";
} else {
    console.log("✅ DATABASE_URL found!");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

export default sequelize;