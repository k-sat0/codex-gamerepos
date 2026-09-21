# まるタップ

丸をクリック・タップして、30秒間のスコアを競うWebゲームです。
スマートフォン対応。自己ベストは遊んだブラウザに保存します。

## ローカルで遊ぶ

`index.html` をブラウザで開いてください。ビルドやライブラリのインストールは不要です。

## GitHub Pages

リポジトリの Settings → Pages で、Source を **Deploy from a branch**、Branch を **main**、Folder を **/ (root)** にして保存します。

公開先: https://k-sat0.github.io/codex-gamerepos/

## 更新する

HTML・CSS・JavaScriptを編集し、動作確認後に実行します。

```sh
git add index.html style.css script.js README.md
git commit -m "Update game"
git push origin main
```

Pagesの設定後は、mainへpushするたびに公開サイトが更新されます。
