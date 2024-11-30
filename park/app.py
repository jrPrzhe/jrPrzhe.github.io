from flask import Flask, jsonify
from flask_socketio import SocketIO
import redis
import json
import time
import threading

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

redis_client = redis.StrictRedis(host='195.133.145.104', port=6379, decode_responses=True)

def fetch_and_emit_data():
    while True:
        data = {key: redis_client.get(key) for key in redis_client.keys('*')}
        socketio.emit('update_data', data)  # Отправляем данные всем подключенным клиентам
        time.sleep(2)  # Интервал обновления

@app.route("/", methods=["GET"])
def get_data():
    try:
        data = {key: redis_client.get(key) for key in redis_client.keys('*')}
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Запускаем фоновую задачу для отправки обновлений
thread = threading.Thread(target=fetch_and_emit_data)
thread.daemon = True
thread.start()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
