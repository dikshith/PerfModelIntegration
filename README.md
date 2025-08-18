# AI Chat System with RAG and Performance Analytics

## 📋 Overview

This is a comprehensive AI-powered chat system built with modern web technologies. The application features:

- **🤖 Multi-AI Provider Support**: OpenAI GPT models and local Ollama integration
- **📚 RAG (Retrieval Augmented Generation)**: Upload documents for contextual AI responses
- **📊 Performance Analytics**: AI-powered performance insights and reporting
- **🚀 Real-time Chat**: Persistent chat sessions with message history
- **☁️ Cloud Deployment**: Production-ready deployment on Heroku and Vercel
- **🔧 Local Development**: Easy local setup with tunneling support

## 🏗 Architecture

### Frontend (Next.js + React)
- **Framework**: Next.js 15 with App Router
- **UI Components**: Tailwind CSS + Shadcn/ui components  
- **State Management**: TanStack Query for API state management
- **Charts**: Recharts for performance visualizations
- **Authentication**: Session-based with persistent storage

### Backend (NestJS + TypeScript)
- **Framework**: NestJS with Express
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: TypeORM with migrations
- **AI Integration**: OpenAI API and Ollama REST API
- **File Upload**: Multer for RAG document processing
- **Logging**: Winston with rotating file logs

### Deployment Infrastructure
- **Production Backend**: Heroku with PostgreSQL addon
- **Production Frontend**: Vercel with automatic deployments
- **Local Tunneling**: PageKite for Ollama access from web apps
- **Development**: Local servers with hot-reload

## 📁 Project Structure

```
LLM_Prompt_Upwork/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── controllers/     # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── entities/        # Database models
│   │   ├── dto/             # Data transfer objects
│   │   ├── modules/         # Feature modules
│   │   ├── config/          # App configuration
│   │   ├── database/        # DB setup & migrations
│   │   └── utils/           # Helper functions
│   ├── uploads/             # RAG document storage
│   ├── logs/                # Application logs
│   └── database.sqlite      # Local SQLite database
├── frontend/                # Next.js React app
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable UI components
│   ├── features/            # Feature-specific components
│   ├── lib/                 # Utilities and API client
│   └── public/              # Static assets
├── pagekite_env/            # Python environment for tunneling
├── simple-menu.ps1          # 🎯 Interactive menu for easy management
├── launch-ollama-pagekite.ps1  # 🚀 Script to start Ollama + PageKite
├── pagekite_clean.py        # 🧹 Clean PageKite tunnel interface
├── pagekite.py              # 📡 Full PageKite implementation
└── README.md                # 📖 This documentation
```

### 🎯 Key Files Explained

#### Tunneling & Management Scripts
- **`simple-menu.ps1`** - Your main interface! Interactive menu for managing services
- **`launch-ollama-pagekite.ps1`** - Automated script that starts both Ollama and PageKite tunnel
- **`pagekite_clean.py`** - Simplified Python interface for PageKite tunneling
- **`pagekite.py`** - Complete PageKite client implementation
- **`pagekite_env/`** - Python virtual environment with PageKite dependencies

## � Quick Setup Guide

### Method 1: Interactive Menu (Recommended)
The easiest way to get started with Ollama and PageKite:

```bash
# In the project root directory
.\simple-menu.ps1
```

The menu provides:
- **Quick Start**: Launches with default subdomain (lucacirillo1234)
- **Custom Start**: Use your own subdomain
- **Check Status**: Verify services are running
- **Stop Services**: Clean shutdown

### Method 2: Direct Script Launch
```bash
# Launch with default subdomain
.\launch-ollama-pagekite.ps1

# Launch with custom subdomain  
.\launch-ollama-pagekite.ps1 -Subdomain "yourname"
```

### Method 3: Manual Setup

### Method 3: Manual Setup

#### Prerequisites
- **Node.js** 18+ with npm
- **Python** 3.7+ (for PageKite tunneling)
- **Ollama** (optional, for local AI models)

### 1. Clone Repository
```bash
git clone <repository-url>
cd LLM_Prompt_Upwork
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys and configuration

# Start development server
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start development server
npm run dev
```

### 4. Ollama + PageKite Setup (For Local AI with Web Access)

#### Option A: Using the Interactive Menu
```bash
# From project root
.\simple-menu.ps1
# Choose option 1 for quick start or option 2 for custom subdomain
```

