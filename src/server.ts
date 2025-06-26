import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { whatsappService } from './services/whatsapp';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api', apiRoutes);

// Webhook da Evolution API
app.post('/webhook', async (req, res) => {
  try {
    await whatsappService.processWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ success: false });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CRMWP'
  });
});

// Rota principal - Interface web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Página de mensagens
app.get('/messages', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/messages.html'));
});

// Página de contatos
app.get('/contacts', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contacts.html'));
});

// Página de configurações
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/settings.html'));
});

// Capturar todas as outras rotas e servir o index.html (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 CRMWP rodando na porta ${PORT}`);
  console.log(`📱 Interface: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`📞 Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 