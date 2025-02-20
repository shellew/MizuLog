document.addEventListener('DOMContentLoaded', () => {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = crypto.randomUUID(); // ランダムなUUIDを生成
        localStorage.setItem('user_id', userId);
    }
    console.log('User ID:', userId);
    window.userId = userId;

    fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
    }).then(response => {
        if (!response.ok) {
            console.error("Filed to load page:", response.statusText)
        }
    });

    const currentIntakeDisplay = document.getElementById('current-intake');
    const logButtons = document.querySelectorAll('.log-button');
    const resetButton = document.getElementById('reset-button');
    const dailyGoalDisplay = document.getElementById('goal');
    const setGoalButton = document.getElementById('set-goal-button');
    const progressBarInner = document.getElementById('progress-bar-inner');
    const historyList = document.getElementById('history-list');
    const goalModal = document.getElementById('goal-modal');
    const goalOptionsContainer = document.getElementById('goal-options');
    const cancelGoalButton = document.getElementById('cancel-goal');

    function updateHistory(record = null, clear = false) {
        // clearがtrueの場合、履歴リストを空にする
        if (clear) {
            historyList.innerHTML = '';
            fillEmptyHistory(3);
            return;
        }

        // recordが渡された場合、リストを生成し先頭に追加
        if (record) {
            const listItem = document.createElement('li');
            listItem.textContent = `${record.amount}ml at ${record.time}`;
            historyList.insertBefore(listItem, historyList.firstChild);

            while (historyList.childElementCount > 3) {
                historyList.removeChild(historyList.lastChild);
            }
            fillEmptyHistory(3); //必要なら空の履歴を補完
        } else {
            fetch('/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: window.userId })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                } return response.json()
            })
            .then(data => {
                historyList.innerHTML = '';
                data.slice(-3).reverse().forEach(record => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${record.amount}ml at ${record.time}`;
                    historyList.appendChild(listItem);
                });
                fillEmptyHistory(3);
            })
            .catch(error => {
                console.error("Failed to fetch history:", error);
            })
        }
    }
    
    function fillEmptyHistory(requiredCount) {
        while (historyList.childElementCount < requiredCount) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = '---';
            emptyItem.classList.add('empty');
            historyList.appendChild(emptyItem);
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
                body: JSON.stringify({ 
                    user_id: window.userId,
                    amount: amount
                 })
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Log Response Data:", data);
                    currentIntakeDisplay.textContent = `${data.current_intake}ml`;
                    updateProgressBar(data.progress);

                    const currentTime = new Date().toLocaleTimeString('en-us', { hour12: false });
                    updateHistory({ amount: amount, time: currentTime });
                })
                .catch(error => {
                    console.error("Failed to log water intake:", error);
                });
        });
    });

    resetButton.addEventListener('click', () => {
        fetch('/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: window.userId })
        })
            .then(response => response.json())
            .then(data => {
                currentIntakeDisplay.textContent = `${data.current_intake}ml`;
                updateProgressBar(data.progress);

                updateHistory(null, true);
            });
    });

    function createGoalButtons() {
        const maxGoal = 5000;
        const step = 200;
        let row;

        for (let i = 200; i <= maxGoal; i += step) {
            if ((i -200) % 1000 === 0) {
                row = document.createElement('div');
                row.classList.add('button-row');
                goalOptionsContainer.appendChild(row);
            }

            const button = document.createElement('button');
            button.textContent = `${i}ml`;
            button.dataset.goal = i;
            button.classList.add('goal-button');

            button.addEventListener('click', () => {
                const selecteGoal = parseInt(button.dataset.goal, 10);
        
                fetch('/set-goal', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        user_id: window.userId,
                        goal: selecteGoal 
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        dailyGoalDisplay.textContent = `${data.daily_goal}ml`;
                        goalModal.classList.add('hidden');
                    })
                    .catch(error => {
                        console.error("Failed to set goal:", error)
                    });
            });

            row.appendChild(button);
        }
    }

    function updateProgressBar(progress) {
        progressBarInner.style.width = `${progress}%`;
        updatePercentageDisplay(progress);
    }

    function updatePercentageDisplay(progress) {
        const percentageDisplay = document.getElementById('current-percentage');
        percentageDisplay.textContent = `${progress}%`
    }

    updateHistory();

    createGoalButtons();

    setGoalButton.addEventListener('click', () => {
        goalModal.classList.remove('hidden');
    });

    cancelGoalButton.addEventListener('click', () => {
        goalModal.classList.add('hidden');
    });

    goalModal.addEventListener('click', (event) => {
        if (event.target === goalModal) {
            goalModal.classList.add('hidden');
        }
    });


});