#### Option B: Manual Setup
```bash
# Activate PageKite Python environment
.\pagekite_env\Scripts\Activate.ps1

# Start Ollama + PageKite tunnel
.\launch-ollama-pagekite.ps1

# Or with custom subdomain
.\launch-ollama-pagekite.ps1 -Subdomain "yourname"
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Ollama (Local)**: http://localhost:11434
- **Ollama (Public)**: https://yoursubdomain.pagekite.me

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_TYPE=sqlite                    # sqlite | postgres
DATABASE_HOST=localhost                 # For PostgreSQL
DATABASE_PORT=5432                     # For PostgreSQL
DATABASE_USERNAME=your_username         # For PostgreSQL
DATABASE_PASSWORD=your_password         # For PostgreSQL
DATABASE_NAME=database_name             # For PostgreSQL

# API Keys
OPENAI_API_KEY=your_openai_api_key_here

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434  # Local Ollama
# OLLAMA_BASE_URL=https://your-tunnel-url # For tunneled Ollama

# Server Configuration
PORT=3001
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Logging
LOG_LEVEL=info
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### AI Provider Configuration

#### OpenAI Setup
1. Get API key from https://platform.openai.com/api-keys
2. Add to backend `.env`: `OPENAI_API_KEY=sk-...`
3. Models available: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`

#### Ollama Setup (Local AI)
1. Install Ollama: https://ollama.ai/
2. Start Ollama service: `ollama serve`
3. Pull models: `ollama pull llama2` or `ollama pull mistral`
4. Backend will auto-detect at `http://localhost:11434`

#### Ollama with PageKite (Web Access)
1. Activate PageKite environment:
```bash
# Windows PowerShell
.\pagekite_env\Scripts\Activate.ps1
```

2. Install and configure PageKite:
```bash
pip install pagekite
pagekite.py 11434 yourname.pagekite.me
```

#### Ollama with PageKite (Web Access)

**PageKite allows your local Ollama instance to be accessible from the web, enabling your deployed frontend to connect to your local AI models.**

##### Available Scripts:
- `simple-menu.ps1` - **Interactive menu for easy management**
- `launch-ollama-pagekite.ps1` - Direct launcher script
- `pagekite_clean.py` - Clean PageKite tunnel interface
- `pagekite.py` - Full PageKite implementation

##### Script Usage:

**Interactive Menu (Recommended):**
```bash
.\simple-menu.ps1
```
Menu options:
1. **Quick Start** - Uses default subdomain `lucacirillo1234.pagekite.me`
2. **Custom Start** - Enter your own subdomain
3. **Check Status** - Verify Ollama and PageKite status
4. **Stop Services** - Clean shutdown of all services
5. **Exit** - Close menu

**Direct Launch:**
```bash
# Default subdomain
.\launch-ollama-pagekite.ps1

# Custom subdomain
.\launch-ollama-pagekite.ps1 -Subdomain "myapp"
```

**Manual PageKite:**
```bash
# Activate Python environment
.\pagekite_env\Scripts\Activate.ps1

# Start PageKite tunnel
python pagekite_clean.py 11434 myapp.pagekite.me
```

##### What the Scripts Do:
1. **Stop existing Ollama processes**
2. **Set CORS environment variables** (`OLLAMA_ORIGINS=*`)
3. **Start Ollama server** on `0.0.0.0:11434`
4. **Wait for Ollama to be ready** (health check)
5. **Start PageKite tunnel** to make it publicly accessible
6. **Provide cleanup** on Ctrl+C

##### Backend Configuration:
After starting the tunnel, update your backend `.env`:
```bash
OLLAMA_BASE_URL=https://yoursubdomain.pagekite.me
```

3. Update backend `.env`:
```bash
OLLAMA_BASE_URL=https://yourname.pagekite.me
```

## 🔄 Complete Workflow Guide

### Scenario 1: Local Development Only
**For testing with OpenAI or local-only Ollama:**

1. **Start Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Configure AI Provider**:
   - Visit: http://localhost:3000/config
   - Choose OpenAI or Ollama (local)
   - Set API keys/URLs as needed

### Scenario 2: Local Ollama with Web Access (Recommended)
**For using local Ollama models from deployed frontend:**

1. **Start Ollama + PageKite** (choose one method):
   
   **Method A - Interactive Menu:**
   ```bash
   .\simple-menu.ps1
   # Select option 1 (Quick Start) or 2 (Custom subdomain)
   ```
   
   **Method B - Direct Script:**
   ```bash
   .\launch-ollama-pagekite.ps1 -Subdomain "yourname"
   ```

2. **Update Backend Configuration**:
   ```bash
   # Edit backend/.env
   OLLAMA_BASE_URL=https://yourname.pagekite.me
   ```

3. **Start Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

