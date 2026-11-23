import cv2
import numpy as np
import tensorflow as tf

model = tf.keras.models.load_model('./models/deepfake2.keras')


def crop_face(img_arr):
    img_arr = cv2.cvtColor(img_arr, cv2.COLOR_BGR2RGB)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(
        img_arr,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
    )

    if len(faces) > 0:
        x, y, w, h = faces[0]

        margin = 200
        x_margin = max(0, x - margin)
        y_margin = max(0, y - margin)
        w_margin = min(img_arr.shape[1], w + 2 * margin)
        h_margin = min(img_arr.shape[0], h + 2 * margin)

        cropped_face = img_arr[y_margin:y_margin+h_margin, x_margin:x_margin+w_margin]
        cropped_face = cv2.resize(cropped_face, (224, 224)) / 255.0
        return cropped_face

    return -1


def image_classifier(img_path):
    img_arr = cv2.imread(img_path)
    if img_arr is None:
        return {"result": -1, "confidence": 0.0, "label": "No face detected"}

    face = crop_face(img_arr)
    if not isinstance(face, np.ndarray):
        return {"result": -1, "confidence": 0.0, "label": "No face detected"}

    model_input = np.expand_dims(face, axis=0)
    probabilities = model.predict(model_input, verbose=0)[0]
    result = int(np.argmax(probabilities))
    confidence = float(probabilities[result])
    label = "Fake" if result == 1 else "Real"

    return {
        "result": result,
        "confidence": round(confidence, 4),
        "confidence_percent": round(confidence * 100, 2),
        "label": label,
    }


def video_classifier(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return -1

    count = 0

    while cap.isOpened():
        ret, frame = cap.read()

        if not ret:
            break

        count += 1
        if count % 3 != 0:
            continue

        face = crop_face(frame)
        if not isinstance(face, np.ndarray):
            continue

        data = np.expand_dims(face, axis=0)
        pred = np.argmax(model.predict(data, verbose=0))

        if pred == 1:
            cap.release()
            return 1

    cap.release()

    if count == 0:
        return -1

    return 0


