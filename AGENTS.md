# b0bisore.com サイト（GitHub Pages）

このフォルダは GitHub の `b0bisore/b0bisore-site` と同期しています。`main` ブランチにプッシュすると、1〜2分で https://b0bisore.com に反映されます（GitHub Pages）。Claude Code・Codex のどちらからでも同じ手順で更新できます。AGENTS.md も同じ内容です。

## 構成
| パス | 公開URL | 内容 |
|---|---|---|
| `index.html` | https://b0bisore.com/ | ゲーム一覧（BOB'S GAMES） |
| `game/rinne-gacha/index.html` | https://b0bisore.com/game/rinne-gacha/ | 輪廻ガチャ本体（1ファイルで完結） |
| `game/rinne-gacha/og.png` | 同上/og.png | SNS共有時のプレビュー画像（1200×630） |
| `CNAME` | — | 独自ドメイン設定。消さない |
| `.nojekyll` | — | GitHub Pages の変換を止める。消さない |

## 更新の手順
1. `git pull` で最新にする。
2. ファイルを編集する。
3. 確認する（下記）。
4. `git add` → `git commit` → `git push`。
5. 1〜2分後に公開URLを開いて反映を確認する。

## 確認すること
- ブラウザで開き、生命転生・人間転生の両方で「転生する」が動くこと。
- 日本語／English の切り替えで表示が崩れないこと。
- スマホ幅（約390px）で横にはみ出さないこと。
- コンソールにエラーが出ないこと。

## 輪廻ガチャの決まりごと
- シェアURL（`SHARE_URL`）、canonical、og:url は `https://b0bisore.com/game/rinne-gacha/`。URLを変えるときは3か所とも直す。
- 外部から読み込むのは Google Fonts だけ。ライブラリや画像を外部から読み込まない。
- 画面の文字はすべて日本語と英語の両方を用意する（`t("日本語","English")`）。
- 数字は日本語の単位（万・億・兆）を使わず、カンマ区切りと「×10の何乗（0を並べた表記）」で書く。英語の読み（billion など）は英語表示のときだけ付ける。
- 統計の数値は概算。出典を変えたら、ページ下部の注意書きも直す。

## やらないこと
- `CNAME` と `.nojekyll` を消さない。
- Xserver にはアップロードしない（2026-10-14 に運用を終了）。
- 個人情報（本名・連絡先など）をこのリポジトリに入れない。リポジトリは公開されている。
