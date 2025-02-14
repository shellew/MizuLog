document.addEventListener('DOMContentLoaded', () => {
    const currentIntakeDisplay = document.getElementById('current-intake');
    const logButtons = document.querySelectorAll('.log-button');
    const resetButton = document.getElementById('reset-button');
    const dailyGoalDisplay = document.getElementById('goal');
    const setGoalButton = document.getElementById('set-goal-button');
    const goalInput = document.getElementById('goal-input');
    const progressBarInner = document.getElementById('progress-bar-inner');
    const historyList = document.getElementById('history-list');

    function updateHistory(record = null, clear = false) {
        if (clear) {
            historyList.innerHTML = '';
            return;
        }

        if (record) {
            const listItem = document.createElement('li');
            listItem.textContent = `${record.amount}ml at ${record.time}`;
            historyList.insertBefore(listItem, historyList.firstChild);
        } else {
            fetch('/history')
            .then(response => response.json())
            .then(data => {
                historyList.innerHTML = '';
                data.forEach(record => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${record.amount}ml at ${record.time}`;
                    historyList.appendChild(listItem);
                });
            });
        }
    }

    logButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.dataset.amount, 10);
            fetch('/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount })
            })
                .then(response => response.json())
                .then(data => {
                    currentIntakeDisplay.textContent = `${data.current_intake}ml`;
                    updateProgressBar(data.progress);

                    const currentTime = new Date().toLocaleTimeString('en-us', { hour12: false });
                    updateHistory({ amount: amount, time: currentTime });
                });
        });
    });

    resetButton.addEventListener('click', () => {
        fetch('/reset', {
            method: 'POST',
        })
            .then(response => response.json())
            .then(data => {
                currentIntakeDisplay.textContent = `${data.current_intake}ml`;
                updateProgressBar(data.progress);

                updateHistory(null, true);
            });
    });

    setGoalButton.addEventListener('click', () => {
        const newGoal = parseInt(goalInput.value, 10);
        if (isNaN(newGoal) || newGoal <= 0) {
            alert('目標は0以上を入力してください！');
            return;
        }

        fetch('/set-goal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ goal: newGoal })
        })
            .then(response => response.json())
            .then(data => {
                dailyGoalDisplay.textContent = `${data.daily_goal}ml`;
                goalInput.value = '';
                updateProgressBar(data.progress);
            });
    });

    function updateProgressBar(progress) {
        progressBarInner.style.width = `${progress}%`;
    }



    updateHistory()
});