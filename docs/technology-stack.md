# Technology Stack Overview

## 🏗 Full Stack Architecture

This AI Chat System leverages a modern, scalable technology stack designed for performance, maintainability, and developer experience.

## 🔧 Backend Technologies

### Core Framework
- **NestJS 10+** - Progressive Node.js framework with decorators and dependency injection
- **TypeScript 5+** - Type-safe JavaScript with advanced features
- **Node.js 18+** - JavaScript runtime with modern ES modules support

### Database Layer  
- **TypeORM** - Object-relational mapping with decorators
- **SQLite** - Development database (file-based)
- **PostgreSQL** - Production database (cloud-ready)

### AI Integration
- **OpenAI SDK** - GPT models integration (GPT-3.5/GPT-4)
- **Ollama HTTP API** - Local AI models via REST calls
- **Custom RAG System** - Document-based knowledge enhancement

### Utilities & Middleware
- **Winston** - Advanced logging with multiple transports
- **Multer** - Multipart file upload handling
- **Helmet** - Security headers middleware
- **CORS** - Cross-origin resource sharing
- **Swagger/OpenAPI** - API documentation generation

## 🎨 Frontend Technologies

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 18** - Modern React with concurrent features
- **TypeScript 5+** - Full-stack type safety

### State Management
- **TanStack Query** - Server state management and caching
- **React Hooks** - Local state management
- **localStorage** - Client-side persistence

### UI & Styling  
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library built on Radix UI
- **Radix UI** - Unstyled, accessible UI primitives
- **Class Variance Authority** - Component variant management
- **Tailwind Merge** - Class name utility functions

### Data Visualization
- **Recharts** - React charting library
- **Lucide React** - Modern icon library
- **React Hook Form** - Form state and validation

## 🚀 Development & Deployment

### Development Tools
- **PowerShell Scripts** - Windows automation and process management
- **PageKite** - HTTP/HTTPS tunneling for local AI access
- **Python 2.7** - PageKite runtime environment

### Build & Deployment
- **Vercel** - Frontend deployment platform
- **Heroku** - Backend deployment platform
- **Docker** - Containerization (production)
- **GitHub Actions** - CI/CD pipelines

### Code Quality
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Static type checking

## 🔐 Security & Performance

### Security Measures
- **Helmet.js** - Security headers
- **CORS Configuration** - Cross-origin protection  
- **Input Validation** - DTOs with class-validator
- **File Upload Security** - Type and size restrictions

### Performance Optimizations
- **React Query Caching** - Smart data fetching and caching
- **Next.js Optimizations** - Automatic code splitting and image optimization  
- **Database Indexing** - Optimized query performance
- **Lazy Loading** - Component-level code splitting

## 🌐 External Services

### AI Providers
- **OpenAI API** - GPT models for chat and completion
- **Ollama** - Local AI models (Llama 2, Mistral, etc.)

### Infrastructure
- **Heroku PostgreSQL** - Managed database service
- **Vercel Edge Functions** - Serverless compute
- **PageKite Service** - Tunneling service for local development

## 📊 Monitoring & Analytics

### Logging
- **Winston Logger** - Structured logging with multiple levels
- **File Rotation** - Automated log management
- **Console Transport** - Development logging

### Analytics
- **Custom Analytics System** - Performance metrics collection
- **AI-Powered Reporting** - Intelligent insights generation
- **Real-time Monitoring** - System health tracking

## 🔧 Development Workflow

### Local Development
1. **Backend**: NestJS with auto-reload and hot module replacement
2. **Frontend**: Next.js with fast refresh and TypeScript checking
3. **Database**: SQLite for quick development cycles
4. **AI Testing**: PageKite tunneling for Ollama integration

### Production Deployment
1. **Backend**: Heroku with PostgreSQL and environment variables
2. **Frontend**: Vercel with automatic deployments
3. **Database**: Managed PostgreSQL with connection pooling
4. **Monitoring**: Winston logging with external log aggregation

## 🎯 Key Architecture Decisions

### Why NestJS?
- **Enterprise-grade**: Decorator-based architecture similar to Angular/Spring
- **TypeScript First**: Built with TypeScript from the ground up
- **Modular**: Clear separation of concerns with modules
- **Dependency Injection**: Clean, testable code architecture

### Why Next.js 15?
- **App Router**: Modern routing with layouts and server components
- **Performance**: Automatic optimizations and edge computing
- **Developer Experience**: Excellent TypeScript support and debugging
- **Deployment**: Seamless Vercel integration

### Why TanStack Query?
- **Server State**: Specialized for API data management
- **Caching**: Intelligent background updates and stale data handling
- **DevTools**: Excellent debugging experience
- **TypeScript**: Full type safety for API calls

### Why Tailwind + Shadcn/ui?
- **Consistency**: Design system with reusable components
- **Accessibility**: Built-in accessibility features
- **Customization**: Easy theming and variant management
- **Developer Experience**: IntelliSense and rapid development

This technology stack provides a robust foundation for building scalable AI applications with modern development practices and excellent user experience.
