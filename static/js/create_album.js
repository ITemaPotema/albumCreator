function albumApp() {
    return {
        isReordering: false,
        isSaving: false,
        hoveredSlide: null,
        albumTitle: '',
        albumDescription: '',
        albumTitleError: '',
        albumDescriptionError: '',
        newSlide: {
            title: '',
            text: '',
            image: null,
            imagePreview: null,
            order: 0
        },
        slideTitleError: '',
        slideTextError: '',
        slideImageError: '',
        slides: [],
        editingIndex: null,

        toggleReordering() {
            this.isReordering = !this.isReordering;
            if (!this.isReordering) {
                // При завершении сортировки обновляем порядок
                this.slides.forEach((slide, index) => {
                    slide.order = index + 1;
                });
            }
        },

        handleImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
                // Проверяем, что файл является изображением
                if (!file.type.match('image.*')) {
                    this.slideImageError = 'Пожалуйста, загрузите изображение (JPG, PNG, GIF)';
                    document.getElementById('slideImage').value = '';
                    this.newSlide.image = null;
                    this.newSlide.imagePreview = null;
                    return;
                }

                this.slideImageError = '';
                this.newSlide.image = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newSlide.imagePreview = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                this.newSlide.image = null;
                this.newSlide.imagePreview = null;
            }
        },

        validateSlide() {
            let isValid = true;

            // Проверка заголовка
            if (!this.newSlide.title || this.newSlide.title.trim() === '') {
                this.slideTitleError = 'Пожалуйста, введите заголовок слайда';
                isValid = false;
            } else {
                this.slideTitleError = '';
            }

            // Проверка текста
            if (!this.newSlide.text || this.newSlide.text.trim() === '') {
                this.slideTextError = 'Пожалуйста, введите текст слайда';
                isValid = false;
            } else {
                this.slideTextError = '';
            }

            // Проверка изображения (только при добавлении нового слайда)
            if (this.editingIndex === null && !this.newSlide.image) {
                this.slideImageError = 'Пожалуйста, загрузите изображение для слайда';
                isValid = false;
            } else {
                this.slideImageError = '';
            }

            return isValid;
        },

        validateAlbum() {
            let isValid = true;

            if (!this.albumTitle || this.albumTitle.trim() === '') {
                this.albumTitleError = 'Пожалуйста, введите название альбома';
                isValid = false;

            } else {
                this.albumTitleError = '';
            }

            if (!this.albumDescription || this.albumDescription.trim() === '') {
                this.albumDescriptionError = 'Пожалуйста, введите описание альбома';
                isValid = false;

            } else {
                this.albumDescriptionError = '';
            }


            if (this.slides.length === 0) {
                alert('Добавьте хотя бы один слайд в альбом');
                isValid = false;
            }

            return isValid;
        },

        addSlide() {
            if (this.slides.length >= 20) {
                alert('Достигнуто максимальное количество слайдов (20)');
                return;
            }

            // Проверяем валидность данных перед добавлением
            if (!this.validateSlide()) {
                return;
            }

            if (this.editingIndex !== null) {
                // Редактирование существующего слайда
                this.slides[this.editingIndex] = { ...this.newSlide };
                this.editingIndex = null;
            } else {
                // Добавление нового слайда
                const order = this.slides.length + 1;
                this.slides.push({ ...this.newSlide, order });
            }

            this.clearForm();
        },

        editSlide(index) {
            this.editingIndex = index;
            this.newSlide = { ...this.slides[index] };
            // Прокручиваем к форме для удобства редактирования
            document.getElementById('slideTitle').scrollIntoView({ behavior: 'smooth' });
        },

        removeSlide(index) {
            if (confirm('Вы уверены, что хотите удалить этот слайд?')) {
                this.slides.splice(index, 1);
                // Обновляем порядок после удаления
                this.slides.forEach((slide, i) => {
                    slide.order = i + 1;
                });
            }
        },

        clearForm() {
            this.newSlide = {
                title: '',
                text: '',
                image: null,
                imagePreview: null,
                order: 0
            };
            this.editingIndex = null;
            this.slideTitleError = '';
            this.slideTextError = '';
            this.slideImageError = '';
            document.getElementById('slideImage').value = '';
        },

        updateSlideNumber(index) {
            const newOrder = parseInt(prompt('Введите новый порядковый номер (1-' + this.slides.length + '):', index + 1));

            if (newOrder && !isNaN(newOrder)) {
                if (newOrder < 1 || newOrder > this.slides.length) {
                    alert('Пожалуйста, введите число от 1 до ' + this.slides.length);
                    return;
                }

                // Обновляем порядок слайдов
                const slide = this.slides[index];
                this.slides.splice(index, 1);
                this.slides.splice(newOrder - 1, 0, slide);

                // Обновляем порядковые номера
                this.slides.forEach((s, i) => {
                    s.order = i + 1;
                });
            }
        },

        async saveAlbum() {
            if (!this.validateAlbum()) {
                return;
            }

            this.isSaving = true;

            try {
                const formData = new FormData();
                formData.append('title', this.albumTitle);
                formData.append('description', this.albumDescription || '');

                // Подготовка данных слайдов
                const slidesData = this.slides.map((slide, index) => {
                    const slideData = {
                        title: slide.title,
                        text: slide.text,
                        order: index + 1
                    };

                    if (slide.image instanceof File) {
                        formData.append(`images`, slide.image);
                    }
                    return slideData;
                });

                formData.append('slides', JSON.stringify(slidesData));

                const response = await fetch('/api/albums/create', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Альбом успешно создан!');
                    window.location.href = `/my-albums`;
                }

                else if (response.status === 401) {
                    window.location.href = `/auth`;
                }

                else {
                    alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при сохранении');
            } finally {
                this.isSaving = false;
            }
        }
    };
}