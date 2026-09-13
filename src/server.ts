import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { webhookRouter } from './routes/webhookRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rotas da API
  app.use('/api/webhooks', webhookRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Servir arquivos estáticos do dashboard
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createServer();
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`\n🤖 SDR IA Nina rodando na porta ${PORT}`);
    console.log(`📊 Painel Operacional: http://localhost:${PORT}`);
    console.log(`🔗 Webhook de Leads: http://localhost:${PORT}/api/webhooks/lead-form`);
    console.log(`💬 Webhook WhatsApp: http://localhost:${PORT}/api/webhooks/meta-whatsapp\n`);
  });
}
