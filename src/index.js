import dotenv from 'dotenv';
dotenv.config(); 
import express from 'express';
import cors from 'cors'; // Standard library
import { Sequelize, DataTypes } from 'sequelize';
import { analyzeImage } from './services/analyzeService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Use the standard CORS package - much more reliable for AWS
app.use(cors());
app.use(express.json({ type: ['application/json', 'text/plain'],mit: '10mb' }));

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

const Analysis = sequelize.define('Analysis', {
  ai_response: { type: DataTypes.TEXT },
  image_metadata: { type: DataTypes.JSONB },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, { tableName: 'analyses', timestamps: false });

app.get('/', (req, res) => res.status(200).send('API Live'));

app.post('/analyze', async (req, res) => {
  try {
    const { image, image_base64, mime_type } = req.body;
    const imageBase64 = image || image_base64;
    
    if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI Key Missing');

    const result = await analyzeImage(imageBase64, mime_type || 'image/jpeg');
    
    await Analysis.create({
      ai_response: JSON.stringify(result),
      image_metadata: { data: imageBase64.substring(0, 100), mime: 'image/jpeg' } 
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/analyses', async (req, res) => {
  const items = await Analysis.findAll({ order: [['created_at', 'DESC']] });
  res.json(items);
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Port ${PORT}`));
  } catch (e) { process.exit(1); }
}
startServer();