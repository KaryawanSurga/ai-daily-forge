# Distribution Strategy

> "Bikin itu 40%. Biar orang tau itu 60%."

## Channel Ranking (by ROI)

| Rank | Channel | Frekuensi | ROI |
|---|---|---|---|
| 1 | **npm / PyPI publish** | Setiap release | Permanent discovery via `pip install` / `npm install` |
| 2 | **Awesome-list PR** | 1/minggu | Backlink dari high-authority repo = recurring traffic |
| 3 | **GitHub Search SEO** | Satu kali (README + topics) | Traffic paling stabil: orang nyari "mcp sqlite" |
| 4 | **Show HN** | 1/bulan flagship | 500+ stars dalam 24 jam kalau tembus |
| 5 | **X / Twitter** | 1/minggu | Compounding followers — tiap post nambah reach |
| 6 | **Reddit** | 1/minggu | Niched (r/mcp, r/LocalLLaMA, r/javascript) |
| 7 | **LinkedIn** | 1/minggu | Beda audience, profesional |

## README SEO — Template

Dari `forge new`, semua proyek udah punya README yang struktur:

```
# {{TITLE}}          ← judul mengandung kata kunci pencarian
Badges (npm/CI)
{{DESCRIPTION}}      ← value proposition dalam 1 kalimat

## Why               ← masalah nyata yang dipecahin
## Install           ← copy-paste command
## Usage             ← contoh yang beneran jalan
## Features          ← bullet point
## Configuration     ← minimal
## License           ← MIT
```

Ini bukan kebetulan — ini strategi. GitHub nge-index README buat search, Google juga.

## Topics Strategy

Setiap repo WAJIB punya topics. Template:
- `mcp-server`: `mcp,model-context-protocol,mcp-server,ai-agent,claude,developer-tools,{{SLUG}}`
- `python-tool`: `cli,python,developer-tools,productivity,{{SLUG}}`

Cara set: `gh repo edit --add-topic mcp,ai,developer-tools`

## Awesome-list Maps

Yang paling relevan:

| List | URL | Kategori |
|---|---|---|
| Awesome MCP Servers | github.com/punkpeye/awesome-mcp-servers | MCP |
| Awesome Claude | github.com/anthropics/awesome-claude | Claude skills |
| Awesome AI Tools | github.com/awesome-selfhosted/awesome-selfhosted | Tools |

## Weekly Distribution Pattern

```
Senin-Kamis: Fokus bikin. Jangan posting.
Jumat: Publish + screenshot.
Sabtu: 1 X thread + 1 Reddit post + 1 LinkedIn post + awesome-list PR.
Minggu: Review + planning.
```

## Launch Checklist (untuk flagship project)

- [ ] `forge audit` >= 90
- [ ] Topics set (3+ relevan)
- [ ] Screenshot/produk demo (video kalau bisa, gif kalau enggak)
- [ ] `npm publish` / `pypi publish` udah jalan
- [ ] Siapin 3 kalimat untuk X: "Baru shipping [X] — [Y]. Dibikin dalam [Z]. Stack: [A]. Repo: [B]. #buildinpublic"
- [ ] Siapin post Reddit di subreddit yang tepat
- [ ] Optional: kirim ke Hacker News (Show HN) — high bar, prepare for tough comments