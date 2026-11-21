# Flipbook LKPD Interaktif Teks Diskusi

Website Flipbook Interaktif berbasis HTML5, CSS3, dan Vanilla JavaScript murni. Isi materi dari modul "MODUL GANJIL_LKPD ATARI REGITA PUTRI.pdf" dibentuk langsung menggunakan elemen HTML, CSS, dan JavaScript interaktif dengan fitur kuis otomatis terintegrasi.

## Struktur Direktori

```text
/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    ├── modul.pdf
    └── MODUL GANJIL_LKPD ATARI REGITA PUTRI.pdf
```

## Keunggulan & Teknologi

1. Format Isi HTML Murni: Seluruh 8 halaman modul direkonstruksi menggunakan HTML5 dan CSS3 semantik, bukan sekadar menampilkan gambar halaman PDF. Teks sangat tajam, dapat disorot, dan responsif.
2. Animasi Membalik Halaman Realistis: Menggunakan StPageFlip (CDN) untuk efek membalik lembaran buku fisik 3D yang halus.
3. Fitur Kuis Interaktif & Kunci Tersembunyi: Kunci jawaban asli pada halaman 8 disembunyikan dan diintegrasikan ke sistem kuis otomatis. Siswa memilih jawaban di halaman 2 dan 3, kemudian sistem menghitung nilai secara otomatis (skor 0 sampai 100), menandai jawaban benar atau salah, serta menyajikan pembahasan edukatif.
4. Input Interaktif: Kolom identitas siswa, tabel argumen pro kontra, isian uraian, dan checklist refleksi dapat diketik langsung oleh siswa.
5. Penyimpanan Otomatis (Local Storage): Jawaban dan isian siswa tersimpan otomatis di peramban sehingga tidak hilang saat halaman dimuat ulang.
6. Desain Visual Digital Storybook: Nuansa warna hijau pastel, sage green, mint green, dan putih dengan ilustrasi botani SVG yang nyaman di mata siswa kelas X.
7. Bebas Emoji dan Bebas Em Dash: Seluruh elemen antarmuka dan kode 100% bebas dari emoji dan karakter em dash.

## Tampilan Responsif

- Desktop (Layar Lebar): Tampilan 2 halaman berdampingan menyerupai buku terbuka lengkap dengan bayangan lipatan tulang buku.
- Tablet & Ponsel: Menyesuaikan secara otomatis ke tampilan 1 halaman potret yang nyaman dibaca dengan dukungan gestur usap layar (swipe).

## Cara Menjalankan Website

Buka terminal pada direktori proyek dan jalankan server lokal:

```bash
python -m http.server 8000
```

Buka peramban pada alamat:
`http://localhost:8000`
