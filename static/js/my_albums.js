let currentAlbumIdToDelete = null;

// Функция для показа модального окна подтверждения удаления
function confirmDelete(albumId, albumTitle) {
    currentAlbumIdToDelete = albumId;
    document.getElementById('albumTitleToDelete').textContent = albumTitle;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Обработчики для кнопок модального окна
document.getElementById('confirmDeleteBtn').addEventListener('click', async function() {
    if (currentAlbumIdToDelete) {
        try {
            const response = await fetch(`/api/album/${currentAlbumIdToDelete}/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                // Удаляем карточку альбома из DOM
                const albumCard = document.querySelector(`.album-card[data-album-id="${currentAlbumIdToDelete}"]`);
                if (albumCard) {
                    albumCard.remove();
                }

                // Проверяем, остались ли еще альбомы
                const albumsGrid = document.querySelector('.albums-grid');
                if (albumsGrid && albumsGrid.children.length === 0) {
                    // Если альбомов не осталось, показываем сообщение
                    location.reload(); // Или можно создать empty-state динамически
                }

            else if (response.status === 401) {
                    window.location.href = `/auth`;
            }


            } else {
                alert('Ошибка при удалении альбома');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при удалении альбома');
        }
    }

    // Закрываем модальное окно в любом случае
    document.getElementById('deleteModal').style.display = 'none';
    currentAlbumIdToDelete = null;
});

document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
    document.getElementById('deleteModal').style.display = 'none';
    currentAlbumIdToDelete = null;
});

// Закрытие модального окна при клике вне его
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('deleteModal')) {
        document.getElementById('deleteModal').style.display = 'none';
        currentAlbumIdToDelete = null;
    }
});