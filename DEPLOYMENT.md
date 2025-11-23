# デプロイメントガイド

## GitHub Pagesへのデプロイ

このプロジェクトをGitHub Pagesで公開するための手順です。

### ステップ1: リポジトリ設定へ移動

1. GitHubでリポジトリ `hn770123/PWA-motion` を開く
2. **Settings** タブをクリック

### ステップ2: Pages設定

1. 左サイドバーから **Pages** を選択
2. **Source** セクションで以下を設定：
   - **Source**: `Deploy from a branch` を選択
   - **Branch**: `main` または `copilot/create-tilt-game-for-iphone` を選択
   - **Folder**: `/ (root)` を選択
3. **Save** ボタンをクリック

### ステップ3: デプロイ完了を待つ

- 数分後、ページが公開されます
- 公開URLは以下の形式になります：
  ```
  https://hn770123.github.io/PWA-motion/
  ```

### ステップ4: 動作確認

1. iPhoneやAndroidデバイスでURLにアクセス
2. 「センサーを開始」ボタンをクリック（iOS 13以降）
3. 権限を許可
4. デバイスを傾けてゲームをプレイ

## カスタムドメインの設定（オプション）

カスタムドメインを使用する場合：

1. Pages設定画面で **Custom domain** セクションを探す
2. ドメイン名を入力（例: `tilt-game.example.com`）
3. DNSプロバイダーでCNAMEレコードを設定：
   ```
   tilt-game.example.com -> hn770123.github.io
   ```
4. **Save** をクリック
5. **Enforce HTTPS** にチェックを入れる（推奨）

## PWAとしてインストール

デプロイ後、ユーザーはPWAとしてアプリをインストールできます：

### iOS (Safari)
1. Safariでサイトを開く
2. 共有ボタン（四角に↑）をタップ
3. 「ホーム画面に追加」を選択

### Android (Chrome)
1. Chromeでサイトを開く
2. メニュー（⋮）をタップ
3. 「ホーム画面に追加」を選択

## トラブルシューティング

### ページが表示されない
- GitHub Actionsのビルドが完了しているか確認
- ブラウザのキャッシュをクリア
- しばらく待ってから再度アクセス

### センサーが動作しない
- HTTPSでアクセスしているか確認（GitHub Pagesは自動的にHTTPS）
- デバイスがジャイロセンサーをサポートしているか確認
- ブラウザの権限設定を確認

### Service Workerがエラーになる
- ブラウザのコンソールでエラーメッセージを確認
- Service Workerの登録を解除してページをリロード
- キャッシュをクリア

## 更新とバージョン管理

コードを更新した場合：

1. 変更をコミット＆プッシュ
2. GitHub Pagesが自動的に再デプロイ
3. `service-worker.js` の `CACHE_NAME` を更新して新しいバージョンを反映

```javascript
const CACHE_NAME = 'tilt-game-v2'; // バージョンを上げる
```

## セキュリティ

- GitHub PagesはデフォルトでHTTPSを有効化
- Content Security Policy (CSP) の追加を検討
- 定期的な依存関係の更新（現在は依存関係なし）

## モニタリング

デプロイ後、以下を確認：

- [ ] ゲームが正常に動作する
- [ ] 傾きセンサーが反応する
- [ ] ゴール判定が正しく動作する
- [ ] スコアが正しく加算される
- [ ] 画面外に出た際のリセットが動作する
- [ ] PWAとしてインストール可能
- [ ] オフラインで動作する（Service Worker）

## 参考リンク

- [GitHub Pages公式ドキュメント](https://docs.github.com/ja/pages)
- [PWA公式ドキュメント](https://web.dev/progressive-web-apps/)
- [DeviceOrientation API](https://developer.mozilla.org/ja/docs/Web/API/DeviceOrientationEvent)
