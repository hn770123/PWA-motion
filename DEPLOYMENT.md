# デプロイメントガイド

## GitHub Pagesへのデプロイ

このプロジェクトをGitHub Pagesで公開するための手順です。

## 自動デプロイ（推奨）

GitHub Actionsを使用した自動デプロイが設定されています。

### ステップ1: リポジトリ設定へ移動

1. GitHubでリポジトリ `hn770123/PWA-motion` を開く
2. **Settings** タブをクリック

### ステップ2: Pages設定

1. 左サイドバーから **Pages** を選択
2. **Source** セクションで以下を設定：
   - **Source**: `GitHub Actions` を選択
3. 設定は自動的に保存されます

### ステップ3: デプロイ実行

1. `main` ブランチにコードをプッシュ、または
2. **Actions** タブから「GitHub Pagesへデプロイ」ワークフローを手動実行

### ステップ4: デプロイ完了を待つ

- **Actions** タブでデプロイの進行状況を確認できます
- 通常1〜2分程度でデプロイが完了します
- 公開URLは以下の形式になります：
  ```
  https://hn770123.github.io/PWA-motion/
  ```

## 手動デプロイ（非推奨）

ブランチから直接デプロイする場合：

1. **Pages** 設定で **Source** を `Deploy from a branch` に設定
2. **Branch** を `main` に、**Folder** を `/ (root)` に設定
3. **Save** ボタンをクリック

注意: 手動デプロイの場合、コード更新のたびに自動的にデプロイされません。

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
- **Actions** タブでワークフローが正常に完了しているか確認
  - エラーがある場合、ログを確認して原因を特定
- GitHub Pagesの設定が正しいか確認（Settings → Pages）
  - Source: "GitHub Actions" になっているか
- ブラウザのキャッシュをクリア
- しばらく待ってから再度アクセス（初回デプロイは数分かかる場合あり）

### デプロイワークフローが失敗する
- リポジトリの **Settings** → **Actions** → **General** で:
  - "Workflow permissions" が適切に設定されているか確認
  - "Read and write permissions" または必要な権限が有効か確認
- `.github/workflows/deploy.yml` の構文エラーがないか確認
- GitHub Pagesが有効になっているか確認

### センサーが動作しない
- HTTPSでアクセスしているか確認（GitHub Pagesは自動的にHTTPS）
- デバイスがジャイロセンサーをサポートしているか確認
- ブラウザの権限設定を確認
- iOSの場合、「センサーを開始」ボタンをタップして権限を許可

### Service Workerがエラーになる
- ブラウザのコンソール（開発者ツール）でエラーメッセージを確認
- Service Workerの登録を解除してページをリロード:
  - Chrome: DevTools → Application → Service Workers → Unregister
  - Safari: 開発 → Service Workers → 削除
- ブラウザのキャッシュをクリア
- `service-worker.js` のパスが正しいか確認

## 更新とバージョン管理

コードを更新した場合：

1. 変更をコミット＆プッシュ（`main` ブランチへ）
2. GitHub Actionsが自動的にデプロイワークフローを実行
3. **Actions** タブでデプロイ状況を確認
4. `service-worker.js` の `CACHE_NAME` を更新して新しいバージョンを反映

```javascript
const CACHE_NAME = 'tilt-game-v2'; // バージョンを上げる
```

### デプロイワークフローの確認

- リポジトリの **Actions** タブを開く
- 「GitHub Pagesへデプロイ」ワークフローを選択
- 各ステップの実行状況とログを確認できます

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
