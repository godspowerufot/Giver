# Giver Demo — Locked Brief

```
Product: Giver
Audience: Customer + Launch
Length: ~32s
Aspect: 16:9 (1920×1080)
VO: yes (record later) · Captions: OFF
Distribution: X + WhatsApp
Viewer: everyone
Tone: cursor screen-sharing live (founder demo)
Data: fake anonymized (no loan apps)
Opening: product type-in (statement → #1 Ada) then brand
Desktop only · B/W lightning · dark ambient bed + UI SFX
Cursor: visible white · click zoom on CTA moments
CTA: B — “Upload. Rank. Share the moment.”
UI: pure product · no face cam

Must: Upload, Top senders, Volume pie, Celebration card, Thank-you card, Recommendations
Nice: Metrics, Person drawer
Skip: Net balances, People/Transactions/Insights pages, Mobile
Note: Top recipients chart included briefly (product core + feeds celebration card)
```

## Shot list
| Scene | Time | Content |
|-------|------|---------|
| Logo | ~12.0s | Slow type statement story → hold #1 Ada → Giver brand + tagline |
| Upload | ~4.2s | Dropzone, click Choose file (zoom + click SFX), parse |
| Dashboard | ~6.2s | Metrics, senders, pie, recommendations, recipients + click zoom |
| Person | ~4.4s | Drawer slide-in (click + whoosh), stats, tx list |
| Cards | ~5.2s | Celebration → Thank-you + Download zoom/clicks |
| End | ~2.8s | Lockup CTA |
| Fades | 18f (~0.6s) | Slower crossfades between scenes |

## Audio (`public/sfx/`)
| File | Use |
|------|-----|
| ambient.wav | Soft bed under full demo |
| type.wav | Intro typewriter ticks |
| click.wav | Button / row clicks |
| whoosh.wav | Transitions, drawer, file drop |
| success.wav | Parse done, download, brand settle |
| pop.wav | Card appears |

Regenerate: `node scripts/generate-sfx.mjs`

## Preview
```bash
cd giver-promo
npm run dev
```
Open composition **GiverDemo**. Unmute Studio to hear SFX.
