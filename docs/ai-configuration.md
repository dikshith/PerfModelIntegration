# AI Configuration

## Model providers
- OpenAI: requires OPENAI_API_KEY, choose a compatible model (e.g., gpt-4o-mini)
- Ollama: requires OLLAMA_BASE_URL in production (public HTTPS tunnel). apiKey optional.

## Defaults
- If OPENAI_API_KEY is set, default provider=openai. Otherwise, provider=ollama when OLLAMA_BASE_URL is set.

## Deleting configs
- Safe: conversation history FK uses onDelete: SET NULL to avoid errors when removing an active config.
