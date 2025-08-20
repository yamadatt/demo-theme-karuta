# 構造化データ実装ガイド - JSON-LD

## 実装した構造化データスキーマ

### ✅ 実装済みスキーマ一覧

| スキーマ | 対象ページ | 効果 | ファイル |
|---------|-----------|------|---------|
| **WebSite** | ホームページ | サイト内検索ボックス表示 | `website.html` |
| **Organization** | ホームページ | 企業/組織情報の表示 | `organization.html` |
| **BlogPosting** | 記事ページ | リッチスニペット、著者情報 | `article.html` |
| **BreadcrumbList** | 全非ホームページ | パンくずリスト表示 | `breadcrumb.html` |
| **CollectionPage** | セクション/タグページ | 記事一覧の構造化 | `collection.html` |
| **FAQPage** | FAQ含む記事 | FAQ回答の直接表示 | `faq.html` |

### 🎯 期待される効果

#### リッチスニペットの表示
- **記事**: タイトル、公開日、著者、アイキャッチ画像
- **サイト内検索**: Google検索結果にサイト内検索ボックス
- **パンくずリスト**: 検索結果でのナビゲーション表示
- **FAQ**: 質問と回答の直接表示

#### SEOへの効果
- **クリック率向上**: リッチスニペットにより視覚的に目立つ
- **検索順位向上**: 構造化データによるコンテンツ理解促進
- **音声検索対応**: FAQ回答が音声検索の候補になる

## 設定方法

### 1. 基本設定（config.toml）

```toml
[params]
  # 基本情報
  description = "サイトの説明文"
  author = "著者名"
  
  # 組織情報
  foundingDate = "2023-01-01"
  region = "Tokyo"
  email = "contact@example.com"
  
  # 画像設定
  logo = "/img/logo.png"
  logoWidth = 200
  logoHeight = 60
  authorImage = "/img/author.jpg"
  defaultCover = "/img/default-cover.svg"
  
  # ソーシャルメディア
  social = [
    "https://twitter.com/username",
    "https://github.com/username"
  ]
```

### 2. 記事での設定

#### Front Matterでの設定例

```yaml
---
title: "記事タイトル"
description: "記事の説明文（検索結果に表示）"
author: "著者名"
date: 2024-01-01
tags: ["Hugo", "SEO", "構造化データ"]
cover:
  image: "article-image.jpg"
  alt: "記事のアイキャッチ画像"

# FAQ スキーマ用
faq:
  - question: "この記事の主なポイントは？"
    answer: "JSON-LD形式での構造化データ実装について説明しています。"
  - question: "実装にかかる時間は？"
    answer: "基本的な実装であれば3-4日程度で完了できます。"
---
```

## 検証・テスト方法

### 1. 自動バリデーション

```bash
# 依存関係インストール（初回のみ）
cd scripts
npm install

# ローカルサイトでの検証
hugo server
npm run validate:local

# 本番サイトでの検証
npm run validate-structured-data https://yoursite.com
```

### 2. Google Rich Results Test

1. [Google Rich Results Test](https://search.google.com/test/rich-results) にアクセス
2. サイトのURLを入力してテスト実行
3. エラーや警告がないことを確認

### 3. Schema Markup Validator

1. [Schema.org Validator](https://validator.schema.org/) にアクセス
2. ページのURLまたはHTMLを入力
3. JSON-LD形式の構造化データが正しく認識されることを確認

## 実装詳細

### WebSite スキーマ
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "サイト名",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://example.com/search/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**効果**: Google検索結果にサイト内検索ボックスが表示される

### BlogPosting スキーマ
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "記事タイトル",
  "datePublished": "2024-01-01T00:00:00+09:00",
  "author": {
    "@type": "Person",
    "name": "著者名"
  },
  "publisher": {
    "@type": "Organization",
    "name": "サイト名"
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/image.jpg"
  }
}
```

**効果**: 記事のリッチスニペット表示（タイトル、日付、著者、画像）

### BreadcrumbList スキーマ
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "ホーム",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "記事",
      "item": "https://example.com/posts/"
    }
  ]
}
```

**効果**: 検索結果でのパンくずリスト表示

## トラブルシューティング

### よくある問題

#### 1. JSON-LD構文エラー
**症状**: 構造化データが認識されない
**解決策**: 
- JSON形式が正しいか確認
- ダブルクォートの使用を確認
- 末尾のカンマを削除

#### 2. 必須プロパティの不足
**症状**: Rich Results Testでエラー
**解決策**:
- BlogPosting: headline, datePublished, author, publisher が必須
- Organization: name, url が必須
- WebSite: name, url が必須

#### 3. 画像が表示されない
**症状**: リッチスニペットで画像が表示されない
**解決策**:
- 画像のURLが絶対パスであることを確認
- 画像サイズが適切であることを確認（推奨: 1200x630px）
- WebP形式の画像も適切に設定

### デバッグ用コマンド

```bash
# 特定のURLのみテスト
node structured-data-validator.js https://yoursite.com/specific-page/

# テスト結果の詳細確認
cat structured-data-reports/latest.json | jq '.results[0].schemas'

# エラーのみ表示
cat structured-data-reports/latest.json | jq '.results[] | select(.success == false)'
```

## 継続的な監視

### GitHub Actions設定例

```yaml
name: SEO Validation
on: [push, pull_request]

jobs:
  structured-data:
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
      - name: Validate structured data
        run: |
          cd scripts
          npm install
          npm run validate:local
```

## 今後の拡張予定

### 追加予定のスキーマ

1. **Product** - 商品ページ用
2. **Review** - レビュー記事用
3. **Event** - イベント情報用
4. **Recipe** - レシピ記事用
5. **HowTo** - チュートリアル記事用

### 高度な機能

1. **動的FAQ生成** - 記事内容からFAQを自動抽出
2. **多言語対応** - 各言語での構造化データ
3. **AMP対応** - AMP版での構造化データ
4. **パフォーマンス最適化** - 構造化データの遅延読み込み

## 参考資料

- [Schema.org Documentation](https://schema.org/)
- [Google Search Central - 構造化データ](https://developers.google.com/search/docs/appearance/structured-data)
- [JSON-LD Specification](https://json-ld.org/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Structured Data Testing Tool](https://validator.schema.org/)