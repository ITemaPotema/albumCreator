function albumApp() {
    return {
        isReordering: false,
        hoveredSlide: null,
        isSaving: false,
        uploadProgress: 0,
        albumId: null,
        albumTitle: '',
        albumDescription: '',
        albumTitleError: '',
        albumDescriptionError: '',
        newSlide: {
            title: '',
            text: '',
            image: null,
            imagePreview: null,
            image_path: '',
            order: 0
        },
        slides: [],
        slideTitleError: '',
        slideTextError: '',
        slideImageError: '',
        editingIndex: null,

        init() {
            // Получаем ID альбома из URL
            const pathParts = window.location.pathname.split('/');
            this.albumId = pathParts[pathParts.length - 2];
            this.loadAlbum(this.albumId);
        },

        async loadAlbum(albumId) {
            try {
                const response = await fetch(`/api/albums/data/${albumId}`);
                const data = await response.json();

                if (response.ok) {
                    this.albumTitle = data.album.title;
                    this.albumDescription = data.album.description;
                    this.slides = data.album.slides.map(slide => ({
                        ...slide,
                        order: slide.order || 0,
                        image_path: slide.image_path || '',
                        imagePreview: slide.image_path || ''
                    }));
                }
                else if (response.status === 401) {
                    window.location.href = `/auth`;
                }
            } catch (error) {
                console.error('Ошибка загрузки альбома:', error);
            }
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

        toggleReordering() {
            this.isReordering = !this.isReordering;
            if (!this.isReordering) {
                this.slides.forEach((slide, index) => {
                    slide.order = index + 1;
                });
            }
        },

        handleImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
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

            if (!this.newSlide.title || this.newSlide.title.trim() === '') {
                this.slideTitleError = 'Пожалуйста, введите заголовок слайда';
                isValid = false;
            } else {
                this.slideTitleError = '';
            }

            if (!this.newSlide.text || this.newSlide.text.trim() === '') {
                this.slideTextError = 'Пожалуйста, введите текст слайда';
                isValid = false;
            } else {
                this.slideTextError = '';
            }

            if (this.editingIndex === null && !this.newSlide.image && !this.newSlide.image_path) {
                this.slideImageError = 'Пожалуйста, загрузите изображение для слайда';
                isValid = false;
            } else {
                this.slideImageError = '';
            }

            return isValid;
        },

        addSlide() {
            if (this.slides.length >= 20) {
                alert('Достигнуто максимальное количество слайдов (20)');
                return;
            }

            if (!this.validateSlide()) {
                return;
            }

            if (this.editingIndex !== null) {
                this.slides[this.editingIndex] = { ...this.newSlide };
                this.editingIndex = null;
            } else {
                const order = this.slides.length + 1;
                this.slides.push({ ...this.newSlide, order });
            }

            this.clearForm();
        },

        editSlide(index) {
            this.editingIndex = index;
            this.newSlide = { ...this.slides[index] };
            document.getElementById('slideTitle').scrollIntoView({ behavior: 'smooth' });
        },

        removeSlide(index) {
            if (confirm('Вы уверены, что хотите удалить этот слайд?')) {
                this.slides.splice(index, 1);
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
                image_path: '',
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

                const slide = this.slides[index];
                this.slides.splice(index, 1);
                this.slides.splice(newOrder - 1, 0, slide);

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
                formData.append('description', this.albumDescription);

                const slidesData = this.slides.map((slide, index) => ({
                    title: slide.title,
                    text: slide.text,
                    order: index + 1,
                    image_path: slide.image_path
                }));
                formData.append('slides', JSON.stringify(slidesData));

                this.slides.forEach((slide, index) => {
                    if (slide.image instanceof File) {
                        formData.append(`images`, slide.image);
                    }
                });

                const response = await fetch(`/api/albums/${this.albumId}/save-changes`, {
                    method: 'PUT',
                    credentials: 'include',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Изменения сохранены!');
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