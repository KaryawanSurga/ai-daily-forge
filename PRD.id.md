# PRD — AI Daily Forge (Bahasa Indonesia)

**Status:** v1.0.0 siap rilis
**Owner:** KaryawanSurga
**Update terakhir:** 2026-10-06

## 1. Ringkasan

AI Daily Forge adalah CLI tanpa dependency yang mengubah kebiasaan "commit setiap hari" menjadi lini produksi yang nyata: verifikasi environment (`doctor`), scaffold project (`new`), skor kesiapan publish (`audit`), heatmap kontribusi asli dari riwayat git lokal (`streak`), log harian jujur (`log`), dan backlog terurut (`ideas`). Semua command ada untuk mempermudah output harian yang nyata — bukan untuk membuat aktivitas palsu.

## 2. Masalah

- Nasihat "commit harian" mudah berubah jadi noise: commit kosong, README asal-asalan, aktivitas palsu yang merusak kredibilitas.
- Penghalang mekanisnya tidak terlihat: email git salah, repo hasil fork, commit di feature branch yang tidak dihitung, push setelah tanggal UTC berganti.
- Setiap project baru mengulang setup yang sama: metadata, CI, test, lisensi, workflow publish.
- Tidak ada heatmap lokal yang jujur menjawab "berapa commit asli yang saya buat, dan di mana?"

## 3. Target pengguna

- Developer yang membangun kebiasaan open-source harian.
- Pembuat tool AI/developer yang butuh scaffolding yang bisa diulang.
- Siapa pun yang ingin penilaian kesiapan publish sebelum mengumumkan repo.

## 4. Tujuan (v1.0.0)

1. Mendiagnosis semua kondisi yang menentukan apakah commit muncul di contribution graph, beserta fix-nya.
2. Scaffold project lengkap dari template dengan metadata nyata, CI, test, dan git di branch `main`.
3. Memberi skor kesiapan publish 0–100 dengan perbaikan actionable per check — bisa jadi gate CI.
4. Menghitung heatmap kontribusi nyata dari riwayat git lokal lintas repo.
5. Menjaga backlog terurut dan mengubahnya menjadi shortlist atau tabel markdown.
6. Nol dependency, berjalan di Node >= 20 dengan hanya git (dan opsional gh).

## 5. Bukan tujuan

- Membuat commit palsu dalam bentuk apa pun: commit kosong, ubah tanggal, bot farm.
- Hosting, deployment, atau otomasi publish registry di luar template workflow yang disediakan.
- Menyaingi API GitHub: tool ini tidak menggantikan `gh`, tapi berkomposisi dengannya.
- GUI atau dashboard web.

## 6. User story

- Sebagai developer, saya ingin `forge doctor` menjelaskan kenapa Jumat lalu tidak ada kotak hijau.
- Sebagai builder, saya ingin `forge new` menghasilkan repo yang layak review sejak menit pertama.
- Sebagai maintainer, saya ingin `forge audit .` di CI supaya kualitas tidak turun diam-diam.
- Sebagai perencana, saya ingin `forge ideas` mengurutkan backlog dan mengeluarkan tabel siap-README.
- Sebagai pendiary, saya ingin `forge log` mencatat apa yang benar-benar rilis, terbaru dulu.

## 7. Kebutuhan fungsional