5. **Test the Setup**:
   - Visit: http://localhost:3000/config
   - Select Ollama provider
   - Verify connection to your PageKite URL

### Scenario 3: Full Production Deployment
**For complete cloud deployment:**

1. **Deploy Backend to Heroku**:
   ```bash
   cd backend
   heroku create your-app-name
   heroku addons:create heroku-postgresql:essential-0
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set OLLAMA_BASE_URL=https://yourname.pagekite.me
   git push heroku main
   ```

2. **Deploy Frontend to Vercel**:
   - Connect GitHub repository to Vercel
   - Set `NEXT_PUBLIC_API_URL=https://your-heroku-app.herokuapp.com/api`
   - Deploy automatically on git push

3. **Keep Ollama + PageKite Running**:
   ```bash
   # Keep this running on your local machine
   .\simple-menu.ps1
   ```

4. **Access Your App**:
   - **Production Frontend**: https://your-app.vercel.app
   - **Production Backend**: https://your-heroku-app.herokuapp.com/api
   - **Local AI Tunnel**: https://yourname.pagekite.me

## 🎯 Key Features

### 1. AI Configuration Management
- **Multiple Providers**: Switch between OpenAI and Ollama models
- **Model Selection**: Choose from available models per provider
- **Parameter Tuning**: Adjust temperature, max tokens, etc.
- **Configuration Persistence**: Save and load AI configurations

### 2. RAG (Retrieval Augmented Generation)
- **Document Upload**: Support for text files, PDFs, and documents
- **Knowledge Base**: Persistent storage of uploaded content
- **Semantic Search**: Advanced search through uploaded documents
- **Context Integration**: Automatically include relevant context in AI responses

### 3. Chat System
- **Persistent Sessions**: Chat history saved across page reloads
- **Real-time Responses**: Streaming AI responses
- **Message History**: Full conversation history with timestamps
- **Session Management**: Clear conversations and start fresh

### 4. Performance Analytics
- **AI-Powered Reports**: Intelligent analysis of system performance
- **Health Scoring**: Automated system health assessment
- **Recommendations**: AI-generated optimization suggestions
- **Metrics Visualization**: Charts and graphs for performance data

### 5. API Endpoints

#### AI Configuration
- `GET /api/ai-configuration` - Get active configuration
- `POST /api/ai-configuration` - Create new configuration
- `PUT /api/ai-configuration/:id` - Update configuration

#### Chat & RAG
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:sessionId` - Get chat history
- `POST /api/chat/upload` - Upload RAG documents
- `GET /api/chat/knowledge` - List uploaded documents

#### Performance
- `GET /api/performance/metrics` - Get performance data
- `POST /api/performance/report` - Generate new report

#### Health Check
- `GET /api/health` - System health status

## 🌐 Deployment

### Production Deployment (Heroku + Vercel)

#### Backend on Heroku
1. **Create Heroku app**:
```bash
heroku create your-app-name
```

2. **Add PostgreSQL addon**:
```bash
heroku addons:create heroku-postgresql:essential-0
```

3. **Set environment variables**:
```bash
heroku config:set OPENAI_API_KEY=your_key_here
heroku config:set NODE_ENV=production
```

4. **Deploy**:
```bash
git push heroku main
```

#### Frontend on Vercel
1. **Connect GitHub repository** to Vercel
2. **Set environment variables**:
   - `NEXT_PUBLIC_API_URL=https://your-heroku-app.herokuapp.com/api`
3. **Deploy automatically** on git push

### Local Development with Tunneling

#### Using PageKite for Ollama Access
1. **Activate environment**:
```bash
.\pagekite_env\Scripts\Activate.ps1
```

2. **Start PageKite tunnel**:
```bash
pagekite.py 11434 yourname.pagekite.me
```

3. **Update configuration** to use tunneled URL

## 🛠 Development Guide

### Running the Full Stack Locally

1. **Start Backend**:
```bash
cd backend
npm run start:dev
```

2. **Start Frontend**:
```bash
cd frontend  
npm run dev
```

3. **Optional: Start Ollama** (for local AI):
```bash
ollama serve
```

4. **Optional: Setup PageKite** (for web access to Ollama):
```bash
.\pagekite_env\Scripts\Activate.ps1
pagekite.py 11434 yourname.pagekite.me
```

### Database Management

#### SQLite (Development)
- Database file: `backend/database.sqlite`
- Automatically created on first run
- View with SQLite browser tools

#### PostgreSQL (Production)
```bash
# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Generate new migration
npm run migration:generate -- -n MigrationName
```

### Adding New Features

