// @ts-nocheck
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request, Response } from 'express';

const app = express();
const PORT = 8080;

// Enable CORS for all origins (including Vercel)
app.use(cors({
  origin: ['https://upwork-llmproject.vercel.app', 'http://localhost:3000', 'https://localhost:3000'],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests early
app.options('*', cors());

// Proxy all requests to local Ollama
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:11434',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // Keep the /api path
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    (res as Response).status(500).json({
      error: 'Failed to connect to local Ollama',
      message: 'Make sure Ollama is running on localhost:11434'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} -> http://localhost:11434${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Set CORS headers on outgoing response
    const origin = (req.headers.origin as string) || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      (req.headers['access-control-request-headers'] as string) || 'Content-Type, Authorization, Accept'
    );
  }
}));

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'running',
    message: 'Ollama CORS Proxy Server',
    port: PORT,
    target: 'http://localhost:11434',
    note: 'This proxy allows Vercel to access your local Ollama'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Ollama CORS Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to http://localhost:11434`);
  console.log(`🌐 Allowing requests from https://upwork-llmproject.vercel.app`);
  console.log(`\n💡 To use this proxy, update your Ollama configuration base URL to:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n🔧 Make sure Ollama is running on localhost:11434`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Ollama CORS Proxy...');
  process.exit(0);
});
