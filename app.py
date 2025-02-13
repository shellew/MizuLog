from flask import Flask, render_template, request, jsonify

# Flaskアプリの作成
app = Flask(__name__)

# 初期データ
current_intake = 0
DAILY_GOAL = 0

@app.route('/')
def index():
    return render_template("/MizuLog/index.html", daily_goal=DAILY_GOAL, current_intake=current_intake)

@app.route('/log', methods=['POST'])
def log_intake():
    global current_intake
    amount = int(request.json.get('amount', 0))
    current_intake += amount
    return jsonify({
        'current_intake': current_intake
    })

@app.route('/reset', methods=['POST'])
def reset_intake():
    global current_intake
    current_intake = 0
    return jsonify({
        'current_intake': current_intake
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

# アプリの実行
if __name__ == '__main__':
    app.run(debug=True)