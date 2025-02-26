document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert("ユーザーIDが見つかりません");
        return;
    }

    const historyGet = document.getElementById('history-get');

    function fetchHistory() {
        const selecteDate = document.getElementById('datePicker').value;
        if (!selecteDate) {
            alert("日付を選択してください");
            return;
        }

        fetch('/history', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_id: userId, mode: 'date', target_date: selecteDate })
        })
        .then(response => response.json())
        .then(data => {
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = '';
    
            if (data.length === 0) {
                historyList.innerHTML = "<li>履歴がありません</li>";
            } else {
                data.forEach(entry => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${entry.time}: ${entry.amount}ml`;
                    historyList.appendChild(listItem);
                });
            }
        })
        .catch(error => console.error('error:', error));
    }

    historyGet.addEventListener('click', fetchHistory);

});