import os

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(base_dir, "intent_classifier.onnx")

    # Input features produced by buildFeatureVector in onnx-intent.js
    input_dim = 16
    output_dim = 7

    # Deterministic lightweight linear layer logits (X @ W + B)
    rng = np.random.default_rng(seed=2026)
    weights = rng.normal(loc=0.0, scale=0.15, size=(input_dim, output_dim)).astype(np.float32)
    bias = np.array([0.10, 0.35, 0.20, 0.05, 0.15, 0.08, -0.10], dtype=np.float32)

    input_tensor = helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, input_dim])
    output_tensor = helper.make_tensor_value_info("logits", TensorProto.FLOAT, [1, output_dim])

    weight_init = numpy_helper.from_array(weights, name="W")
    bias_init = numpy_helper.from_array(bias, name="B")

    gemm = helper.make_node(
        "Gemm",
        inputs=["input", "W", "B"],
        outputs=["logits"],
        alpha=1.0,
        beta=1.0,
        transA=0,
        transB=0,
    )

    graph = helper.make_graph(
        nodes=[gemm],
        name="intent_classifier_linear",
        inputs=[input_tensor],
        outputs=[output_tensor],
        initializer=[weight_init, bias_init],
    )

    model = helper.make_model(
        graph,
        producer_name="team-worldwide-hacknation2026",
        opset_imports=[helper.make_operatorsetid("", 13)],
    )
    onnx.checker.check_model(model)
    onnx.save(model, output_path)
    print(output_path)


if __name__ == "__main__":
    main()
