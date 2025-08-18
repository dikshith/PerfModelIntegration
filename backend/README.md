# Backend API Server

**NestJS-based backend for the AI Chat System with RAG and Performance Analytics.**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run start:dev
```

**API will be available at:** http://localhost:3001

## 📋 Key Features

- **🤖 Multi-AI Support**: OpenAI GPT and Ollama integration
- **📚 RAG System**: Document upload and semantic search
- **📊 Performance Analytics**: AI-powered reporting
- **💾 Data Persistence**: SQLite (dev) / PostgreSQL (prod)
- **📝 API Documentation**: Swagger at `/api/docs`
- **🔒 Security**: CORS, Helmet, validation middleware

## 🛠 Available Scripts

```bash
npm run start:dev    # Development with hot-reload
npm run build        # Build for production
npm run start:prod   # Production server
npm run test         # Run tests
```

## 📡 API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/ai-configuration` | Create/update AI config |
| `POST /api/chat/message` | Send chat message |
| `POST /api/chat/upload` | Upload RAG documents |
| `GET /api/chat/history/:sessionId` | Get chat history |
| `POST /api/performance/report` | Generate AI report |
| `GET /api/health` | Health check |

## ⚙️ Configuration

### Environment Variables
```bash
# AI Providers
OPENAI_API_KEY=sk-your-key-here
OLLAMA_BASE_URL=http://localhost:11434

# Database (SQLite for development)
DATABASE_TYPE=sqlite

# Server
PORT=3001
NODE_ENV=development
```

### For Production (PostgreSQL)
```bash
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=username
DATABASE_PASSWORD=password
DATABASE_NAME=database_name
```

## 🏗 Project Structure

```
src/
├── controllers/     # API endpoints and request handling
├── services/        # Business logic and AI integration
├── entities/        # Database models (TypeORM)
├── dto/             # Request/response data structures
├── modules/         # Feature modules organization
├── config/          # App configuration and validation
├── database/        # Database setup and migrations
└── utils/           # Helper functions and utilities
```

## 🔧 Development Notes

- **Database**: Auto-creates SQLite file on first run
- **File Uploads**: Stored in `/uploads` directory
- **Logs**: Winston logs in `/logs` directory
- **Hot Reload**: Automatic restart on file changes
- **API Docs**: Auto-generated Swagger documentation

## 🌐 Deployment

### Heroku Production
```bash
# Deploy to Heroku with PostgreSQL
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0
git push heroku main
```

### Local with Docker
```bash
# Build and run with Docker
docker build -t ai-backend .
docker run -p 3001:3001 ai-backend
```

For complete setup instructions, see the main project README.
