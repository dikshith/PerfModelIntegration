# RAG Implementation

## Overview
- Server-side only: files never parsed in the browser.
- Supported: PDF, TXT. PDFs parsed via pdf-parse; Unicode normalization + sanitization applied.
- Heuristics detect scanned PDFs (mostly images) and return an extractive fallback with OCR advice.

## Indexing
- Files land in backend/uploads.
- On boot, the service builds an in-memory index of chunks with metadata.
- Chunking: size ~400, overlap ~60; cosine scoring and top-3 chunks used.
- Context cap ~2.4KB to respect latency and provider limits; citations included.

## Query flow
- At chat time, if useRag is true and allowed, retrieve top chunks and compact into the prompt.
- If no readable text or low confidence, return extractive fallback advising OCR or better source.

## Production gating
- RAG is disabled online by default due to Heroku constraints.
- Enable with ALLOW_RAG_IN_PROD=true. Ensure persistent storage and tight timeouts.

## Providers
- OpenAI (when OPENAI_API_KEY) or Ollama via PageKite (with HTTPS + Host header, `/api/version` precheck, keep_alive 10m, num_ctx 2048, timeout ~28s).

## Notes
- Large PDFs should be split before upload.
- Clean up uploads to avoid memory bloat in long-running sessions.
