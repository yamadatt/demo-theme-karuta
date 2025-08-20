# Core Web Vitals改善ガイド

## 実装した最適化項目

### ✅ LCP（Largest Contentful Paint）最適化

1. **重要画像のプリロード**
   ```html
   <!-- ホームページの最初の3つの記事画像をプリロード -->
   <link rel="preload" as="image" href="image.webp" type="image/webp">
   ```

2. **WebP画像の活用**
   - 既に実装済み（picture要素 + srcset）
   - WebP形式で40-80%のファイルサイズ削減

3. **Critical CSSのインライン化**
   - Above-the-foldのスタイルを`<style>`タグで即座に適用
   - レンダリングブロッキングの削除

### ✅ FID（First Input Delay）改善

1. **重いタスクの分割処理**
   ```javascript
   // 検索処理を50件ずつのチャンクに分割
   function processSearchResults(list, query, callback) {
     const CHUNK_SIZE = 50;
     // setTimeout(processChunk, 0) でメインスレッドに制御を戻す
   }
   ```

2. **入力のデバウンス処理**
   ```javascript
   // 150msのデバウンスで無駄な処理を削減
   searchTimeout = setTimeout(function() {
     runSearch(q, false);
   }, 150);
   ```

3. **イベントリスナーの最適化**
   - パッシブリスナーの使用
   - 不要なイベント処理の削減

### ✅ CLS（Cumulative Layout Shift）削減

1. **画像のアスペクト比固定**
   ```css
   .card-cover {
     aspect-ratio: 16 / 9;
     position: relative;
   }
   .card-cover img {
     position: absolute;
     top: 0;
     left: 0;
   }
   ```

2. **フォント読み込み最適化**
   ```css
   @font-face {
     font-family: 'System UI Fallback';
     font-display: swap; /* レイアウトシフト防止 */
   }
   ```

3. **既存の最適化**
   - width/height属性の設定済み
   - loading="lazy"の適切な配置

## パフォーマンス測定

### 自動監視スクリプトの使用

1. **依存関係のインストール**
   ```bash
   cd scripts
   npm run install-deps
   ```

2. **ローカルサイトの測定**
   ```bash
   # Hugoサーバーを起動
   hugo server
   
   # 別ターミナルで測定実行
   cd scripts
   npm run audit:local
   ```

3. **本番サイトの測定**
   ```bash
   npm run audit https://yoursite.com
   ```

### 目標値

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| Performance Score | 95+ | Lighthouse |
| LCP | <2.5秒 | Core Web Vitals |
| FID | <100ms | Core Web Vitals |
| CLS | <0.1 | Core Web Vitals |

## 継続的な監視

### GitHub Actionsでの自動化（推奨）

```yaml
# .github/workflows/performance.yml
name: Performance Audit
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Build site
        run: hugo --minify
      - name: Serve site
        run: |
          hugo server --bind 0.0.0.0 --port 1313 &
          sleep 5
      - name: Run performance audit
        run: |
          cd scripts
          npm run install-deps
          npm run audit:local
```

## トラブルシューティング

### よくある問題

1. **LCPが遅い**
   - 画像のプリロードが正しく設定されているか確認
   - WebP画像が生成されているか確認
   - CDNの設定確認

2. **FIDが高い**
   - JavaScriptの実行時間をチェック
   - 重い処理が同期実行されていないか確認
   - サードパーティスクリプトの影響を確認

3. **CLSが発生**
   - 画像にwidth/height属性があるか確認
   - フォント読み込み設定を確認
   - 動的コンテンツの挿入箇所を確認

### パフォーマンス分析

```bash
# 詳細な分析結果の確認
cat performance-reports/latest.json | jq '.results[0].coreWebVitals'

# 特定のURLのみ測定
node lighthouse-audit.js https://yoursite.com/specific-page/
```

## 今後の改善案

1. **Service Worker実装**
   - リソースのキャッシュ戦略
   - オフライン対応

2. **HTTP/2 Server Push**
   - Critical リソースのプッシュ
   - Connection最適化

3. **Resource Hints**
   - dns-prefetch
   - preconnect
   - prefetch

4. **Bundle最適化**
   - Code splitting
   - Tree shaking
   - Dynamic imports

## 参考資料

- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Auditing](https://developers.google.com/web/tools/lighthouse)
- [WebP Image Format](https://developers.google.com/speed/webp)
- [Font Display Strategy](https://web.dev/font-display/)