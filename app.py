from flask import Flask, render_template, request, jsonify, send_from_directory
import sqlite3
from flask_cors import CORS
import os

# Flaskアプリの作成
app = Flask(__name__)
CORS = (app)

DATABASE = 'mizu.db'

def init_db():
    """データベースを初期化"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # テーブルが存在しない場合のみ作成
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            daily_goal INTEGER DEFAULT 0
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS intakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT ,
            amount INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        data = request.get_json()
        user_id = data.get('user_id')
        if not user_id:
            return "User ID is required index", 400

        conn = get_db_connection()

        # ユーザーが存在しない場合は登録
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if not user:
            conn.execute('INSERT INTO users (id, daily_goal) VALUES (?, ?)', (user_id, 0))
            conn.commit()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        daily_goal = user['daily_goal']
        current_intake = conn.execute(
            'SELECT SUM(amount) AS total FROM intakes WHERE user_id = ? AND DATE(timestamp) = DATE("now", "localtime")',
            (user_id,)
        ).fetchone()['total'] or 0
        conn.close()
        return {
            "daily_goal": daily_goal,
            "current_intake": current_intake,
            "message": "User initialized"
        }
    
    user_id = request.args.get('user_id', None)
    daily_goal = 0
    current_intake = 0

    if user_id:
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if user:
            daily_goal = user['daily_goal']
            current_intake = conn.execute(
                'SELECT SUM(amount) AS total FROM intakes WHERE user_id = ? AND DATE(timestamp) = DATE("now", "localtime")',
                (user_id,)
            ).fetchone()['total'] or 0
        conn.close()

    return render_template("/MizuLog/index.html", daily_goal=daily_goal, current_intake=current_intake)

@app.route('/log', methods=['POST'])
def log_intake():
    data = request.get_json()
    user_id = data.get('user_id')
    amount = int(data.get('amount', 0))

    if not user_id:
        return "User ID is required", 400
    
    conn = get_db_connection()
    conn.execute('INSERT INTO intakes (user_id, amount, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)', (user_id, amount))
    conn.commit()

    current_intake = conn.execute(
        'SELECT SUM(amount) AS total FROM intakes WHERE user_id = ? AND DATE(timestamp) = DATE("now", "localtime")',
        (user_id,)
    ).fetchone()['total'] or 0
    daily_goal = conn.execute('SELECT daily_goal FROM users WHERE id = ?',(user_id,)).fetchone()['daily_goal']
    conn.close()

    progress = round((current_intake / daily_goal) * 100) if daily_goal else 0
    return jsonify({
        'current_intake': current_intake,
        'progress': progress
    })

@app.route('/reset', methods=['POST'])
def reset_intake():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return "User ID is required", 400

    conn = get_db_connection()
    conn.execute('DELETE FROM intakes WHERE user_id = ? AND DATE(timestamp) = DATE("now", "localtime")', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({
        'current_intake': 0,
        'progress': 0
    })

@app.route('/set-goal', methods=['POST'])
def set_goal():
    data = request.get_json()
    user_id = data.get('user_id')
    new_goal = int(data.get('goal', 0))

    if not user_id:
        return "User ID is required", 400

    conn = get_db_connection()
    conn.execute('UPDATE users SET daily_goal = ? WHERE id = ?', (new_goal, user_id))
    conn.commit()
    conn.close()
    return jsonify({
        'daily_goal': new_goal
    })

@app.route('/history', methods=['POST'])
def get_history():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return "User ID is required", 400
    
    conn = get_db_connection()
    history = conn.execute(
        'SELECT amount, timestamp FROM intakes WHERE user_id = ? AND DATE(timestamp) = DATE("now", "localtime")',
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([{'amount': row['amount'], 'time': row['timestamp']} for row in history])

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# アプリの実行
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    init_db()
    app.run(host="0.0.0.0", port=port)