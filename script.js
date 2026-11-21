/**
 * Flipbook LKPD - Evaluasi Pemahaman Materi Teks Diskusi
 * Format Isi HTML & CSS Interaktif dengan Fitur Kuis
 * Aturan: Tanpa Emoji dan Tanpa Karakter Em Dash
 */

(function () {
    'use strict';

    // Konfigurasi & Kunci Jawaban Kuis
    const CONFIG = {
        totalPages: 8,
        zoomLevels: [0.8, 1.0, 1.25, 1.5, 1.75, 2.0],
        defaultZoomIndex: 1,
        storageKey: 'lkpd_teks_diskusi_state',
        quizQuestions: [
            {
                id: 1,
                name: 'quiz_q1',
                correct: 'B',
                points: 20,
                question: 'Ciri utama teks diskusi adalah ....',
                options: [
                    { val: 'A', text: 'memuat satu pendapat tanpa pendapat lain' },
                    { val: 'B', text: 'memuat berbagai sudut pandang terhadap suatu permasalahan' },
                    { val: 'C', text: 'bertujuan menghibur pembaca dengan cerita' },
                    { val: 'D', text: 'berisi urutan langkah melakukan sesuatu' }
                ],
                explanation: 'Ciri utama teks diskusi adalah menyajikan dan memuat berbagai sudut pandang (pro dan kontra) terhadap suatu isu permasalahan yang aktual.'
            },
            {
                id: 2,
                name: 'quiz_q2',
                correct: 'C',
                points: 20,
                question: 'Isu yang dibahas dalam teks stimulus adalah ....',
                options: [
                    { val: 'A', text: 'manfaat media sosial bagi remaja' },
                    { val: 'B', text: 'cara mencegah perundungan di sekolah' },
                    { val: 'C', text: 'perlu tidaknya siswa membawa ponsel ke sekolah' },
                    { val: 'D', text: 'penggunaan internet di rumah' }
                ],
                explanation: 'Teks stimulus berfokus pada isu perdebatan mengenai perlu tidaknya siswa diizinkan membawa ponsel ke lingkungan sekolah.'
            },
            {
                id: 3,
                name: 'quiz_q3',
                correct: 'C',
                points: 20,
                question: 'Pernyataan berikut yang termasuk argumen pendukung (pro) adalah ....',
                options: [
                    { val: 'A', text: 'Siswa dapat menyontek saat ujian.' },
                    { val: 'B', text: 'Perhatian siswa terpecah oleh media sosial.' },
                    { val: 'C', text: 'Ponsel memudahkan siswa mencari referensi dan kamus daring.' },
                    { val: 'D', text: 'Perundungan daring meningkat di sekolah.' }
                ],
                explanation: 'Pernyataan bahwa ponsel memudahkan siswa mencari referensi dan kamus daring merupakan argumen yang mendukung (pro) pemanfaatan ponsel sebagai sarana belajar.'
            },
            {
                id: 4,
                name: 'quiz_q4',
                correct: 'B',
                points: 20,
                question: 'Makna kata terpecah pada kalimat "perhatian mereka terpecah" adalah ....',
                options: [
                    { val: 'A', text: 'rusak' },
                    { val: 'B', text: 'terbagi ke banyak hal sehingga tidak fokus' },
                    { val: 'C', text: 'hilang sepenuhnya' },
                    { val: 'D', text: 'bertambah kuat' }
                ],
                explanation: 'Dalam konteks teks, kata "terpecah" bermakna perhatian siswa terbagi ke banyak hal sehingga konsentrasi belajar menjadi buyar dan tidak fokus.'
            },
            {
                id: 5,
                name: 'quiz_q5',
                correct: 'D',
                points: 20,
                question: 'Bagian teks stimulus yang berfungsi sebagai simpulan atau penyelesaian terdapat pada paragraf ....',
                options: [
                    { val: 'A', text: 'pertama' },
                    { val: 'B', text: 'kedua' },
                    { val: 'C', text: 'ketiga' },
                    { val: 'D', text: 'keempat' }
                ],
                explanation: 'Paragraf keempat menyajikan simpulan jalan tengah yang berimbang dan menawarkan solusi pengaturan penggunaan ponsel atas izin guru.'
            }
        ]
    };

    const state = {
        pageFlip: null,
        currentPageIndex: 0,
        currentZoomIndex: CONFIG.defaultZoomIndex,
        isPanning: false,
        panStart: { x: 0, y: 0 },
        panOffset: { x: 0, y: 0 },
        quizEvaluated: false,
        stepperCurrentIndex: 0
    };

    // Elemen DOM
    const elements = {
        flipbook: document.getElementById('flipbook'),
        bookViewport: document.getElementById('book-viewport'),
        zoomWrapper: document.getElementById('zoom-wrapper'),
        loadingOverlay: document.getElementById('loading-overlay'),
        progressBar: document.getElementById('loading-progress-bar'),
        tipBanner: document.getElementById('tip-banner'),
        btnCloseTip: document.getElementById('btn-close-tip'),
        btnJumpQuiz: document.getElementById('btn-jump-quiz'),

        // Navigasi
        btnFirst: document.getElementById('btn-first'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        btnLast: document.getElementById('btn-last'),
        sidePrevBtn: document.getElementById('side-prev-btn'),
        sideNextBtn: document.getElementById('side-next-btn'),
        pageSelect: document.getElementById('page-select'),
        pageIndicator: document.getElementById('page-indicator'),

        // Zoom & Layar Penuh
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        btnZoomReset: document.getElementById('btn-zoom-reset'),
        zoomBadge: document.getElementById('zoom-badge'),
        btnFullscreen: document.getElementById('btn-fullscreen'),
        iconFsEnter: document.getElementById('icon-fs-enter'),
        iconFsExit: document.getElementById('icon-fs-exit'),

        // Modal Daftar Halaman
        btnOpenToc: document.getElementById('btn-open-toc'),
        btnCloseToc: document.getElementById('btn-close-toc'),
        modalToc: document.getElementById('modal-toc'),
        tocCards: document.querySelectorAll('.toc-card'),

        // Modal Petunjuk
        btnOpenGuide: document.getElementById('btn-open-guide'),
        btnCloseGuide: document.getElementById('btn-close-guide'),
        modalGuide: document.getElementById('modal-guide'),

        // Kuis di Halaman 8
        btnCheckQuiz: document.getElementById('btn-check-quiz'),
        btnResetQuiz: document.getElementById('btn-reset-quiz'),
        btnOpenInteractiveQuiz: document.getElementById('btn-open-interactive-quiz'),
        quizScoreVal: document.getElementById('quiz-score-val'),
        quizStatusTitle: document.getElementById('quiz-status-title'),
        quizStatusDesc: document.getElementById('quiz-status-desc'),
        quizTimestamp: document.getElementById('quiz-timestamp'),

        // Modal Kuis Terpandu
        modalInteractiveQuiz: document.getElementById('modal-interactive-quiz'),
        btnCloseInteractiveQuiz: document.getElementById('btn-close-interactive-quiz'),
        stepperQContainer: document.getElementById('stepper-q-container'),
        quizDotsContainer: document.getElementById('quiz-dots-container'),
        btnQuizPrevStep: document.getElementById('btn-quiz-prev-step'),
        btnQuizNextStep: document.getElementById('btn-quiz-next-step'),
        quizStepIndicator: document.getElementById('quiz-step-indicator')
    };

    /**
     * Inisialisasi Aplikasi
     */
    function initApp() {
        setupEventListeners();
        restoreSavedData();
        initPageFlip();
        initInteractiveQuizStepper();
        hideLoadingOverlay();
    }

    /**
     * Inisialisasi StPageFlip untuk Animasi Lembaran Buku
     */
    function initPageFlip() {
        if (!window.St || !window.St.PageFlip) {
            console.error('Pustaka StPageFlip tidak ditemukan.');
            return;
        }

        state.pageFlip = new St.PageFlip(elements.flipbook, {
            width: 550,
            height: 778,
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
        });

        // Event listener saat orientasi berganti
        state.pageFlip.on('changeOrientation', function () {
            updateControlsState();
        });

        updateControlsState();

        // Mencegah konflik seretan flipbook saat mengetik pada input/textarea
        preventFlipConflictOnInputs();
    }

    /**
     * Mencegah event seret flipbook saat berinteraksi dengan input, textarea, dan label
     */
    function preventFlipConflictOnInputs() {
        const interactives = document.querySelectorAll('input, textarea, button, select, label, .lkpd-table');
        interactives.forEach(function (el) {
            el.addEventListener('mousedown', function (e) {
                e.stopPropagation();
            });
            el.addEventListener('touchstart', function (e) {
                e.stopPropagation();
            }, { passive: true });
        });
    }

    /**
     * Perbarui Status Kontrol Navigasi & Indikator
     */
    function updateControlsState() {
        if (!state.pageFlip) return;

        const current = state.currentPageIndex;
        const total = CONFIG.totalPages;
        const orientation = state.pageFlip.getOrientation();

        let indicatorText = '';
        if (orientation === 'portrait') {
            indicatorText = 'Halaman ' + (current + 1) + ' dari ' + total;
        } else {
            if (current === 0) {
                indicatorText = 'Halaman 1 dari ' + total + ' (Sampul Depan)';
            } else if (current >= total - 1) {
                indicatorText = 'Halaman ' + total + ' dari ' + total + ' (Pusat Evaluasi Kuis)';
            } else {
                const left = current + 1;
                const right = Math.min(current + 2, total);
                indicatorText = 'Halaman ' + left + ' - ' + right + ' dari ' + total;
            }
        }

        elements.pageIndicator.textContent = indicatorText;

        if (elements.pageSelect) {
            elements.pageSelect.value = String(current);
        }

        const isFirst = current === 0;
        const isLast = current >= total - 1;

        elements.btnFirst.disabled = isFirst;
        elements.btnPrev.disabled = isFirst;
        elements.sidePrevBtn.disabled = isFirst;

        elements.btnNext.disabled = isLast;
        elements.btnLast.disabled = isLast;
        elements.sideNextBtn.disabled = isLast;

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
     * Logika Evaluasi Kuis Interaktif
     */
    function evaluateQuiz() {
        let totalScore = 0;
        let answeredCount = 0;
        const results = [];

        CONFIG.quizQuestions.forEach(function (q) {
            const selectedOpt = document.querySelector('input[name="' + q.name + '"]:checked');
            const userChoice = selectedOpt ? selectedOpt.value : null;

            if (userChoice) answeredCount++;

            const isCorrect = userChoice === q.correct;
            if (isCorrect) {
                totalScore += q.points;
            }

            results.push({
                id: q.id,
                userChoice: userChoice,
                correctChoice: q.correct,
                isCorrect: isCorrect,
                explanation: q.explanation
            });
        });

        // Perbarui Tampilan Kartu Skor di Halaman 8
        elements.quizScoreVal.textContent = totalScore;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        elements.quizTimestamp.textContent = 'Diperiksa pada ' + timeStr;

        if (answeredCount === 0) {
            elements.quizStatusTitle.textContent = 'Belum Ada Soal yang Dijawab';
            elements.quizStatusDesc.textContent = 'Silakan pilih jawaban pada nomor 1 sampai 5 di Halaman 2 dan 3, kemudian periksa kembali.';
        } else if (totalScore === 100) {
            elements.quizStatusTitle.textContent = 'Sempurna! Pemahaman Sangat Baik';
            elements.quizStatusDesc.textContent = 'Luar biasa! Kamu berhasil menjawab seluruh soal pilihan ganda dengan tepat sesuai materi teks diskusi.';
        } else if (totalScore >= 60) {
            elements.quizStatusTitle.textContent = 'Bagus! Pemahaman Cukup Baik';
            elements.quizStatusDesc.textContent = 'Kamu sudah memahami sebagian besar materi teks diskusi. Pelajari kembali poin pembahasan di bawah untuk menyempurnakan pemahaman.';
        } else {
            elements.quizStatusTitle.textContent = 'Perlu Berlatih dan Membaca Kembali';
            elements.quizStatusDesc.textContent = 'Baca kembali teks stimulus di Halaman 2 dan cermati argumen pro serta kontra sebelum mencoba kuis ulang.';
        }

        // Perbarui Rincian Analisis per Nomor
        results.forEach(function (res) {
            const itemEl = document.getElementById('rev-item-' + res.id);
            const userAnsEl = document.getElementById('rev-u-' + res.id);
            const badgeEl = document.getElementById('rev-badge-' + res.id);

            if (!itemEl) return;

            itemEl.classList.remove('is-correct', 'is-wrong');

            if (!res.userChoice) {
                userAnsEl.textContent = 'Jawabanmu: (Kosong)';
                badgeEl.textContent = 'Belum dijawab';
                badgeEl.className = 'rev-badge';
            } else if (res.isCorrect) {
                itemEl.classList.add('is-correct');
                userAnsEl.textContent = 'Jawabanmu: ' + res.userChoice + ' (Tepat)';
                badgeEl.textContent = 'Benar (+20)';
                badgeEl.className = 'rev-badge';
            } else {
                itemEl.classList.add('is-wrong');
                userAnsEl.textContent = 'Jawabanmu: ' + res.userChoice + ' (Kurang tepat)';
                badgeEl.textContent = 'Salah (+0)';
                badgeEl.className = 'rev-badge';
            }
        });

        state.quizEvaluated = true;
        saveDataToStorage();
    }

    /**
     * Reset Kuis ke Status Awal
     */
    function resetQuiz() {
        CONFIG.quizQuestions.forEach(function (q) {
            const radios = document.querySelectorAll('input[name="' + q.name + '"]');
            radios.forEach(function (r) {
                r.checked = false;
            });

            const itemEl = document.getElementById('rev-item-' + q.id);
            const userAnsEl = document.getElementById('rev-u-' + q.id);
            const badgeEl = document.getElementById('rev-badge-' + q.id);

            if (itemEl) itemEl.classList.remove('is-correct', 'is-wrong');
            if (userAnsEl) userAnsEl.textContent = 'Jawabanmu: -';
            if (badgeEl) {
                badgeEl.textContent = 'Belum dijawab';
                badgeEl.className = 'rev-badge';
            }
        });

        elements.quizScoreVal.textContent = '0';
        elements.quizTimestamp.textContent = 'Belum diperiksa';
        elements.quizStatusTitle.textContent = 'Kuis Direset';
        elements.quizStatusDesc.textContent = 'Silakan pilih kembali jawaban pada nomor 1 sampai 5 di Halaman 2 dan 3, kemudian tekan tombol Periksa Hasil Kuis.';
        state.quizEvaluated = false;
        saveDataToStorage();
    }

    /**
     * Inisialisasi Mode Kuis Terpandu (Modal Stepper)
     */
    function initInteractiveQuizStepper() {
        // Buat dot navigasi
        elements.quizDotsContainer.innerHTML = '';
        CONFIG.quizQuestions.forEach(function (_, i) {
            const dot = document.createElement('div');
            dot.className = 'stepper-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('data-idx', i);
            elements.quizDotsContainer.appendChild(dot);
        });

        renderStepperQuestion(0);
    }

    function renderStepperQuestion(index) {
        state.stepperCurrentIndex = index;
        const q = CONFIG.quizQuestions[index];
        const total = CONFIG.quizQuestions.length;

        elements.quizStepIndicator.textContent = 'Soal ' + (index + 1) + ' dari ' + total;

        // Cek jawaban saat ini dari radio button buku
        const curRadio = document.querySelector('input[name="' + q.name + '"]:checked');
        const curVal = curRadio ? curRadio.value : '';

        let html = '<div class="q-header">' +
            '<span class="q-num">' + q.id + '.</span>' +
            '<p class="q-text">' + q.question + '</p>' +
            '</div>' +
            '<div class="quiz-options-group" style="padding-left: 0; margin-top: 12px;">';

        q.options.forEach(function (opt) {
            const isChecked = curVal === opt.val ? ' checked' : '';
            html += '<label class="quiz-opt-label">' +
                '<input type="radio" name="stepper_opt" value="' + opt.val + '" class="quiz-radio"' + isChecked + '>' +
                '<span class="opt-indicator">' + opt.val + '</span>' +
                '<span class="opt-desc">' + opt.text + '</span>' +
                '</label>';
        });

        html += '</div>';
        elements.stepperQContainer.innerHTML = html;

        // Tambah listener pemilihan opsi pada modal stepper
        const stepperRadios = elements.stepperQContainer.querySelectorAll('input[name="stepper_opt"]');
        stepperRadios.forEach(function (r) {
            r.addEventListener('change', function () {
                // Sinkronkan ke radio button di buku utama
                const mainRadio = document.querySelector('input[name="' + q.name + '"][value="' + this.value + '"]');
                if (mainRadio) {
                    mainRadio.checked = true;
                    saveDataToStorage();
                }
                updateStepperDots();
            });
        });

        // Perbarui tombol stepper
        elements.btnQuizPrevStep.disabled = index === 0;
        if (index === total - 1) {
            elements.btnQuizNextStep.textContent = 'Selesai & Periksa Nilai';
        } else {
            elements.btnQuizNextStep.textContent = 'Selanjutnya';
        }

        updateStepperDots();
    }

    function updateStepperDots() {
        const dots = elements.quizDotsContainer.querySelectorAll('.stepper-dot');
        dots.forEach(function (dot, i) {
            dot.classList.remove('active', 'answered');
            if (i === state.stepperCurrentIndex) {
                dot.classList.add('active');
            }
            const q = CONFIG.quizQuestions[i];
            const hasAns = !!document.querySelector('input[name="' + q.name + '"]:checked');
            if (hasAns) {
                dot.classList.add('answered');
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

        setTimeout(function () {
            if (state.pageFlip) {
                state.pageFlip.update();
            }
        }, 300);
    }

    /**
     * Panning saat Zoom
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
     * Penyimpanan & Pemulihan Data Siswa (LocalStorage)
     */
    function saveDataToStorage() {
        const data = {
            inputs: {},
            radios: {}
        };

        const textInputs = document.querySelectorAll('.form-input, .table-textarea, .essay-textarea');
        textInputs.forEach(function (inp, idx) {
            const key = inp.id || 'inp_' + idx;
            data.inputs[key] = inp.value;
        });

        const checkedRadios = document.querySelectorAll('input[type="radio"]:checked');
        checkedRadios.forEach(function (r) {
            data.radios[r.name] = r.value;
        });

        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
        } catch (e) {
            // Abaikan jika storage penuh atau privasi browser dinonaktifkan
        }
    }

    function restoreSavedData() {
        try {
            const raw = localStorage.getItem(CONFIG.storageKey);
            if (!raw) return;
            const data = JSON.parse(raw);

            if (data.inputs) {
                const textInputs = document.querySelectorAll('.form-input, .table-textarea, .essay-textarea');
                textInputs.forEach(function (inp, idx) {
                    const key = inp.id || 'inp_' + idx;
                    if (data.inputs[key] !== undefined) {
                        inp.value = data.inputs[key];
                    }
                });
            }

            if (data.radios) {
                Object.keys(data.radios).forEach(function (name) {
                    const val = data.radios[name];
                    const radio = document.querySelector('input[name="' + name + '"][value="' + val + '"]');
                    if (radio) {
                        radio.checked = true;
                    }
                });
            }
        } catch (e) {
            console.warn('Gagal memulihkan sesi lokal:', e);
        }
    }

    /**
     * Daftarkan Seluruh Event Listener
     */
    function setupEventListeners() {
        // Tombol Navigasi
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

        // Tombol Lompat ke Kuis (Header & Halaman 8)
        elements.btnJumpQuiz.addEventListener('click', function () {
            if (state.pageFlip) {
                state.pageFlip.flip(CONFIG.totalPages - 1);
            }
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

        // Banner Tip
        elements.btnCloseTip.addEventListener('click', function () {
            elements.tipBanner.style.display = 'none';
        });

        // Kuis Evaluasi di Halaman 8
        elements.btnCheckQuiz.addEventListener('click', evaluateQuiz);
        elements.btnResetQuiz.addEventListener('click', resetQuiz);

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

        // Modal Kuis Terpandu
        elements.btnOpenInteractiveQuiz.addEventListener('click', function () {
            elements.modalInteractiveQuiz.classList.add('is-active');
            elements.modalInteractiveQuiz.setAttribute('aria-hidden', 'false');
            renderStepperQuestion(0);
        });

        elements.btnCloseInteractiveQuiz.addEventListener('click', function () {
            elements.modalInteractiveQuiz.classList.remove('is-active');
            elements.modalInteractiveQuiz.setAttribute('aria-hidden', 'true');
        });

        elements.btnQuizPrevStep.addEventListener('click', function () {
            if (state.stepperCurrentIndex > 0) {
                renderStepperQuestion(state.stepperCurrentIndex - 1);
            }
        });

        elements.btnQuizNextStep.addEventListener('click', function () {
            const total = CONFIG.quizQuestions.length;
            if (state.stepperCurrentIndex < total - 1) {
                renderStepperQuestion(state.stepperCurrentIndex + 1);
            } else {
                // Selesai kuis terpandu: tutup modal, evaluasi, dan lompat ke Halaman 8
                elements.modalInteractiveQuiz.classList.remove('is-active');
                elements.modalInteractiveQuiz.setAttribute('aria-hidden', 'true');
                evaluateQuiz();
                if (state.pageFlip) {
                    state.pageFlip.flip(CONFIG.totalPages - 1);
                }
            }
        });

        // Simpan input otomatis saat siswa mengetik atau memilih opsi
        document.addEventListener('input', function (e) {
            if (e.target.matches('.form-input, .table-textarea, .essay-textarea')) {
                saveDataToStorage();
            }
        });

        document.addEventListener('change', function (e) {
            if (e.target.matches('input[type="radio"]')) {
                saveDataToStorage();
            }
        });

        // Pintasan Keyboard
        window.addEventListener('keydown', handleKeyboardShortcuts);

        // Penyesuaian Resize Window
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

        setupPanning();
    }

    /**
     * Tangani Pintasan Keyboard
     */
    function handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
                elements.modalInteractiveQuiz.classList.remove('is-active');
                break;
            default:
                break;
        }
    }

    function hideLoadingOverlay() {
        if (elements.progressBar) {
            elements.progressBar.style.width = '100%';
        }
        setTimeout(function () {
            elements.loadingOverlay.classList.add('is-hidden');
        }, 300);
    }

    // Jalankan aplikasi saat DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
