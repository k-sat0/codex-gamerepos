# あそびの広場

軽いゲームやアプリをまとめた、HTML・CSS・JavaScriptだけのサイトです。
公開先: https://k-sat0.github.io/codex-gamerepos/

## 構成

```text
index.html              # アプリ一覧
style.css               # 一覧のデザイン
theme.js                # 全ページ共通のテーマ切り替え
theme.css               # 全ページ共通の SODA POP 配色
AGENTS.md               # 次回以降の制作で適用する共通設定
apps/
  forged-gallery/       # 偽造美術館：全5室の一人用潜入パズル
    index.html
    style.css
    engine.js           # ターン処理・視線判定・ステージ定義
    script.js           # Canvas描画・操作・記録・リプレイ
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

## カラーテーマ

偽造美術館も共通テーマに対応し、盤面の色も切り替わります。移動・待機・すり替えごとに警備が進むターン制で、全作品をすり替えて出口に着くとクリア。矢印/WASDで移動、Spaceで待機、Eですり替え、Zで1手戻す、Rで再挑戦。タッチ操作にも対応し、各室の最少手数を端末内に保存します。効果音は任意で有効化できます。全室の到達可能性と視線・手番の検証は `node apps/forged-gallery/verify.cjs` で実行できます。

ライトとダークのソーダポップテーマを切り替えられます。初回は端末の設定に合わせ、切り替え後は選択をブラウザに保存して全ページで共有します。配色は `theme.css`、切り替え処理は `theme.js` に集約しています。新しいアプリもこの2ファイルを読み込んでください。制作時の共通ルールは `AGENTS.md` に記録しています。

## 公開・更新

GitHub Pagesは **Deploy from a branch → main → / (root)** を使用します。
mainにpushすると、一覧とすべてのアプリが更新されます。

```sh
git add index.html style.css apps README.md
git commit -m "Update apps"
git push origin main
```
