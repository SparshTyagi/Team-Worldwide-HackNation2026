# On-Device SLM Setup

This project uses two models:

- **On-device small model (intent generation):** `nemotron-3-nano:4b` via Ollama
- **Server-side large model (offer generation):** `nvidia/nemotron-3-super-120b-a12b:free` via OpenRouter

Use this guide to configure both on-device intent paths:

- Embedded ONNX runtime (preferred edge path).
- Local small model via Ollama (fallback path).

## 1) Install Ollama

### macOS (Homebrew)

```bash
brew install ollama
```

Start it once and keep it running:

```bash
brew services start ollama
```

If you do not want a background service:

```bash
OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=q8_0 ollama serve
```

### Linux

Install with the official script:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Start as a systemd service (recommended):

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

Check service status:

```bash
systemctl status ollama --no-pager
```

If you prefer manual start:

```bash
OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=q8_0 ollama serve
```

### Windows

Install Ollama from:

- [https://ollama.com/download/windows](https://ollama.com/download/windows)

After install, start Ollama from Start Menu (or let it auto-start on login).

You can verify it is running from PowerShell:

```powershell
ollama --version
```

If needed, manually start server in PowerShell:

```powershell
ollama serve
```

## 2) Pull NVIDIA Nemotron 3 Nano 4B

```bash
ollama pull nemotron-3-nano:4b
```

Confirm the model is installed:

```bash
ollama list
```

You should see `nemotron-3-nano:4b`.

## 3) Configure environment variables

Update `apps/api/.env` for server-side generation:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_SERVER_LARGE_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

For local intent model routing (small model fallback), add these in your local shell/session:

```bash
INTENT_MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_INTENT_MODEL=nemotron-3-nano:4b
```

For embedded ONNX runtime routing (preferred edge path), add:

```bash
INTENT_MODEL_PROVIDER=onnx
INTENT_ONNX_MODEL_PATH=./packages/intent-engine/models/intent/intent_classifier.onnx
# optional if your ONNX model expects a non-default input name
INTENT_ONNX_INPUT_NAME=input
```

In GDPR edge mode, keep `INTENT_MODEL_PROVIDER=onnx` as default. If ONNX is unavailable, runtime falls back to local Ollama, then deterministic heuristic.

The runtime policy is:

1. ONNX embedded model (when configured and available),
2. local small model (Ollama),
3. deterministic classifier fallback.

## 4) Verify local small model is responding

```bash
curl -s http://127.0.0.1:11434/api/chat -d '{
  "model": "nemotron-3-nano:4b",
  "stream": false,
  "messages": [{"role":"user","content":"Reply exactly: local intent model ready"}]
}'
```

Expected: response JSON with `"model":"nemotron-3-nano:4b"` and assistant content `"local intent model ready"`.

### Windows PowerShell equivalent

```powershell
$body = @{
  model = "nemotron-3-nano:4b"
  stream = $false
  messages = @(@{ role = "user"; content = "Reply exactly: local intent model ready" })
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:11434/api/chat" -ContentType "application/json" -Body $body
```

## 5) Run a full end-to-end check with intent + offer models

```bash
set -a
source apps/api/.env
set +a
export INTENT_MODEL_PROVIDER=onnx
export OLLAMA_BASE_URL=http://127.0.0.1:11434
export OLLAMA_INTENT_MODEL=nemotron-3-nano:4b
node apps/api/scripts/e2e-full-models.js
```

Windows PowerShell equivalent:

```powershell
$env:INTENT_MODEL_PROVIDER="onnx"
$env:INTENT_ONNX_MODEL_PATH="./packages/intent-engine/models/intent/intent_classifier.onnx"
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
$env:OLLAMA_INTENT_MODEL="nemotron-3-nano:4b"
node apps/api/scripts/e2e-full-models.js
```

This run validates:

- intent source is local-only (`embedded_onnx` when ONNX is available, otherwise `local_small_model`)
- server uses large OpenRouter model for offers (`used_fallback: false`)
- redemption updates merchant budget and returns `merchant_budget` in response

Logs are written under `apps/api/logs/e2e-full-models-*`.
- Check `00.intent-runtime.plan.json` and `summary.json` in the run directory for selected provider, `intent_source`, and `intent_model`.

## Troubleshooting

- **`could not connect to a running Ollama instance`**
  - Start Ollama with `brew services start ollama` or `ollama serve`.
- **Linux service not running**
  - Run `sudo systemctl start ollama` and verify with `systemctl status ollama --no-pager`.
- **Windows cannot connect to `127.0.0.1:11434`**
  - Ensure Ollama app is running, then retry PowerShell request.
- **`SUPABASE_URL and SUPABASE_KEY must be defined`**
  - Ensure those keys are present in `apps/api/.env` and exported in your shell.
- **Intent generation falls back or fails**
  - Ensure `INTENT_MODEL_PROVIDER=onnx` (or `ollama`) and `OLLAMA_INTENT_MODEL=nemotron-3-nano:4b` are set in the same shell session.
- **ONNX model not loaded**
  - Ensure `INTENT_MODEL_PROVIDER=onnx`, `INTENT_ONNX_MODEL_PATH` points to a valid file, and the environment has ONNX runtime support.
