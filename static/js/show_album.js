function albumApp() {
    return {
        albumTitle: '',
        albumDescription: '',
        albumCover: '',
        slides: [],
        currentSlide: null,
        currentPage: 1,
        totalSlides: 0,
        openModal: false,
        zoomModalOpen: false,
        currentText: '',
        zoomedImageUrl: '',
        isAnimating: false,

        async init() {
            await this.loadAlbumData();
            if (this.slides.length > 0) {
                this.currentSlide = this.slides[0];
                this.totalSlides = this.slides.length;
            }
        },

        async loadAlbumData() {
            try {
                const pathParts = window.location.pathname.split('/');
                const albumId = pathParts[pathParts.length - 1];

                const response = await fetch(`/api/albums/data/${albumId}`);
                if (!response.ok) throw new Error('Ошибка загрузки альбома');

                const data = await response.json();
                this.albumTitle = data.album.title;
                this.albumDescription = data.album.description;
                this.albumCover = data.album.cover_image;
                this.slides = data.album.slides;
            } catch (error) {
                console.error('Ошибка:', error);
            }
        },

        openImageModal(imageUrl) {
            this.zoomedImageUrl = imageUrl;
            this.zoomModalOpen = true;
        },

        nextSlide() {
            if (this.currentPage < this.totalSlides) {
                this.isAnimating = true;
                this.currentPage++;

                setTimeout(() => {
                    this.currentSlide = this.slides[this.currentPage - 1];
                    this.isAnimating = false;
                    this.scrollToTop();
                }, 250);
            }
        },

        prevSlide() {
            if (this.currentPage > 1) {
                this.isAnimating = true;
                this.currentPage--;

                setTimeout(() => {
                    this.currentSlide = this.slides[this.currentPage - 1];
                    this.isAnimating = false;
                    this.scrollToTop();
                }, 250);
            }
        },

        scrollToTop() {
            window.scrollTo({
                top: document.querySelector('.album-header').offsetTop - 20,
                behavior: 'smooth'
            });
        }
    };
}