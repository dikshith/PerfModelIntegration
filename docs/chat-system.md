# Chat System

## Endpoints
- POST /api/chat/message: { message, sessionId?, ragMode? } → creates/continues a session and persists user/assistant messages
- GET /api/chat/history/:sessionId: returns ordered messages
- POST /api/chat/upload: uploads knowledge documents (PDF/txt/md)

## Behavior
- Always persists messages with metadata (ragModeUsed, model, fallback flags).
- RAG mode adds server-side context; extractive fallback is used when generation fails.
