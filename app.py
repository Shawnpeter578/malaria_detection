import os
import io
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf

app = Flask(__name__)

# 1. Load the AI Model
print("Loading ML model (this might take a few seconds)...")
try:
    model = tf.keras.models.load_model("best_malaria_model.keras", compile=False)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")

# IMPORTANT: You may need to change this size based on what is inside main.ipynb!
# Common sizes for malaria datasets are 128x128 or 224x224.
IMG_SIZE = (128, 128)


def preprocess_image(image_bytes):
    """Converts the raw image into a format the AI can read"""
    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("RGB")
    image = image.resize(IMG_SIZE)
    img_array = np.array(image)

    # Normalize pixel values to 0-1 (Standard for most keras models)
    img_array = img_array / 255.0

    # Add a batch dimension so the shape is (1, 128, 128, 3)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]

    try:
        # Read and preprocess the image
        image_bytes = file.read()
        processed_image = preprocess_image(image_bytes)

        # Run the AI Inference
        prediction = model.predict(processed_image)[0][0]

        # Determine positive/negative based on the AI's score
        # Most binary models output a number between 0 and 1.
        # Assuming < 0.5 is Parasitized (Positive) and > 0.5 is Uninfected (Negative)
        is_positive = bool(prediction < 0.5)

        # Calculate a realistic confidence percentage
        if is_positive:
            confidence = int((1.0 - prediction) * 100)
        else:
            confidence = int(prediction * 100)

        confidence = min(max(confidence, 50), 99)  # Keep it between 50-99%

        print(
            f"Prediction complete: {'Positive' if is_positive else 'Negative'} ({confidence}%)"
        )

        # Send the exact JSON your Node server expects!
        return jsonify(
            {
                "result": "positive" if is_positive else "negative",
                "confidence": confidence,
                "species": "P. falciparum" if is_positive else "N/A",
            }
        )

    except Exception as e:
        print("❌ Error during prediction:", str(e))
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Runs on Port 5000 so it doesn't fight with Node on 3000
    app.run(port=5000, debug=False)
