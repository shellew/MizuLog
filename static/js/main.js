document.addEventListener('DOMContentLoaded', () => {
    const currentIntakeDisplay = document.getElementById('current-intake');
    const logButtons = document.querySelectorAll('.log-button');
    const resetButton = document.getElementById('reset-button');
    

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
            })
    })
});