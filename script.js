/**
 * Flipbook LKPD - Evaluasi Pemahaman Materi Teks Diskusi
 * Vanilla JavaScript dengan PDF.js dan StPageFlip
 * Aturan: Tanpa Emoji dan Tanpa Karakter Em Dash
 */

(function () {
    'use strict';

    // Konfigurasi & State
    const CONFIG = {
        pdfPath: 'assets/modul.pdf',
        totalPages: 8,
        renderScale: 2.0, // Render resolusi tinggi untuk ketajaman teks
        zoomLevels: [0.8, 1.0, 1.25, 1.5, 1.75, 2.0],
        defaultZoomIndex: 1
    };

    const state = {
        pdfDoc: null,
        pageFlip: null,
        currentPageIndex: 0,
        currentZoomIndex: CONFIG.defaultZoomIndex,
        renderedPages: new Set(),
        renderingQueue: new Set(),
        isPanning: false,
        panStart: { x: 0, y: 0 },
        panOffset: { x: 0, y: 0 }
    };

    // Elemen DOM
    const elements = {
        flipbook: document.getElementById('flipbook'),
        bookViewport: document.getElementById('book-viewport'),
        zoomWrapper: document.getElementById('zoom-wrapper'),
        loadingOverlay: document.getElementById('loading-overlay'),
        progressBar: document.getElementById('loading-progress-bar'),
        errorOverlay: document.getElementById('error-overlay'),
        errorMessage: document.getElementById('error-message'),
        btnRetryLoad: document.getElementById('btn-retry-load'),
        tipBanner: document.getElementById('tip-banner'),
        btnCloseTip: document.getElementById('btn-close-tip'),
        
        // Tombol Navigasi
        btnFirst: document.getElementById('btn-first'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        btnLast: document.getElementById('btn-last'),
        sidePrevBtn: document.getElementById('side-prev-btn'),
        sideNextBtn: document.getElementById('side-next-btn'),
        pageSelect: document.getElementById('page-select'),
        pageIndicator: document.getElementById('page-indicator'),

        // Tombol Zoom & Layar
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        btnZoomReset: document.getElementById('btn-zoom-reset'),
        zoomBadge: document.getElementById('zoom-badge'),
        btnFullscreen: document.getElementById('btn-fullscreen'),
        iconFsEnter: document.getElementById('icon-fs-enter'),
        iconFsExit: document.getElementById('icon-fs-exit'),

        // Modal
        btnOpenToc: document.getElementById('btn-open-toc'),
        btnCloseToc: document.getElementById('btn-close-toc'),
        modalToc: document.getElementById('modal-toc'),
        tocCards: document.querySelectorAll('.toc-card'),

        btnOpenGuide: document.getElementById('btn-open-guide'),
        btnCloseGuide: document.getElementById('btn-close-guide'),
        modalGuide: document.getElementById('modal-guide')
    };

    /**
     * Inisialisasi Aplikasi
     */
    async function initApp() {
        setupEventListeners();
        setupPDFWorker();

        try {
            await loadPDFDocument();
            initPageFlip();
            await renderPriorityPages();
            hideLoadingOverlay();
        } catch (error) {
            console.error('Inisialisasi flipbook gagal:', error);
            showError('Terjadi kesalahan saat memproses modul. Pastikan file assets/modul.pdf dapat diakses.');
        }
    }

    /**
     * Konfigurasi PDF.js Worker dengan fallback
     */
    function setupPDFWorker() {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('Pustaka PDF.js tidak ditemukan.');
        }

        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } catch (e) {
            console.warn('Worker eksternal tidak aktif, menggunakan pemrosesan langsung:', e);
        }
    }

    /**
     * Memuat dokumen PDF dari assets/modul.pdf
     */
    async function loadPDFDocument() {
        updateProgress(20);

        const loadingTask = pdfjsLib.getDocument({
            url: CONFIG.pdfPath,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
        });

        loadingTask.onProgress = function (progress) {
            if (progress.total > 0) {
                const percent = Math.min(60, 20 + Math.round((progress.loaded / progress.total) * 40));
                updateProgress(percent);
            }
        };

        state.pdfDoc = await loadingTask.promise;
        updateProgress(65);
    }

    /**
     * Inisialisasi StPageFlip untuk animasi membalik halaman
     */
    function initPageFlip() {
        if (!window.St || !window.St.PageFlip) {
            throw new Error('Pustaka StPageFlip tidak ditemukan.');
        }

        const isMobile = window.innerWidth <= 768;

        state.pageFlip = new St.PageFlip(elements.flipbook, {
            width: 550, // Lebar dasar per halaman tunggal
            height: 778, // Tinggi dasar rasio A4 (1 : 1.414)
            size: 'stretch',
            minWidth: 280,
            maxWidth: 850,
            minHeight: 396,
            maxHeight: 1202,
            maxShadowOpacity: 0.45,
            showCover: true,
            mobileScrollSupport: false,
            usePortrait: true,
            startPage: 0,
            drawShadow: true,
            flippingTime: 700,
            useMouseEvents: true,
            swipeDistance: 25,
            clickEventForward: true
        });

        const pageElements = document.querySelectorAll('.page');
        state.pageFlip.loadFromHTML(pageElements);
        elements.flipbook.classList.add('is-initialized');

        // Event listener saat halaman selesai dibalik
        state.pageFlip.on('flip', function (e) {
            state.currentPageIndex = e.data;
            updateControlsState();
            lazyRenderCurrentSpread();
        });

        // Event listener saat orientasi berganti (potret / lanskap)
        state.pageFlip.on('changeOrientation', function () {
            updateControlsState();
        });

        updateProgress(85);
        updateControlsState();
    }

    /**
     * Render Halaman Prioritas (Halaman 1 dan Halaman 2-3)
     */
    async function renderPriorityPages() {
        // Render Halaman 1 terlebih dahulu agar sampul langsung tampil
        await renderSinglePage(1);
        updateProgress(95);

        // Render Halaman 2 dan 3 untuk halaman terbuka pertama
        renderSinglePage(2);
        renderSinglePage(3);

        // Lakukan render halaman tersisa secara bertahap di latar belakang
        scheduleBackgroundRender();
    }

    /**
     * Render satu halaman PDF ke elemen canvas beresolusi tinggi
     */
    async function renderSinglePage(pageNumber) {
        if (!state.pdfDoc || pageNumber < 1 || pageNumber > CONFIG.totalPages) return;
        if (state.renderedPages.has(pageNumber) || state.renderingQueue.has(pageNumber)) return;

        state.renderingQueue.add(pageNumber);

        try {
            const page = await state.pdfDoc.getPage(pageNumber);
            const canvas = document.getElementById('pdf-canvas-' + pageNumber);
            const skeleton = document.getElementById('skeleton-' + pageNumber);
            if (!canvas) return;

            // Hitung skala render resolusi tinggi
            const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
            const scale = CONFIG.renderScale * (dpr > 1.2 ? 1.15 : 1.0);
            const viewport = page.getViewport({ scale: scale });

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);

            const ctx = canvas.getContext('2d', { alpha: false });
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            state.renderedPages.add(pageNumber);
            state.renderingQueue.delete(pageNumber);

            if (skeleton) {
                skeleton.classList.add('is-hidden');
            }
        } catch (err) {
            console.error('Gagal merender halaman ' + pageNumber + ':', err);
            state.renderingQueue.delete(pageNumber);
        }
    }

    /**
     * Render halaman di spread saat ini secara malas (lazy)
     */
    function lazyRenderCurrentSpread() {
        const cur = state.currentPageIndex;
        // Prioritaskan halaman saat ini dan sekitarnya
        const pagesToLoad = [
            cur + 1,
            cur + 2,
            Math.max(1, cur),
            Math.min(CONFIG.totalPages, cur + 3)
        ];

        pagesToLoad.forEach(function (pageNum) {
            if (pageNum >= 1 && pageNum <= CONFIG.totalPages) {
                renderSinglePage(pageNum);
            }
        });
    }

    /**
     * Render halaman tersisa secara bertahap agar tidak membebani memori
     */
    function scheduleBackgroundRender() {
        const remainingPages = [4, 5, 6, 7, 8];
        let index = 0;

        function renderNext() {
            if (index >= remainingPages.length) return;
            const p = remainingPages[index++];
            renderSinglePage(p).then(function () {
                if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(renderNext, { timeout: 800 });
                } else {
                    setTimeout(renderNext, 300);
                }
            });
        }

        setTimeout(renderNext, 400);
    }

    /**
     * Perbarui status kontrol navigasi, tombol, dan indikator
     */
    function updateControlsState() {
        if (!state.pageFlip) return;

        const current = state.currentPageIndex;
        const total = CONFIG.totalPages;
        const orientation = state.pageFlip.getOrientation();

        // Teks indikator halaman
        let indicatorText = '';
        if (orientation === 'portrait') {
            indicatorText = 'Halaman ' + (current + 1) + ' dari ' + total;
        } else {
            if (current === 0) {
                indicatorText = 'Halaman 1 dari ' + total + ' (Sampul Depan)';
            } else if (current >= total - 1) {
                indicatorText = 'Halaman ' + total + ' dari ' + total + ' (Sampul Belakang)';
            } else {
                const left = current + 1;
                const right = Math.min(current + 2, total);
                indicatorText = 'Halaman ' + left + ' - ' + right + ' dari ' + total;
            }
        }

        elements.pageIndicator.textContent = indicatorText;

        // Sinkronkan nilai dropdown pemilih halaman
        if (elements.pageSelect) {
            elements.pageSelect.value = String(current);
        }

        // Status tombol disabled
        const isFirst = current === 0;
        const isLast = current >= total - 1;

        elements.btnFirst.disabled = isFirst;
        elements.btnPrev.disabled = isFirst;
        elements.sidePrevBtn.disabled = isFirst;

        elements.btnNext.disabled = isLast;
        elements.btnLast.disabled = isLast;
        elements.sideNextBtn.disabled = isLast;

        // Sorot kartu aktif di modal daftar halaman
        elements.tocCards.forEach(function (card) {
            const pageNum = parseInt(card.getAttribute('data-page'), 10);
            if (pageNum === current) {
                card.classList.add('is-active-card');
            } else {
                card.classList.remove('is-active-card');
            }
        });
    }

    /**
     * Pengaturan Fitur Zoom
     */
    function setZoom(newIndex) {
        if (newIndex < 0 || newIndex >= CONFIG.zoomLevels.length) return;

        state.currentZoomIndex = newIndex;
        const zoom = CONFIG.zoomLevels[newIndex];

        elements.zoomBadge.textContent = Math.round(zoom * 100) + '%';
        applyZoomTransform();

        // Tombol disabled jika mencapai batas
        elements.btnZoomOut.disabled = newIndex === 0;
        elements.btnZoomIn.disabled = newIndex === CONFIG.zoomLevels.length - 1;

        if (zoom <= 1.0) {
            state.panOffset = { x: 0, y: 0 };
            elements.bookViewport.style.cursor = 'default';
        } else {
            elements.bookViewport.style.cursor = 'grab';
        }
    }

    function applyZoomTransform() {
        const zoom = CONFIG.zoomLevels[state.currentZoomIndex];
        const tx = state.panOffset.x;
        const ty = state.panOffset.y;
        elements.zoomWrapper.style.transform = 'scale(' + zoom + ') translate(' + tx + 'px, ' + ty + 'px)';
    }

    function handleZoomIn() {
        if (state.currentZoomIndex < CONFIG.zoomLevels.length - 1) {
            setZoom(state.currentZoomIndex + 1);
        }
    }

    function handleZoomOut() {
        if (state.currentZoomIndex > 0) {
            setZoom(state.currentZoomIndex - 1);
        }
    }

    function handleZoomReset() {
        state.panOffset = { x: 0, y: 0 };
        setZoom(CONFIG.defaultZoomIndex);
    }

    /**
     * Pengaturan Fitur Mode Layar Penuh (Fullscreen)
     */
    function toggleFullscreen() {
        const doc = document;
        const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

        if (!isFs) {
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        } else {
            if (doc.exitFullscreen) {
                doc.exitFullscreen();
            } else if (doc.webkitExitFullscreen) {
                doc.webkitExitFullscreen();
            } else if (doc.msExitFullscreen) {
                doc.msExitFullscreen();
            }
        }
    }

    function updateFullscreenIcons() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (isFs) {
            elements.iconFsEnter.classList.add('is-hidden');
            elements.iconFsExit.classList.remove('is-hidden');
            elements.btnFullscreen.setAttribute('title', 'Keluar Layar Penuh (F)');
        } else {
            elements.iconFsEnter.classList.remove('is-hidden');
            elements.iconFsExit.classList.add('is-hidden');
            elements.btnFullscreen.setAttribute('title', 'Mode Layar Penuh (F)');
        }

        // Perbarui ukuran flipbook setelah transisi layar
        setTimeout(function () {
            if (state.pageFlip) {
                state.pageFlip.update();
            }
        }, 300);
    }

    /**
     * Pengaturan Panning saat Halaman Diperbesar (Zoom > 1.0)
     */
    function setupPanning() {
        const vp = elements.bookViewport;

        vp.addEventListener('mousedown', function (e) {
            if (CONFIG.zoomLevels[state.currentZoomIndex] <= 1.0) return;
            state.isPanning = true;
            state.panStart = { x: e.clientX - state.panOffset.x, y: e.clientY - state.panOffset.y };
            vp.style.cursor = 'grabbing';
            e.preventDefault();
        });

        window.addEventListener('mousemove', function (e) {
            if (!state.isPanning) return;
            state.panOffset = {
                x: e.clientX - state.panStart.x,
                y: e.clientY - state.panStart.y
            };
            applyZoomTransform();
        });

        window.addEventListener('mouseup', function () {
            if (state.isPanning) {
                state.isPanning = false;
                vp.style.cursor = CONFIG.zoomLevels[state.currentZoomIndex] > 1.0 ? 'grab' : 'default';
            }
        });
    }

    /**
     * Daftarkan Seluruh Event Listener
     */
    function setupEventListeners() {
        // Tombol Navigasi Halaman
        elements.btnFirst.addEventListener('click', function () {
            if (state.pageFlip) state.pageFlip.flip(0);
        });

        elements.btnPrev.addEventListener('click', function () {
            if (state.pageFlip) state.pageFlip.flipPrev();
        });

        elements.sidePrevBtn.addEventListener('click', function () {
            if (state.pageFlip) state.pageFlip.flipPrev();
        });

        elements.btnNext.addEventListener('click', function () {
            if (state.pageFlip) state.pageFlip.flipNext();
        });

        elements.sideNextBtn.addEventListener('click', function () {
            if (state.pageFlip) state.pageFlip.flipNext();
        });

        elements.btnLast.addEventListener('click', function () {
            if (state.pageFlip) state.pageFlip.flip(CONFIG.totalPages - 1);
        });

        // Dropdown Pemilih Halaman
        elements.pageSelect.addEventListener('change', function (e) {
            const targetPage = parseInt(e.target.value, 10);
            if (state.pageFlip && !isNaN(targetPage)) {
                state.pageFlip.flip(targetPage);
            }
        });

        // Tombol Zoom
        elements.btnZoomIn.addEventListener('click', handleZoomIn);
        elements.btnZoomOut.addEventListener('click', handleZoomOut);
        elements.btnZoomReset.addEventListener('click', handleZoomReset);

        // Layar Penuh
        elements.btnFullscreen.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', updateFullscreenIcons);
        document.addEventListener('webkitfullscreenchange', updateFullscreenIcons);
        document.addEventListener('mozfullscreenchange', updateFullscreenIcons);
        document.addEventListener('MSFullscreenChange', updateFullscreenIcons);

        // Banner Petunjuk Cepat
        elements.btnCloseTip.addEventListener('click', function () {
            elements.tipBanner.style.display = 'none';
        });

        // Modal Daftar Halaman
        elements.btnOpenToc.addEventListener('click', function () {
            elements.modalToc.classList.add('is-active');
            elements.modalToc.setAttribute('aria-hidden', 'false');
        });

        elements.btnCloseToc.addEventListener('click', function () {
            elements.modalToc.classList.remove('is-active');
            elements.modalToc.setAttribute('aria-hidden', 'true');
        });

        elements.modalToc.addEventListener('click', function (e) {
            if (e.target === elements.modalToc) {
                elements.modalToc.classList.remove('is-active');
                elements.modalToc.setAttribute('aria-hidden', 'true');
            }
        });

        elements.tocCards.forEach(function (card) {
            card.addEventListener('click', function () {
                const target = parseInt(this.getAttribute('data-page'), 10);
                if (state.pageFlip && !isNaN(target)) {
                    state.pageFlip.flip(target);
                    elements.modalToc.classList.remove('is-active');
                    elements.modalToc.setAttribute('aria-hidden', 'true');
                }
            });
        });

        // Modal Petunjuk Penggunaan
        elements.btnOpenGuide.addEventListener('click', function () {
            elements.modalGuide.classList.add('is-active');
            elements.modalGuide.setAttribute('aria-hidden', 'false');
        });

        elements.btnCloseGuide.addEventListener('click', function () {
            elements.modalGuide.classList.remove('is-active');
            elements.modalGuide.setAttribute('aria-hidden', 'true');
        });

        elements.modalGuide.addEventListener('click', function (e) {
            if (e.target === elements.modalGuide) {
                elements.modalGuide.classList.remove('is-active');
                elements.modalGuide.setAttribute('aria-hidden', 'true');
            }
        });

        // Tombol Coba Lagi jika terjadi kesalahan
        elements.btnRetryLoad.addEventListener('click', function () {
            window.location.reload();
        });

        // Pintasan Keyboard
        window.addEventListener('keydown', handleKeyboardShortcuts);

        // Resize Window
        let resizeTimeout = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
                if (state.pageFlip) {
                    state.pageFlip.update();
                    updateControlsState();
                }
            }, 250);
        });

        // Setup drag-pan saat zoom
        setupPanning();
    }

    /**
     * Tangani Pintasan Keyboard
     */
    function handleKeyboardShortcuts(e) {
        // Jangan aktif jika fokus pada select atau input
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                if (state.pageFlip) state.pageFlip.flipPrev();
                break;
            case 'ArrowRight':
            case 'PageDown':
                if (state.pageFlip) state.pageFlip.flipNext();
                break;
            case 'Home':
                if (state.pageFlip) state.pageFlip.flip(0);
                break;
            case 'End':
                if (state.pageFlip) state.pageFlip.flip(CONFIG.totalPages - 1);
                break;
            case '+':
            case '=':
                handleZoomIn();
                break;
            case '-':
            case '_':
                handleZoomOut();
                break;
            case '0':
                handleZoomReset();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'Escape':
                elements.modalToc.classList.remove('is-active');
                elements.modalGuide.classList.remove('is-active');
                break;
            default:
                break;
        }
    }

    /**
     * Perbarui Bar Kemajuan Pemuatan
     */
    function updateProgress(percent) {
        if (elements.progressBar) {
            elements.progressBar.style.width = percent + '%';
        }
    }

    /**
     * Sembunyikan Overlay Pemuatan
     */
    function hideLoadingOverlay() {
        updateProgress(100);
        setTimeout(function () {
            elements.loadingOverlay.classList.add('is-hidden');
        }, 300);
    }

    /**
     * Tampilkan Notifikasi Kesalahan
     */
    function showError(message) {
        elements.loadingOverlay.classList.add('is-hidden');
        elements.errorMessage.textContent = message;
        elements.errorOverlay.classList.remove('is-hidden');
    }

    // Jalankan aplikasi saat DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