| ID | Kebutuhan |
| --- | --- |
| FR1 | `doctor` memeriksa Node, git, gh, identity (name/email), keterkaitan email ke akun via gh, penolakan email generik, konteks repo (branch, remote, status fork, description, topics), keselarasan atribusi UTC/lokal dengan safe window commit, serta ketersediaan template; exit 1 saat ada masalah. |
| FR2 | `new <template> <slug>` menyalin template dengan substitusi placeholder (`SLUG`, `SNAKE`, `TITLE`, `DESCRIPTION`, `YEAR`, `AUTHOR`, `EMAIL`, `GITHUB_USER`, `LICENSE`), menangani suffix `.tmpl` dan segmen path bertemplate, dan melaporkan placeholder yang tersisa sebagai bug template. |
| FR3 | `new` menginisialisasi git di `main`, memasang identity dari config, dan membuat commit pertama; `--push` membuat repo GitHub publik dan push langsung. |
| FR4 | `new` menolak destinasi duplikat, template tidak dikenal, dan slug tidak valid dengan exit code yang berbeda. |
| FR5 | `audit [dir]` menjalankan check berbobot (kedalaman README/Install/Usage/lisensi, LICENSE, .gitignore, CI, test, metadata package, repo git, description/topics/not-fork remote) dan mencetak skor 0–100 dengan fix; exit 1 di bawah 85. |
| FR6 | `streak [dir] [--days N] [--utc]` menemukan repo, menghitung commit sekali per sha lintas ref, merender heatmap, dan melaporkan streak sekarang/terpanjang, hari aktif, total commit, dan jumlah per repo. |
| FR7 | `log "<text>" [--kind] [--dir]` menambahkan entri bertanggal terbaru-dulu ke `daily-log/YYYY-MM-DD.md`. |
| FR8 | `ideas [--category] [--md] [--limit]` mengurutkan ide terbuka berdasarkan impact/stars/effort/registry dan mencetak shortlist atau tabel markdown. |
| FR9 | `templates` menampilkan daftar template dengan bahasa dan deskripsi. |
| FR10 | Config membaca dari `--config`, `FORGE_CONFIG`, cwd, lalu root forge, dengan fallback ke nilai git config. |
| FR11 | Exit code: 0 ok, 1 masalah ditemukan, 2 kesalahan penggunaan — stabil untuk scripting. |

## 8. Kebutuhan non-fungsional

- Nol dependency runtime; Node >= 20; tanpa langkah install untuk menjalankan.
- Windows, macOS, dan Linux (tanpa perilaku spesifik shell; `windowsHide` di semua proses anak).
- Setiap kegagalan engine menurun dengan mulus (gh tidak ada → check remote dilewati, bukan crash).
- Test suite memakai test runner bawaan Node; CI mengaudit repo sendiri di setiap push.
- Tanpa panggilan jaringan kecuali lewat binary git/gh milik pengguna.

## 9. Metrik sukses

- Diadopsi sebagai langkah pre-flight di workflow commit harian.
- Repo yang memasang `forge audit` di CI.
- Item backlog `ideas` berpindah ke `done` dengan ritme stabil.
- Install npm dan star bertumbuh tanpa dorongan marketing.

## 10. Catatan teknis

- CLI satu file (`bin/forge.mjs`) terorganisir per command dengan helper proses `run()` bersama yang tidak pernah throw.
- Template membawa metadata `.template.json`; scaffolder berjalan rekursif, mensubstitusi, dan memverifikasi sisa placeholder.
- Bobot audit lokal total 104; check remote menambah 18 dan dilewati saat gh tidak tersedia, menjaga CI deterministik.
- Streak menghitung tiap sha sekali meski reachable dari banyak ref; tanggal memakai timezone commit masing-masing kecuali `--utc`.
- Warna otomatis mati saat stdout bukan TTY atau `NO_COLOR` diset.

## 11. Rencana rilis

- **v1.0.0** — doctor, new, audit, streak, log, ideas, templates; empat template; suite 20 test; self-audit CI; workflow publish npm (2026-10-06).
- **v1.1.0** — template tambahan (CLI, GitHub Action), `forge release` (tag + notes + gh release), check audit lebih kaya (coverage, isi package).
- **v1.2.0** — `forge sync` (verifikasi commit via API GitHub), laporan mingguan dari `daily-log`.

## 12. Pertanyaan terbuka

- Perlukah `doctor` menyediakan mode fix interaktif untuk masalah identity dan email?
- Perlukah audit mengintegrasikan check daftar file `npm pack --dry-run`?
- Perlukah template diberi versi dan bisa di-install terpisah?
