// Clean build//
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function loadConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const region = process.env.AWS_REGION || 'us-east-1';
  const paramPath = process.env.CONFIG_PARAM_PATH || '/ai-image-analysis/config';

  const { SSMClient, GetParameterCommand } = await import('@aws-sdk/client-ssm');
  const ssm = new SSMClient({ region });

  const { Parameter } = await ssm.send(new GetParameterCommand({
    Name: paramPath,
    WithDecryption: true,
  }));

  if (!Parameter?.Value) {
    throw new Error(`Parameter Store config not found at ${paramPath}`);
  }

  const config = JSON.parse(Parameter.Value);
  Object.assign(process.env, {
    PORT: String(config.PORT ?? process.env.PORT),
    OPENAI_API_KEY: config.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
    DATABASE_URL: config.DATABASE_URL ?? process.env.DATABASE_URL,
    AWS_REGION: config.AWS_REGION ?? process.env.AWS_REGION,
    AWS_S3_BUCKET_NAME: config.S3_BUCKET_NAME ?? config.AWS_S3_BUCKET_NAME ?? process.env.AWS_S3_BUCKET_NAME,
    CORS_ORIGIN: config.CORS_ORIGIN ?? process.env.CORS_ORIGIN,
  });
  console.log('Config loaded from Parameter Store');
}

async function main() {
  await loadConfig();

  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const multer = (await import('multer')).default;
  const OpenAI = (await import('openai')).default;
  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const { Upload } = await import('@aws-sdk/lib-storage');
  const { sequelize, Analysis, Image } = await import('./models/index.js');

  const app = express();
  const PORT = process.env.PORT || 3000;

  // FIXED: Credentials removed to use IAM Task Role
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
  });

  const upload = multer({ storage: multer.memoryStorage() });

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const origins = corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim());
  app.use(cors({
    origin: origins,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const ANALYSIS_PROMPT = `Analyze this image and respond with a valid JSON object containing exactly these keys (no markdown, no code blocks, just raw JSON):
{
  "description": "A detailed scene description of the image",
  "objects": [{"name": "object name", "confidence": 0.95}, ...],
  "text": ["any text found in the image (OCR)", ...],
  "dominant_colors": ["#hexcolor", ...],
  "category": "image category (e.g. nature, portrait, document, product, etc.)"
}

Rules:
- description: 1-3 sentences describing the scene and content
- objects: list all detectable objects with confidence as decimal 0-1
- text: list any visible text (OCR). Empty array if none found
- dominant_colors: up to 5 dominant colors as hex codes (e.g. "#3B82F6")
- category: a single short label for the image type`;

  app.get('/', (req, res) => res.status(200).send('API Live'));

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No file uploaded' });

      const bucket = process.env.AWS_S3_BUCKET_NAME || 'ai-image-storage-pawankonwar-2026';
      const region = process.env.AWS_REGION || 'us-east-1';
      const ext = path.extname(req.file.originalname) || '.jpg';
      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

      const parallelUpload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: 'public-read',
        },
      });

      console.log('Uploading to S3...');
      await parallelUpload.done();

      const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: s3Url } }, { type: 'text', text: ANALYSIS_PROMPT }] }],
        max_tokens: 1024,
      });

      const rawContent = response.choices[0].message.content;
      const jsonString = rawContent.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonString);

      const record = await Image.create({
        description: parsed.description ?? null,
        objects: parsed.objects ?? [],
        text: parsed.text ?? [],
        dominant_colors: parsed.dominant_colors ?? [],
        category: parsed.category ?? null,
        image_url: s3Url,
      });

      console.log('✅ Saved to DB. ID:', record.id);
      console.log('Final Record Sent to Frontend:', record);
      return res.json(record);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/history', async (req, res) => {
    try {
      const images = await Image.findAll({ order: [['id', 'DESC']] });
      const formattedImages = images.map (img => ({
        ...img.toJSON(),
        date: img.createdAt
      }))
      return res.json(formattedImages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/health', (req, res) => res.status(200).send('Server is Up'));

  app.delete('/api/history/:id', async (req, res) => {
    try {
      console.log('--- STARTING S3 DELETE ---');
      const { id } = req.params;

      const item = await Image.findByPk(id);
      if (!item) return res.status(404).json({ error: 'Record not found' });

      const imageUrl = item.image_url || item.s3_url;
      if (imageUrl && imageUrl.includes('.amazonaws.com/')) {
        const extractedKey = imageUrl.split('.amazonaws.com/')[1];
        const bucket = process.env.AWS_S3_BUCKET_NAME || 'ai-image-storage-pawankonwar-2026';
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: extractedKey }));
      }

      await item.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('❌ Delete Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});