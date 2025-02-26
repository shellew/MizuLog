document.addEventListener('DOMContentLoaded', function () {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert("ユーザーIDが見つかりません");
        return;
    }

    fetch('/dashboard-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error("Error:", data.error);
            return;
        }

        const dates = data.map(entry => entry.date);
        const intakeValues = data.map(entry => entry.total_intake);

        const ctx = document.getElementById('water-intake-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: "水分摂取量 (ml)",
                    data: intakeValues,
                    backgroundColor: "rgba(54, 162, 235, 0.5)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    })
    .catch(error => console.error("Error fetching dashboard data:", error));
});