#### Backend (NestJS)
1. **Create module**: `nest g module feature-name`
2. **Create controller**: `nest g controller feature-name`
3. **Create service**: `nest g service feature-name`
4. **Create entities**: Define database models
5. **Create DTOs**: Define API interfaces

#### Frontend (Next.js)
1. **Create page**: Add to `app/` directory
2. **Create components**: Add to `components/`
3. **Create API hooks**: Add to `lib/api/`
4. **Add types**: Update type definitions

## 🔍 API Documentation

### Swagger Documentation
- **URL**: http://localhost:3001/api/docs (development)
- **Features**: Interactive API testing, request/response schemas
- **Auto-generated**: Updates automatically from code annotations

### Key API Patterns

#### Request/Response Format
```typescript
// Success Response
{
  "data": any,
  "message": string,
  "timestamp": string
}

// Error Response  
{
  "error": string,
  "message": string,
  "statusCode": number,
  "timestamp": string
}
```

#### Pagination
```typescript
{
  "data": any[],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Unit tests
npm run test

# Integration tests  
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Testing
```bash
cd frontend

# Run tests
npm run test

# Test watch mode
npm run test:watch
```

## 📊 Monitoring & Logs

### Application Logs
- **Location**: `backend/logs/`
- **Files**: `combined.log`, `error.log`
- **Rotation**: Automatic log rotation
- **Levels**: error, warn, info, debug

### Performance Monitoring
- **Built-in Metrics**: Response times, error rates
- **Health Checks**: `/api/health` endpoint
- **Database Monitoring**: Query performance tracking

## 🔧 Troubleshooting

### Common Issues

#### Backend Won't Start
1. Check Node.js version (18+ required)
2. Verify environment variables in `.env`
3. Ensure database connectivity
4. Check port availability (default: 3001)

#### Frontend Won't Connect
1. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
2. Ensure backend is running and accessible
3. Check CORS configuration in backend

#### Ollama Connection Issues
1. Verify Ollama is running: `ollama list`
2. Check `OLLAMA_BASE_URL` in backend `.env`
3. Test direct access: `curl http://localhost:11434/api/tags`

#### RAG Not Working
1. Check file upload permissions in `backend/uploads/`
2. Verify file size limits in configuration
3. Check document processing logs

#### PageKite Tunneling Issues
1. **Python Environment**: Activate Python environment first
   ```bash
   .\pagekite_env\Scripts\Activate.ps1
   ```

2. **Missing `pagekite_clean.py`**: Now included in the project
   - Uses the main `pagekite.py` internally
   - Provides cleaner interface for tunnel management

3. **PageKite Account**: Ensure PageKite account is active
   - Visit: https://pagekite.net/
   - Sign up for free account if needed

4. **Subdomain Availability**: Check subdomain isn't taken
   - Try different subdomain names
   - Use your username + numbers (e.g., `yourname123`)

5. **Ollama Not Starting**: 
   ```bash
   # Check if Ollama is installed
   ollama --version
   
   # Test Ollama locally first
   ollama serve
   # In another terminal: curl http://localhost:11434/api/version
   ```

6. **PowerShell Script Errors**: 
   - Run as Administrator if needed
   - Use `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

7. **Port Conflicts**: Ensure port 11434 is not in use
   ```bash
   netstat -an | findstr 11434
   ```

#### Script Features:
- **Automatic Cleanup**: Scripts handle cleanup on exit
- **Health Checks**: Verify Ollama is ready before starting tunnel
- **Error Handling**: Graceful error messages and recovery
- **CORS Configuration**: Automatic CORS setup for web access
- **Process Management**: Clean start/stop of services

### Performance Optimization

#### Backend Optimization
- Enable Redis caching for frequent queries
- Optimize database queries with indexes
- Use connection pooling for database
- Implement rate limiting for APIs

#### Frontend Optimization
- Enable Next.js image optimization
- Implement proper caching strategies
- Use React.memo for expensive components
- Lazy load heavy components

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Linting rules enforced
- **Prettier**: Code formatting automated
- **Commit Messages**: Follow conventional commits

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check this documentation
2. Review API documentation at `/api/docs`
3. Check application logs in `backend/logs/`
4. Open an issue in the repository

---

## 📚 Additional Resources

- **NestJS Documentation**: https://docs.nestjs.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Ollama Documentation**: https://ollama.ai/docs
- **PageKite Documentation**: https://pagekite.net/docs/
- **TypeORM Documentation**: https://typeorm.io/
- **TailwindCSS Documentation**: https://tailwindcss.com/docs

Built with ❤️ using modern web technologies.
