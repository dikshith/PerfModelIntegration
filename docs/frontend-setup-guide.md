# Frontend Setup Guide: Building the AI Chat Interface

## Quick start (local)
1) cd frontend && npm install
2) Configure env: create .env.local
   - NEXT_PUBLIC_API_BASE=http://localhost:3001
3) npm run dev

## Production (Vercel)
- Set NEXT_PUBLIC_API_BASE to your backend base URL (e.g., https://your-backend.example.com). Do not include /api; the app will append it.
- The frontend never talks to Ollama directly; all chat and RAG calls go to the backend.

## RAG UX
- Toggle RAG mode from the chat header. Upload PDFs/text to enrich answers.
- The UI shows responses even when generation fails by refetching persisted fallbacks.

## Provider configuration UI
- OpenAI: requires apiKey and model.
- Ollama: apiKey optional. In production, baseUrl must be a public HTTPS tunnel (e.g., PageKite). In dev, localhost is fine.

## 🎯 Overview

This guide walks you through recreating the frontend from scratch, building a modern React-based chat interface with Next.js 15, TypeScript, and advanced state management. While focusing primarily on backend architecture, this frontend guide shows how to create a responsive, performant UI that seamlessly integrates with our AI backend.

## 🏗 Project Foundation

### 1. Initialize Next.js 15 Project

Create a new Next.js project with the latest features:

```bash
npx create-next-app@latest ai-chat-frontend --typescript --tailwind --eslint --app
cd ai-chat-frontend
```

This command sets up Next.js 15 with the App Router, TypeScript integration, Tailwind CSS, and ESLint configuration. The App Router provides modern routing with layouts, server components, and streaming capabilities.

### 2. TypeScript Configuration Strategy

The TypeScript setup enables full-stack type safety:
- Strict mode for comprehensive error catching
- Path mapping for clean imports (`@/components`, `@/lib`)
- Next.js plugin integration for enhanced development experience
- Incremental compilation for faster builds

This configuration ensures type safety across the entire frontend codebase and provides excellent developer experience with IntelliSense and error detection.

### 3. Essential Dependencies Installation

**Core Framework:**
- `@tanstack/react-query` - Server state management with intelligent caching
- `axios` - HTTP client for API communication
- `react-hook-form` - Form handling with minimal re-renders
- `sonner` - Toast notifications for user feedback

**UI Components:**
- `@radix-ui/react-*` - Accessible UI primitives
- `class-variance-authority` - Component variant management
- `clsx` and `tailwind-merge` - Conditional styling utilities
- `lucide-react` - Modern icon library

**Development:**
- `@types/node` - Node.js type definitions
- `eslint-config-next` - Next.js specific linting rules

## 🎨 Styling Architecture with Tailwind CSS

### Design System Implementation

The styling system uses Tailwind CSS with a custom design system:

**Color System:**
- CSS custom properties for theme flexibility
- HSL color space for better manipulation
- Dark/light mode support through CSS variables
- Semantic color naming (primary, secondary, destructive, etc.)

**Component Variants:**
- Class Variance Authority for type-safe component variants
- Consistent sizing scales across all components
- Responsive design patterns built into component system
- Accessibility considerations in all component states

### Shadcn/ui Integration

The component library follows a copy-paste approach:
- Components are added to your codebase, not installed as dependencies
- Full customization control over styling and behavior
- Built on Radix UI primitives for accessibility
- Consistent API across all components

This approach gives complete control over the component library while maintaining consistency and accessibility standards.

## 🔄 State Management Architecture

### TanStack Query Implementation

The state management strategy uses TanStack Query for server state:

**Query Management:**
- Automatic background refetching for fresh data
- Intelligent caching with stale-while-revalidate patterns
- Optimistic updates for immediate UI feedback
- Error boundary integration for robust error handling

**Cache Strategy:**
- 5-minute cache for configuration data
- 30-second cache for chat messages
- Aggressive invalidation on mutations
- Background refetching for real-time updates

**Custom Hooks Pattern:**
- `useActiveConfiguration` - AI provider settings
- `useChatHistory` - Message retrieval with session support  
- `useSendMessage` - Message sending with optimistic updates
- `useUploadDocument` - File upload for RAG functionality

### Local State Management

Local component state uses React hooks effectively:

**useState for UI State:**
- Form inputs and temporary UI state
- Modal and dropdown visibility
- Loading states and user interactions

**useEffect for Side Effects:**
- Local storage synchronization
- URL parameter management
- Event listener setup and cleanup

**useCallback and useMemo:**
- Performance optimization for expensive calculations
- Stable references for child components
- Memoized derived state computations

## 💬 Chat System Implementation

### Real-time Chat Architecture

The chat interface implements sophisticated message handling:

**Message Flow:**
1. User input validation and sanitization
2. Optimistic UI updates for immediate feedback  
3. API request with error handling and retries
4. Response streaming for real-time AI responses
5. Message persistence with session management
6. UI updates with loading states and animations

**Session Management:**
- Persistent sessions across browser refreshes
- URL-based session routing for deep linking
- Local storage backup for session recovery
- Session restoration from server when available

**RAG Integration:**
- Toggle switch for RAG mode activation
- File upload interface with drag-and-drop
- Document processing feedback
- Context indication in AI responses

### Message Rendering System

The message display system handles various content types:

**Message Types:**
- User messages with timestamp and formatting
- AI responses with typing animations
- System messages for status updates
- Error messages with retry capabilities

**Content Processing:**
- Markdown rendering for formatted responses
- Code block syntax highlighting
- Link detection and safe rendering
- Image and file attachment support

## 📊 Analytics Dashboard Architecture

### Data Visualization Strategy

The analytics system provides comprehensive performance insights:

**Chart Implementation:**
- Recharts library for responsive data visualization
- Real-time chart updates with streaming data
- Interactive tooltips and zoom capabilities
- Export functionality for data analysis

**Metrics Display:**
- KPI cards with trend indicators
- Historical data with time range selection
- Alert systems for threshold violations
- Comparative analysis across time periods

**Performance Monitoring:**
- API response time tracking
- Error rate visualization
- User engagement metrics
- System health indicators

## 🔧 Component Architecture

### Reusable Component Design

The component system follows atomic design principles:

**Atoms (Basic Elements):**
- Button variants with consistent styling
- Input fields with validation states
- Icons with consistent sizing and colors
- Typography components with semantic meaning

**Molecules (Component Combinations):**
- Form fields with labels and validation
- Message bubbles with user/AI differentiation
- Card layouts with headers and actions
- Navigation elements with active states

**Organisms (Complex Components):**
- Chat interface with message history
- Configuration panels with form validation
- Analytics dashboards with multiple charts
- File upload zones with progress indicators

### Accessibility Implementation

Every component includes accessibility features:
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management for modal dialogs
- Screen reader compatibility
- Color contrast compliance

## 🚀 Performance Optimization

### Code Splitting Strategy

The application implements strategic code splitting:

**Route-based Splitting:**
- Each page loads independently
- Shared components bundled efficiently
- Dynamic imports for heavy components
- Prefetching for anticipated navigation

**Component-level Splitting:**
- Lazy loading for analytics charts
- Conditional loading for advanced features
- Progressive enhancement for optional functionality

### Rendering Optimization

Performance optimizations throughout the application:

**React Optimization:**
- useMemo for expensive calculations
- useCallback for stable function references
- React.memo for component memoization
- Key props for efficient list rendering

**Next.js Optimization:**
- Image optimization with next/image
- Font optimization with next/font
- Automatic bundle analysis and optimization
- Edge runtime for improved performance

## 🔐 Security Considerations

### Client-side Security

The frontend implements security best practices:

**Input Sanitization:**
- XSS prevention through proper escaping
- Content Security Policy implementation
- Safe HTML rendering with sanitization
- File upload validation and restrictions

**API Security:**
- Secure token storage and management
- Request/response validation
- Error message sanitization
- Rate limiting awareness

## 🌐 Deployment Strategy

### Production Build Optimization

The build process optimizes for production:

**Build Configuration:**
- TypeScript strict mode for error catching
- ESLint and Prettier for code quality
- Bundle analysis for size optimization
- Environment variable management

**Vercel Deployment:**
- Automatic deployments from Git
- Edge function utilization
- CDN optimization for static assets
- Performance monitoring and analytics

## 🔗 Backend Integration

### API Client Architecture

The API layer provides seamless backend integration:

**HTTP Client Configuration:**
- Axios interceptors for request/response handling
- Automatic error handling and retry logic
- Request timeout and cancellation
- Response data transformation

**Type Safety:**
- Shared TypeScript interfaces between frontend/backend
- API response type validation
- Request payload type checking
- Generated types from OpenAPI specifications

### Real-time Communication

The system supports real-time features:

**WebSocket Integration:**
- Real-time message updates
- Typing indicators for AI responses
- Connection state management
- Reconnection logic for reliability

**Server-Sent Events:**
- One-way data streaming from server
- Analytics data updates
- System status notifications
- Performance metric streaming

## 🎯 Development Workflow

### Local Development Setup

The development environment provides excellent developer experience:

**Hot Reloading:**
- Instant feedback on code changes
- Preserved application state during reloads
- Error overlay with detailed stack traces
- TypeScript error reporting in browser

**Development Tools:**
- React DevTools for component inspection
- TanStack Query DevTools for cache debugging  
- Browser extension support for debugging
- Comprehensive logging for troubleshooting

### Testing Integration

Testing strategy for reliable frontend development:

**Component Testing:**
- React Testing Library for user-centric tests
- Jest for unit testing and mocking
- MSW (Mock Service Worker) for API mocking
- Accessibility testing with jest-axe

**End-to-end Testing:**
- Playwright for full browser testing
- User journey testing scenarios
- Cross-browser compatibility testing
- Performance testing in real conditions

This frontend architecture creates a modern, accessible, and performant user interface that seamlessly integrates with the sophisticated backend AI system, providing users with an excellent chat experience and comprehensive analytics capabilities.
