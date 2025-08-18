# PageKite Setup for Ollama

Use PageKite to expose your local Ollama to the internet so the Heroku backend can reach it.

## Steps
1) Install and run Ollama locally; pull required models.
2) Install PageKite and create a subdomain.
3) Tunnel your local Ollama port (11434) to the subdomain:
   - Example: pagekite.py 11434 <subdomain>.pagekite.me
4) Verify: https://<subdomain>.pagekite.me/api/version returns JSON from Ollama.
5) Set on Heroku: OLLAMA_BASE_URL=https://<subdomain>.pagekite.me

## Backend behavior
- Automatically upgrades http→https for PageKite and sets Host header.
- Performs a precheck to `/api/version` to fail fast if unreachable.
- Uses keep_alive=10m and tuned timeouts to stay under Heroku's 30s router limit.
