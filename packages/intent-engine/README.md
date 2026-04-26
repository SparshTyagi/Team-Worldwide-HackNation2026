# Intent Engine Package

`packages/intent-engine` contains the on-device intent pipeline and compatibility entry points used by demos and tests.

## Key Paths

- `src/modules/user/brain` - canonical implementation.
- `brain` - compatibility wrappers for legacy imports.
- `llm` - compatibility wrappers for direct model utilities.

## Runtime Policy

Intent inference selects runtimes in this order:

1. Embedded ONNX inference (`INTENT_MODEL_PROVIDER=onnx` + `INTENT_ONNX_MODEL_PATH`).
2. Local small model inference (Ollama/OpenRouter small intent model path).
3. Deterministic classifier fallback.

This keeps on-device behavior resilient during demos and protects API contract stability.

## Tests

Run from repo root:

```bash
node --test packages/intent-engine/brain/__tests__/*.test.js
```
