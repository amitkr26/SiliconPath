import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import opportunitiesRouter from './routes/opportunities';
import newsRouter from './routes/news';
import aiRouter from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Routing
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/news', newsRouter);
app.use('/api/ai', aiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'SiliconPath-Render-Backend', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Render Backend Server running on port ${PORT}`);
});
