require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const familiasRouter = require('./routes/familias');
const tiposRouter = require('./routes/tipos');
const produtosRouter = require('./routes/produtos');
const movimentacoesRouter = require('./routes/movimentacoes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const backendApiToken = process.env.BACKEND_API_TOKEN?.trim();

if (isProduction && !backendApiToken) {
  throw new Error('BACKEND_API_TOKEN e obrigatorio em producao. Configure-o nas variaveis da Vercel.');
}

const frontendOrigin = process.env.FRONTEND_ORIGIN?.split(',').map(origin => origin.trim()).filter(Boolean) || [];
const corsOptions = {
  origin(origin, callback) {
    if (!origin || frontendOrigin.length === 0 || frontendOrigin.includes('*') || frontendOrigin.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Origem nao permitida pelo CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Em producao, apenas o proxy do Cloudflare Pages conhece este token.
app.use('/api', (req, res, next) => {
  if (!backendApiToken) return next();

  const authorization = req.get('authorization') || '';
  const recebido = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const esperadoBuffer = Buffer.from(backendApiToken);
  const recebidoBuffer = Buffer.from(recebido);
  const autorizado = esperadoBuffer.length === recebidoBuffer.length
    && crypto.timingSafeEqual(esperadoBuffer, recebidoBuffer);

  if (!autorizado) {
    return res.status(401).json({ error: 'Acesso nao autorizado.' });
  }
  next();
});

app.use('/api/familias', familiasRouter);
app.use('/api/tipos', tiposRouter);
app.use('/api/produtos', produtosRouter);
app.use('/api/movimentacoes', movimentacoesRouter);

// O mesmo npm start serve a API e todo o frontend, sem Live Server.
if (!process.env.VERCEL) {
  const frontendDir = path.join(__dirname, '..', '..', 'frontend');
  const qrCodeLibrary = path.join(__dirname, '..', 'node_modules', 'qrcodejs', 'qrcode.min.js');
  const qrScannerLibrary = path.join(__dirname, '..', 'node_modules', 'html5-qrcode', 'html5-qrcode.min.js');
  app.get('/vendor/qrcode.min.js', (req, res) => res.sendFile(qrCodeLibrary));
  app.get('/vendor/html5-qrcode.min.js', (req, res) => res.sendFile(qrScannerLibrary));
  app.get('/sw.js', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(frontendDir, 'sw.js'));
  });
  app.use(express.static(frontendDir));
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Rota da API nao encontrada.' }));

// tratamento genérico de erro
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ API do Arquivo Morto rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
