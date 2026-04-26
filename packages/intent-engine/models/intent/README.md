# Intent ONNX Model Placeholder

Place the embedded intent classifier model at:

- `packages/intent-engine/models/intent/intent_classifier.onnx`

Runtime selection uses:

- `INTENT_MODEL_PROVIDER=onnx`
- `INTENT_ONNX_MODEL_PATH` (optional override, defaults to the path above)

The ONNX output should provide class logits aligned with `INTENT_LABELS` in `packages/intent-engine/src/modules/user/brain/contracts/schemas.js`.
