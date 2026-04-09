import json
import os
from flask import Flask, send_file, request, jsonify

app = Flask(__name__)
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DATA_FILE = os.path.join(DATA_DIR, "data.json")


def read_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def write_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


@app.route("/")
def index():
    return send_file("index.html")


@app.route("/api/data", methods=["GET"])
def get_data():
    data = read_data()
    if data is None:
        return jsonify(None)
    return jsonify(data)


@app.route("/api/data", methods=["POST"])
def save_data():
    data = request.get_json()
    write_data(data)
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
