# b0bisore.com サイト（GitHub Pages）

このフォルダは GitHub の `b0bisore/b0bisore-site` と同期しています。`main` ブランチにプッシュすると、1〜2分で https://b0bisore.com に反映されます（GitHub Pages）。Claude Code・Codex のどちらからでも同じ手順で更新できます。AGENTS.md も同じ内容です。

## 構成
| パス | 公開URL | 内容 |
|---|---|---|
| `index.html` | https://b0bisore.com/ | ゲーム一覧 https://games.b0bisore.com/ （ChatGPT Sites で別管理）へ転送するだけのページ |
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

## 計測（Google スプレッドシート）
- ほかのゲームと同じく、ゲームごとの「プレイ記録」スプレッドシートに1操作1行で記録する。輪廻ガチャは「輪廻ガチャ プレイ記録」（ID: 1PvFtZxVfqXmGilr_TVJZS66aY6GViiJk5S9SpWnP5VQ）。
- 受け口はそのスプレッドシートに付けた Apps Script のウェブアプリ。コードの正本は H:Codex
inne-gacha	oolsanalyticsCode.gs（このリポジトリには置かない）。
- ゲーム側は `LOG_URL` にウェブアプリURLを入れると記録が始まる。空なら何も送らない。
- 送る action：visit（ページを開いた）、roll（転生）、share、mode、lang。集計シートの B2＝プレイ開始（ページを開いた回数）、B3＝リザルト到達（1回以上転生した訪問の数）。全ゲーム集計（ID: 1_YnrUJC-dOml1u8isk0VAILRFDqUXNp4XaYCv0OuPfo）の「まとめ」はこの2つを読む。
- 名前・メールなど個人を特定できる情報は送らない。訪問IDはページを開くたびに作る使い捨ての文字列。
- 記録の項目を変えたら `GAME_VERSION` を上げる。

## ゲーム一覧について
- 一覧（BOB'S GAMES）は https://games.b0bisore.com/ にあり、このリポジトリでは管理していない。一覧への掲載・変更は本人の指示があってから、一覧側で行う。

## やらないこと
- `CNAME` と `.nojekyll` を消さない。
- Xserver にはアップロードしない（2026-10-14 に運用を終了）。
- 個人情報（本名・連絡先など）をこのリポジトリに入れない。リポジトリは公開されている。
