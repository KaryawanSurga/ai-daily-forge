# Anti-Patterns — Verifikasi Langsung dari GitHub Docs

## Aturan yang diverifikasi dari docs.github.com

### 1. Fork = ZERO kontribusi
"Sumber: *Profile contributions reference > Contribution criteria for commits: The commits were made in a standalone repository, not a fork.*"
**Solusi:** Jangan commit ke fork. Clone dan `git init -b main`.

### 2. Feature branch = ZERO sampai di-merge
"*The commits were made in one of two branches: The repository's default branch or the gh-pages branch.*"
**Solusi:** Squash-merge ke main hari itu juga. Atau commit langsung di main.

### 3. Generic email = ZERO selamanya
"*Generic email addresses, such as jane@computer.local, cannot be added to GitHub accounts.*"
**Solusi:** Pakai Gmail atau noreply GitHub yang valid.

### 4. Email tidak terdaftar = ZERO
"*Commits will only appear on your contributions calendar if the email address you used to author the commits is connected to your GitHub account.*"
**Solusi:** `git config user.email` harus == salah satu email di GitHub Settings.

### 5. Menunggu 24 jam untuk muncul
"*After making a commit that meets the requirements to count as a contribution, you may need to wait for up to 24 hours to see the contribution appear.*"
**Bukan error** — tunggu.

## Yang tidak disarankan (bukan blokir teknis, tapi reputasi)

### Backdating commit
`git commit --date=...` atau `--amend` secara teknis masuk graph, tapi riwayat git tidak autentik.
**Alternatif:** Skip sehari dan lanjut besok. Streak yang jujur > 365 yang dipalsukan.

### Empty commit / whitespace
`git commit --allow-empty -m "green"` atau `--amend` tanpa perubahan.
**Risiko:** Rekruter yang inspect commit history akan liat. Negative signal.

### Bot commit tanpa email sendiri
GitHub Actions dengan `github-actions[bot]` default = kontribusinya bukan milik lu.
**Solusi:** Set `GIT_AUTHOR_NAME` / `GIT_AUTHOR_EMAIL` di repo secrets.