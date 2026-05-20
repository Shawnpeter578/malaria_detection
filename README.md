# 🦠 Malaria Detection AI

Malaria is still one of the world’s most dangerous diseases, especially in regions where quick medical testing is difficult to access. This project was built to explore how Artificial Intelligence and Computer Vision can help in detecting malaria from microscopic blood cell images.

The application allows users to upload blood smear images, after which a deep learning model analyzes the image and predicts whether the cell is infected or uninfected. The system also provides a confidence score for the prediction.

This project combines machine learning, backend development, and web technologies into one complete application.

---

# 🚀 Features

- 🔬 Detect malaria from blood cell images
- 🧠 Deep Learning powered image classification
- 📊 Confidence score for predictions
- 📁 Upload custom blood smear images
- ⚡ Fast local predictions
- 🌐 Full-stack web application
- 💾 SQLite database integration
- 📈 Designed for future improvements and deployment

---

# 🛠️ Technologies Used

## Frontend
- HTML
- CSS
- JavaScript

## Backend
- Node.js
- Express.js

## Machine Learning
- Python
- TensorFlow / Keras
- OpenCV
- NumPy

## Database
- SQLite

---

# 📂 Project Structure

```bash
malaria_detection/
│
├── client/                 # Frontend files
├── server/                 # Backend API
├── model/                  # Trained AI model
├── dataset/                # Malaria dataset
├── uploads/                # Uploaded images
├── scripts/                # Python scripts
├── database/               # SQLite database
├── README.md
└── package.json
```

---

# 🧪 Dataset

The model was trained using the malaria cell image dataset from Kaggle:

https://www.kaggle.com/datasets/iarunava/cell-images-for-detecting-malaria

The dataset contains thousands of:
- Parasitized cell images
- Uninfected cell images

---

# ⚙️ Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/Shawnpeter578/malaria_detection.git
cd malaria_detection
```

---

## 2️⃣ Install Backend Dependencies

```bash
npm install
```

---

## 3️⃣ Install Python Dependencies

```bash
pip install tensorflow opencv-python numpy pillow flask
```

---

## 4️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
DATABASE_URL=sqlite.db
```

---

# ▶️ Running the Project

## Start the Backend Server

```bash
npm start
```

or

```bash
nodemon index.js
```

---

## Run the Prediction Script

```bash
python predict.py
```

---

# 🧠 Model Training

The AI model was trained using Convolutional Neural Networks (CNNs), a type of deep learning architecture commonly used for image recognition tasks.

Training techniques included:
- Image augmentation
- Rescaling
- Rotation
- Zoom transformations
- Validation splitting

The goal was to improve the model’s ability to recognize infected cells from different image variations.

---

# 📸 How It Works

1. Upload a blood smear image
2. The image is preprocessed
3. The AI model analyzes the cell
4. A prediction is generated:
   - Infected
   - Uninfected
5. The confidence score is displayed to the user

In simple terms, the project acts like a digital microscope powered by AI.

---

# 📈 Future Improvements

Some ideas planned for future versions:

- 🏥 Doctor dashboard
- ☁️ Cloud deployment
- 📱 Mobile application
- 📊 Advanced analytics
- 🔍 Detection for multiple diseases
- 🤖 Improved model accuracy using advanced architectures

---

# 🤝 Contributing

Contributions are welcome.

If you would like to improve the project:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Commit and push your updates
5. Open a Pull Request

---

# 📜 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

Made by Shawn Peter

GitHub:
https://github.com/Shawnpeter578

---

# ⭐ Support

If you found this project interesting or helpful:

- Give the repository a star ⭐
- Share it with others
- Build something even better from it 🚀
