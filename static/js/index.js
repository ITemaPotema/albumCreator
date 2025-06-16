document.getElementById('logoutBtn').addEventListener('click', async function() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            window.location.href = '/auth'; // Перенаправляем на страницу входа
        }

        else {
            alert('Ошибка при выходе из системы');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при выходе из системы');
    }
});