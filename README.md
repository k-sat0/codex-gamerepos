# あそびの広場

軽いゲームやアプリをまとめた、HTML・CSS・JavaScriptだけのサイトです。
公開先: https://k-sat0.github.io/codex-gamerepos/

## 構成

```text
index.html              # アプリ一覧
style.css               # 一覧のデザイン
apps/
  maru-tap/
    index.html          # まるタップ
    style.css
    script.js
README.md
```

## ローカルで遊ぶ

ルートの `index.html` をブラウザで開いてください。ビルドや依存ライブラリのインストールは不要です。

## アプリを追加する

1. `apps/<アプリ名>/` に `index.html`、`style.css`、必要なら `script.js` を作ります。
2. アプリ内のCSS・JSは `./style.css`、`./script.js` のように相対パスで参照します。
3. アプリに `../../index.html` への「アプリ一覧に戻る」リンクを置きます。
4. ルートの `index.html` の `.app-grid` にカードを追加し、`./apps/<アプリ名>/index.html` へリンクします。
5. PC・スマホ幅で、一覧との往復とアプリの動作を確認します。

各アプリは独立させ、共通ライブラリやビルド工程は必要になってから導入します。
ブラウザ保存のキーにはアプリ名を含めてください（例: `maru-tap-best-v1`）。記録の端末間同期はありません。
まるタップは従来と同じ保存キーのため、同じ公開サイト・ブラウザの自己ベストを引き継ぎます。

## 公開・更新

GitHub Pagesは **Deploy from a branch → main → / (root)** を使用します。
mainにpushすると、一覧とすべてのアプリが更新されます。

```sh
git add index.html style.css apps README.md
git commit -m "Update apps"
git push origin main
```
