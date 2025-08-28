# Frontend Web Application

**Next.js React frontend for the AI Chat System with RAG and Performance Analytics.**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with backend API URL

# Start development server
npm run dev
```

**App will be available at:** http://localhost:3000

## 📋 Key Features

- **💬 Real-time Chat**: Persistent chat sessions with AI
- **📚 RAG Integration**: Upload documents for contextual responses
- **🎛️ AI Configuration**: Switch between OpenAI and Ollama models
- **📊 Analytics Dashboard**: Performance metrics and AI insights
- **🎨 Modern UI**: Tailwind CSS + Shadcn/ui components
- **📱 Responsive Design**: Mobile-friendly interface

## 🛠 Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
```

## 🏗 Project Structure

```
app/                 # Next.js App Router pages
├── chat/           # Chat interface page
├── analytics/      # Performance analytics page
├── config/         # AI configuration page
└── layout.tsx      # Root layout

components/          # Reusable UI components
├── ui/             # Base components (buttons, inputs, etc.)
└── root-layout-client.tsx

features/           # Feature-specific components
├── chat/           # Chat functionality
├── ai-config/      # AI configuration forms
└── analytics/      # Analytics charts

lib/                # Utilities and configurations
├── api/            # API client and hooks
├── services/       # Business logic
└── utils.ts        # Helper functions
```

## ⚙️ Configuration

### Environment Variables (.env.local)
```bash
# Backend API Base (no trailing /api — the app will append /api automatically)
NEXT_PUBLIC_API_BASE=http://localhost:3001

# For production deployment
NEXT_PUBLIC_API_BASE=https://your-backend.example.com
```

## 📡 Key Components

### Chat Interface
- **Real-time messaging** with AI providers
- **Session persistence** across page reloads
- **RAG mode toggle** for document-enhanced responses
- **Message history** with timestamps

### AI Configuration
- **Provider selection** (OpenAI/Ollama)
- **Model selection** per provider
- **Parameter tuning** (temperature, max tokens)
- **Configuration persistence**

### Analytics Dashboard
- **Performance metrics** visualization
- **AI-powered insights** and recommendations
- **Health scoring** with trend analysis
- **Interactive charts** using Recharts

### Document Upload (RAG)
- **Drag & drop interface** for file uploads
- **Progress indicators** during processing
- **Knowledge base management**
- **Document preview** and organization

## 🎨 UI Components

Built with modern, accessible components:
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Lucide React** for icons
- **Recharts** for data visualization
- **React Hook Form** for forms

## 📱 Responsive Design

- **Mobile-first** approach
- **Tablet optimization**
- **Desktop layouts**
- **Touch-friendly** interactions

## 🔗 API Integration

Uses **TanStack Query** for:
- **Caching** API responses
- **Background updates**
- **Optimistic updates**
- **Error handling**
- **Loading states**

## 🌐 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variable: `NEXT_PUBLIC_API_BASE` (e.g., https://your-backend.example.com)
3. Optionally, set `public/config.json` at deploy time to point to your backend; the env var overrides it when present
4. Deploy automatically on git push

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Docker
```bash
# Build and run with Docker
docker build -t ai-frontend .
docker run -p 3000:3000 ai-frontend
```

For complete setup instructions, see the main project README.
