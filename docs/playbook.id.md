# AI Daily Forge — Playbook Operasional

> "Bikin kontribusi tiap hari, tiap repo berguna buat orang, dan profil GitHub lu jadi aset karir."

---

## Daftar Isi

1. [Visi & Target](#1-visi--target)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Aturan Main GitHub Graph (terverifikasi)](#3-aturan-main-github-graph-terverifikasi)
4. [Cadence — Daily, Weekly, Monthly](#4-cadence)
5. [Daily Loop — Step by Step](#5-daily-loop)
6. [The "Hijau Otomatis" Lane](#6-automation-lane-digest-template)
7. [Anti-Patterns — Apa yang Bikin Usaha Jadi Sia-sia](#7-anti-patterns)
8. [Distribution System — Cara Jadi Terkenal](#8-distribution-system)
9. [30 Hari Pertama — Kickoff Schedule](#9-30-hari-pertama)
10. [Cara Setup Awal](#10-cara-setup)

---

## 1. Visi & Target

**Tujuan akhir:**
- Profil GitHub yang didominasi warna hijau **dengan pekerjaan nyata**, bukan spam.
- Portfolio open-source yang direkruter bisa paham nilainya dalam 30 detik.
- Proyek AI yang beneran dipake orang (npm/PyPI download, GitHub stars).
- Reputasi sebagai seseorang yang *shipping* — bukan cuma ngomong.

**Metrik yang dilacak:**

| Metrik | Target (3 bulan) | Target (1 tahun) |
|---|---|---|
| Contribution streak (hari) | 90 | 365 |
| Total followers | 50 | 500+ |
| Repo dengan stars > 100 | 2 | 10+ |
| npm/pypi packages | 5 | 30+ |
| Total kontribusi (issues/PR ke OSS) | 15 | 100+ |

---

## 2. Arsitektur Sistem

Ada 4 layer yang bekerja bareng:

```
┌─────────────────────────────────────────────────────┐
│                     L4 — DISTRIBUTION                │
│  (awesome-list PRs, X threads, LinkedIn, Reddit, HN) │
├─────────────────────────────────────────────────────┤
│                    L3 — RITUAL                        │
│  (daily calendar block, daily-log, streak tracking)  │
├─────────────────────────────────────────────────────┤
│                  L2 — FORGE CLI                       │
│  (forge new, forge audit, forge streak, forge log)   │
├─────────────────────────────────────────────────────┤
│                 L1 — BACKLOG                          │
│  (ideas.json — 62 ide terprioritas + scoring)        │
└─────────────────────────────────────────────────────┘
```

### L1 — Backlog (`ideas.json`)

62 ide yang sudah diskor by:
- **impact** (1-5): seberapa besar masalah yang dipecahkan
- **stars** (1-5): potensi popularitas
- **tier** (S/M/L): estimasi effort
- **registry** (npm/pypi/none): bisa di-publish atau enggak

CLI `forge ideas` nampilin 15 ide paling prioritas berikutnya. Scoring formula: `impact * 3 + stars * 2 + (6 - tier.length) + (registry !== none ? 3 : 0)`.

Setiap hari lu tinggal jalanin `forge ideas` → pilih yang paling tinggi → `forge new <template> <slug>`.

### L2 — Forge CLI

Satu CLI dalam 1 file, zero dependency. 7 command:

- **`forge doctor`** — cek semua prasyarat yang nentuin apakah commit lu kehitung di graph atau enggak. Cek: Node >= 20, git, gh auth, user.name/email (WAJIB terdaftar di GitHub), apakah repo adalah fork, status default branch, dan safe window waktu (07:00-23:59 WIB).
- **`forge new <tpl> <slug>`** — scaffold proyek dari template: copy + substitusi variable + git init + commit. Pakai `--push` buat langsung `gh repo create --public --push`.
- **`forge audit [dir]`** — score publish-readiness 0-100. Cek: README (>=1500 chars, ada install/usage/license section), LICENSE, CI, tests, package metadata, topics. WAJIB dijalanin sebelum publish.
- **`forge streak [--days 180]`** — ASCII heatmap dari real kontribusi lokal. Grouped by commit's own timezone. Nampilin streak sekarang, longest streak, active days ratio.
- **`forge log "apa yang lu bikin"`** — append ke `daily-log/YYYY-MM-DD.md`. Commit file ini juga = 1 kontribusi.
- **`forge ideas [--limit 15]`** — ranked backlog.
- **`forge templates`** — daftar template yang available.

### L3 — Ritual

Jadwal harian yang beneran sustain. Bukan sprint 3 jam, tapi **kebiasaan 20-45 menit**.

Daily block: setiap hari antara 08:00-23:00 WIB. Kenapa? Karena di luar window itu commit bisa kehitungan hari yang berbeda (cek [Aturan Main](#3-aturan-main-github-graph)).

### L4 — Distribution

Bikin sesuatu itu 40%. Biar orang tau itu 60%. Distribution dijadwalin MINGGUAN, bukan setelah semua selesai. Rincian di [Distribution System](#8-distribution-system).

---

## 3. Aturan Main GitHub Graph (terverifikasi)

Ini semua diverifikasi dari **dokumentasi resmi GitHub**. Bukan asumsi.

### Yang dihitung sebagai kontribusi:
- Commit, tapi dengan syarat tertentu
- PR yang dibuka
- Issue yang dibuka
- PR review
- Diskusi (Discussion)
- Bikin repo baru
- Fork repo

### Syarat commit dihitung (WAJIB semua):

1. **Email author commit** harus terdaftar di akun GitHub lu.
   - Cek: `git config user.email` — harus sama dengan email di GitHub Settings > Emails.
   - Email generic (`user@localhost`, `user@computer.local`) **TIDAK** bisa didaftarkan. Pakai email bener.
   - Kalau email belum terdaftar, graph perlu waktu 24 jam buat rebuild setelah didaftarkan.

2. **Repo harus standalone**, bukan fork.
   - Commit di fork = 0.
   - Solusi: jangan fork. Clone + `git init -b main` ulang. Ini yang dilakukan `forge new`.

3. **Commit harus di default branch** (`main`) atau `gh-pages`.
   - Kerja di branch lain: 0 sampai di-merge.
   - Strategi: squash-merge langsung ke main hari itu juga. Jangan biarin PR kebuka > 1 hari.

4. **Lu harus punya akses** ke repo (collaborator, org member, atau fork + open PR/issue).

### Yang dihitung di luar commit:
- **Issue, PR, review, discussion** — dihitung asal bukan di fork.
- **Bikin repo** — selalu dihitung.
- **Fork** — dihitung (fork itu sendiri dihitung, commit di dalamnya TIDAK).

### Timezone — bagian paling sering salah paham:
- Commit punya timezone di commit timestamp-nya.
- GitHub ngelompokin contribution per hari berdasarkan **waktu lu** (timezone di commit). Tapi kalau render graph-nya, ada dua interpretasi yang bisa bertentangan.
- **Aman: commit antara jam 07:00-23:59 waktu lokal.** Di window ini, dua interpretasi setuju = tanggal yang sama.
- **Berbahaya: commit antara 00:00-06:59.** Bisa kehitung sebagai hari yang berbeda antara profil orang yang liat dan data nyata commit lu.
- `forge doctor` nampilin safe window berdasarkan timezone mesin lu.

---

## 4. Cadence

### Daily (Senin-Jumat)

| Waktu | Aktivitas | Estimasi | Output |
|---|---|---|---|
| 08:00-08:05 | `forge ideas` → pilih item paling tinggi | 5 menit | Satu proyek |
| 08:05-08:10 | `forge new mcp-server my-project` | 5 menit | Scaffold siap |
| 08:10-08:40 | **IMPLEMENTASI** — bikin tool yang beneran jalan | 30 menit | Kode jadi |
| 08:40-08:45 | `forge audit .` → fix yang merah | 5 menit | Skor >= 80 |
| — | Commit dalam 3-5 slice kecil di `main` | — | 3-5 kontribusi |
| 21:00-21:05 | `forge log "what i built"` | 5 menit | Daily log entry |
| Sporadis | Submit 1 issue / comment ke OSS | — | 1 kontribusi tambahan |

Total: 45-60 menit.

### Daily (minimal — hari buruk)

| Command | Output |
|---|---|
| `forge log "Researched MCP SDK v2 API changes, documented findings in notes/"` | 1 commit langsung ke main |
| Buka 1 issue meaningful di proyek OSS yang lagi dipake | 1 kontribusi |

Total: 5-15 menit. Masih hijau, masih berguna.

### Weekends (Sabtu)

**Flagship finishing + distribution:**
- Polish salah satu proyek minggu ini: update README, screenshot, publish ke npm/PyPI
- `forge audit .` → score must >= 90
- `gh release create v0.1.0`
- Submit ke awesome-list yang cocok

### Mingguan (Minggu)

**Review + distribution:**
- `forge streak` — lihat streak real
- Tulis 1 thread X/LinkedIn tentang proyek terbaik minggu ini
- Submit 1 PR awesome-list
- Kalau ada proyek auto (digest template): pastikan workflow jalan

### Bulanan

- Review all published repos: mana yang stars naik, mana yang mati
- Portfolio site update
- Kirim 1 proposal talk / tulisan berdasarkan data dari proyek
- Evaluasi backlog: drop/repurpose ide yang gak jalan, prioritaskan ulang

---

## 5. Daily Loop

Ini step-by-step yang bisa dijalanin tanpa mikir panjang:

### Step 1: Pick

```
forge ideas --limit 5
```

Output ranking sehingga bisa pilih tanpa analisis berlebihan. Ambil yang paling atas yang lu merasa **mampu kerjain hari itu**.

Kalau ragu antara dua: pilih yang lebih pendek (tier S). Volume > perfection.

### Step 2: Scaffold

```
forge new mcp-server mcp-sqlite-explorer --title "MCP SQLite Explorer" --desc "Read-only MCP server for exploring SQLite databases with schema introspection and safe query execution"
```

Ini otomatis:
- Copy template + substitusi semua placeholder
- `git init -b main`
- Commit pertama: `feat: initial scaffold of mcp-sqlite-explorer`
- Kalau `--push`: bikin GitHub repo + push langsung

### Step 3: Implement

Bikin tool-nya beneran jalan. Template udah include satu working example (`repo_stats`). Ganti dengan tool yang sesuai.

Pedoman:
- Jangan over-engineer. Satu tool yang berguna > 10 tool yang setengah jadi.
- Error handling WAJIB ada. `isError: true` di MCP buat error yang jelas.
- Test minimal 3 case: sukses, edge case, error case.

### Step 4: Audit

```
forge audit .
```

Skor target: >= 80. Yang merah: fix dulu.

Checklist yang dicek:
- README: H1 title, >= 1500 chars, install section, usage section, license section, no TODO
- LICENSE file
- .gitignore
- CI workflow (nge-jalanin tests)
- Publish workflow
- Package metadata (description, keywords)
- Tests ada
- GitHub description + topics set

### Step 5: Publish (kalau layak)

```
gh repo create mcp-sqlite-explorer --public --source=. --remote=origin --push --description "..."
gh repo edit --add-topic mcp,sqlite,database,ai,developer-tools,llm
npm publish  # kalau template mcp-server
```

### Step 6: Log

```
forge log "Built and published mcp-sqlite-explorer — read-only SQLite explorer with schema introspection and safe query sandbox for AI agents"
```

Commit file ini.

### Step 7: Distribute (sisihkan 2 menit)

- Share ke 1 channel (X, LinkedIn, atau Reddit). Tidak harus tiap hari, tapi kalau proyeknya menarik, jangan ditunda.

---

## 6. Automation Lane (Digest Template)

Template `digest` beda dari yang lain: ini **bukan proyek yang lu bikin setiap hari**, tapi proyek yang **jalan sendiri tiap hari** lewat GitHub Actions cron.

### Cara kerjanya:
1. Lu scaffold satu kali: `forge new digest ai-tools-radar`
2. Setup secrets di repo: `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`
3. Push ke GitHub
4. Setiap hari jam 22:00 UTC (05:00 WIB), workflow jalan:
   - Fetch data dari GitHub API (atau sumber lain)
   - Compute delta vs kemarin
   - Render report markdown
   - Update README
   - Commit + push (sebagai author lu — dengan catatan email terdaftar)

### Keuntungan:
- Satu setup, kontribusi harian otomatis.
- Data publik — orang bisa akses datasetnya.
- Proyek yang "hidup" — terus diperbarui, beda sama repo statis.
- Grow exponential: makin banyak snapshot, makin valuable datasetnya.

### Risiko:
- Kalau cron-nya gagal (rate limit, API change), streak putus.
- Kalau email secret gak di-set, commit pakai `github-actions[bot]` → gak kehitung.

**Strategi:** Bikin 1-2 digest repo sebagai "baseline hijau" + proyek harian manual di atasnya. Minimal kalau suatu hari gak sempat coding, digest tetap nambah 1 commit.

---

## 7. Anti-Patterns

Ini yang bikin usaha sia-sia:

### Fork — ZERO kontribusi
**Dasar:** Aturan GitHub: "Commits made in a fork will not count toward your contributions."
**Solusi:** Jangan pernah commit langsung ke fork. Kalau mau kontribusi ke OSS, clone dulu, init ulang, atau buka PR dari fork (PR di parent dihitung).

### Feature branch — ZERO sampai di-merge ke main
Commits cuma dihitung di default branch. Punya branch `feature/awesome` dengan 30 commits — kalau gak di-merge, 30 itu semua gak kehitung.
**Solusi:** Squash-merge hari itu juga. Atau commit langsung di main (kalau proyek lu sendiri).

### Email tidak terdaftar — ZERO
Ini paling nyebelin: lu udah coding berjam-jam, commit-nya gak muncul.
**Solusi:** `forge doctor` cek ini setiap jalan. Pastikan `git config user.email` adalah salah satu dari email di GitHub Settings > Emails.

### Backdating commit — Reputasi risk
Ganti tanggal commit `--date` atau amend => secara teknis masuk graph, tapi:
- Waktu commit di Git gak konsisten.
- Kalau ada yang inspect commit history, keliatan palsu.
- **Tidak direkomendasikan.** Lebih baik skip sehari daripada curang.

### Empty commit / whitespace commit
`git commit --allow-empty -m "green"`. Ini kebaca sebagai spam. Rekruter bisa inspect graph dan liat commit kosong.
**Solusi:** Kalau gak ada energy, `forge log "rest day"` — itu 1 issue + 1 commit nyata.

### Bikin repo tanpa deskripsi, topics, README — tidak ketemu
GitHub search + Google ranking bergantung pada: deskripsi repo, topics, dan konten README.
**Solusi:** `forge audit` cek ini. Jangan publish kalau score < 80.

### Fork awesome-list — 0 kontribusi + dianggap plagiat
Fork dari repo lain = commit gak kehitung. Apalagi awesome-list fork — kontribusinya gak diakui.
**Solusi:** Bikin original list, bukan fork. Submit PR ke awesome-list asli.

---

## 8. Distribution System

Green graph = signal. Tapi tanpa distribution, gak ada yang liat repo lu.

### Channel peringkat berdasarkan ROI:

| Peringkat | Channel | Frekuensi | ROI |
|---|---|---|---|
| 1 | **npm / PyPI registry** | Setiap publish | **Tertinggi** — permanent discovery. Orang `pip install` langsung nemu. |
| 2 | **Awesome-list PR** | 1/minggu | Backlink permanen dari repo high-authority. Traffic recurring. |
| 3 | **Hacker News (Show HN)** | 1/bulan untuk flagship | Satu post bisa 500+ stars dalam 24 jam. Tapi high bar. |
| 4 | **X / Twitter thread** | 1/minggu | Followers + engaged audience. Cepet mati tapi compounding. |
| 5 | **Reddit (r/mcp, r/LocalLLaMA, r/javascript)** | 1/minggu | Niched, higher conversion dari X. |
| 6 | **LinkedIn post** | 1/minggu | Beda audience, lebih profesional. |
| 7 | **GitHub trending** | Organik | Kalau stars naik > 10/hari, masuk trending. |

### Pola posting:

```
"Baru shipping [NAMA PRODUK] — [DESKRIPSI SATU KALIMAT]"
"Built in [WAKTU]. TL;DR: [ISI]. Built with [STACK]."
"Repo: github.com/[USER]/[REPO]"
"#buildinpublic #opensource #ai"
```

Tambahkan: screenshot terminal atau video demo singkat.

### Awesome-list strategy:
- Cari: `awesome-mcp`, `awesome-claude`, `awesome-ai-tools`, `awesome-developer-tools`
- Untuk submit: fork repo (fork-only-but-PR-counts!), edit README, PR.
- Jangan submit semua proyek sekaligus — 1/minggu, proyek terbaik.

---

## 9. 30 Hari Pertama

| Hari | Aktivitas | Template | Output |
|---|---|---|---|
| 1 | **SETUP**: `gh auth login`, `git config`, `forge doctor` | — | Environment siap |
| 2 | mcp-web-snapshot | mcp-server | Server yang ambil snapshot web + README SEO |
| 3 | mcp-sqlite-explorer | mcp-server | SQLite explorer |
| 4 | ai-tools-radar | digest | Daily digest auto (setup GitHub secrets) |
| 5 | mcp-context-budget | mcp-server | Tool budget analyzer |
| 6 | mcp-repo-map | mcp-server | Repo structure map |
| 7 | **SABTU**: Publish 2 proyek minggu ini + awesome-list PR | — | 2 npm packages + 1 PR |
| 8 | ctx-cost | python-tool | Prompt cost CLI |
| 9 | mcp-secret-scan | mcp-server | Secret scanner |
| 10 | token-count | python-tool | Token counter CLI |
| 11 | mcp-diff-review | mcp-server | Code review server |
| 12 | commitsmith | python-tool | Conventional commit generator |
| 13 | **SABTU**: Publish 2 + 1 awesome-list PR + X thread | — | 2 lebih package |
| 14 | **MINGGU**: forge streak review + posting roundup | — | Evaluasi |
| 15 | mcp-cron | mcp-server | Scheduling server |
| 16 | mcp-test-runner | mcp-server | Test runner |
| 17 | mcp-git-forensics | mcp-server | Git blame analysis |
| 18 | ai-engineer-roadmap (mulai) | — | Repo edukasi (L) |
| 19 | Lanjutan roadmap | — | |
| 20 | **SABTU**: Publish 2 + 1 awesome-list | — | |
| 21 | mcp-env-doctor | mcp-server | Env diagnosis |
| 22 | mcp-deps-audit | mcp-server | Dependency audit |
| 23 | agentlog | python-tool | Log viewer CLI |
| 24 | mcp-cost-meter | mcp-server | Cost tracking server |
| 25 | repopack-lite | python-tool | Repo packer |
| 26 | **SABTU**: Publish 2 + 1 awesome-list | — | |
| 27 | mcp-openapi-bridge | mcp-server | OpenAPI → MCP |
| 28 | promptdiff | python-tool | Prompt diff CLI |
| 29 | model-price-tracker | digest | Pricing auto tracker |
| 30 | **SABTU**: Release 30-hari roundup, X thread, LinkedIn | — | Portfolio showcase |

---

## 10. Cara Setup

Pertama-tama, selesaikan ini:

```bash
# 1. GitHub auth
gh auth login

# 2. Git identity — EMAIL WAJIB yang terdaftar di GitHub
git config --global user.name "Nama Lu"
git config --global user.email "email@yang-terdaftar-di-github.com"

# 3. Cek semua prasyarat
cd ai-daily-forge
node bin/forge.mjs doctor

# 4. Kalau ada FORGE_CONFIG, bikin forge.config.json
# (opsional — kalau mau override author/email di semua sub-repo)
```

**Yang WAJIB diverifikasi sebelum kontribusi pertama:**
1. `forge doctor` must show "All clear" untuk email + gh auth.
2. Setiap project baru: `forge audit` ≥ 80 sebelum push.
3. Jangan commit di luar jam 07:00-23:59 WIB.

---

## Appendix: Kode Etik

1. **Setiap commit harus berguna.** Tidak ada `--allow-empty`, tidak ada whitespace-only.
2. **Satu proyek selesai > tiga proyek setengah jadi.**
3. **Test harus lulus sebelum publish.** Kalau belum punya test, minimal manual verification.
4. **README harus cukup buat orang paham dalam 10 detik.** Judul + deskripsi + contoh usage.
5. **Kalau capek, skip coding dan lakukan minimum:** `forge log "rest day"`. Jangan backdate.
6. **Kalau sakit atau traveling, digest bot masih jalan.** It's the safety net.

---

_Diverifikasi terhadap dokumentasi GitHub resmi (docs.github.com, September 2026)._