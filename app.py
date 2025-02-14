from flask import Flask, render_template, request, jsonify
from datetime import datetime

# Flaskアプリの作成
app = Flask(__name__)

# 初期データ
current_intake = 0
DAILY_GOAL = 0
progress = 0
intake_history = []

@app.route('/')
def index():
    return render_template("/MizuLog/index.html", daily_goal=DAILY_GOAL, current_intake=current_intake, intake_history=intake_history)

@app.route('/log', methods=['POST'])
def log_intake():
    global current_intake, intake_history
    amount = int(request.json.get('amount', 0))
    current_intake += amount
    progress = round((current_intake / DAILY_GOAL) * 100)
    intake_history.append({
        'amount': amount,
        'time': datetime.now().strftime('%H:%M')
    })
    return jsonify({
        'current_intake': current_intake,
        'progress': progress
    })

@app.route('/reset', methods=['POST'])
def reset_intake():
    global current_intake, intake_history
    current_intake = 0
    intake_history = []
    return jsonify({
        'current_intake': current_intake,
        'progress': 0
    })

@app.route('/set-goal', methods=['POST'])
def set_goal():
    global DAILY_GOAL
    goal = int(request.json.get('goal', 0))
    if goal > 0:
        DAILY_GOAL = goal
    return jsonify({
        'daily_goal': DAILY_GOAL
    })

@app.route('/history', methods=['GET'])
def get_history():
    return jsonify(intake_history)

# アプリの実行
if __name__ == '__main__':
    app.run(debug=True)