# Hugo Theme Karuta - 改善計画

## 現状分析

### テーマの特徴
- カード型レイアウトの日本語特化Hugoテーマ
- 高度なクライアントサイド検索機能
- WCAG 2.1 AA準拠のアクセシビリティ
- 軽量設計（外部ライブラリ依存なし）

## 改善項目

### 1. パフォーマンス・最適化 🚀

#### 1.1 CSS最適化

##### 1.1.1 CSS重複削除の詳細作業

###### 問題の分析
- **critical.css** (インライン) と **main.css** (非同期) に同じCSSが重複
- **accessibility.css** にもCSS変数が重複定義
- 同じセレクタが複数ファイルに存在し、ブラウザが不要なCSS解析を実行

###### 重複している内容
- `:root` CSS変数（--bg, --text, --heading など）
- 基本要素のスタイル（html, body, a, h1-h6）
- レイアウトコンポーネント（.container, .site-header, .logo）
- リセットスタイル（*, box-sizing）

###### 実行する作業
1. **Critical CSS の整理**
   - First Paintに必要な最小限のスタイルのみ残す
   - CSS変数の定義
   - html, body の基本スタイル
   - ヘッダー部分のレイアウト
   - Above the fold の要素のみ

2. **Main CSS の整理**
   - critical.cssと重複する部分を削除
   - 非同期読み込みされるスタイルに整理
   - コンポーネント別にセクション分けして可読性向上

3. **CSS変数の統一**
   - accessibility.cssの変数定義を整理
   - ダークモード用変数の重複削除
   - 一箇所でのCSS変数管理に統一

4. **読み込み順序の最適化**
   - 現在: critical.css (inline) → main.css (async) → accessibility.css (sync)
   - 改善後: critical.css (inline) → main.css (async) → accessibility.css (async)

###### 期待される効果
- CSSファイルサイズ削減（推定15-20%）
- ブラウザの解析時間短縮
- レンダリングブロッキング時間の削減
- CSS変数の一元管理
- スタイルの重複による意図しない上書き防止

###### 数値目標
- critical.css: 3KB以下に削減
- main.css: 重複削除で20%サイズ削減
- CSSパースタイム: 10-15%改善

##### 1.1.2 CSS変数の統一・整理

###### 現状の問題
- 4つのCSSファイルで147回のCSS変数使用
- 同じ変数が複数ファイルで重複定義
- テーマカラーの値が微妙に異なる（accessibility.css）
- カラートークンの命名規則が不統一

###### 実行する作業
1. **CSS変数の一元管理**
   - critical.cssに基本変数のみ定義
   - main.cssから重複するCSS変数定義を削除
   - accessibility.cssの変数をオーバーライド形式に変更

2. **変数の命名規則統一**
   - セマンティックな命名（--primary, --secondary）
   - コンポーネント固有変数（--card-bg, --header-height）
   - 状態変数（--focus-color, --hover-bg）

3. **カラーパレットの体系化**
   - Base colors（グレースケール）
   - Semantic colors（primary, secondary, accent）
   - Status colors（success, warning, error）
   - Theme variants（light/dark）

###### 期待される効果
- CSS変数定義の20%削減
- テーマカスタマイズの簡素化
- カラーコントラスト比の統一

##### 1.1.3 未使用CSSの削除

###### 対象の特定方法
- HTMLテンプレートで使用されていないクラス
- JavaScriptで動的生成されないセレクタ
- 古いブラウザ対応の不要なプレフィックス
- 重複するメディアクエリ

###### 実行する作業
1. **クラス使用状況の調査**
   - layouts/内の全HTMLテンプレートをスキャン
   - JavaScript内でのクラス生成を確認
   - 動的に追加されるクラス（.theme-dark等）をリストアップ

2. **未使用セレクタの削除**
   - 孤立したCSSルール
   - 使用されていないユーティリティクラス
   - 不要なベンダープレフィックス

3. **メディアクエリの最適化**
   - 重複するブレークポイント統合
   - 使用されていないレスポンシブルール削除

###### 削除候補
- レガシーブラウザ対応コード
- 開発時のデバッグ用クラス
- 未実装機能のスタイル
- 重複するリセットCSS

###### 期待される効果
- CSSファイルサイズ10-15%削減
- パースタイムの短縮
- 保守性の向上

##### 1.1.4 CSS Grid/Flexboxの最適化

###### 現状の使用状況
- Flexbox: 25箇所で使用（ナビゲーション、カード、レイアウト）
- Grid: 8箇所で使用（カードグリッド、検索結果、タイムライン）
- main.css: 1855行中48行がGrid/Flexbox関連

###### 最適化項目
1. **Gridレイアウトの統一**
   ```css
   /* 現在: 複数のgrid-template-columns定義 */
   grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
   grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
   grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
   
   /* 改善後: CSS変数による統一 */
   grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width), 1fr));
   ```

2. **Flexboxの冗長性削除**
   - デフォルト値の明示的記述削除
   - 不要なflex-wrap: wrapの削除
   - flex-direction: rowの省略

3. **レスポンシブGrid/Flexの改善**
   - コンテナクエリ対応の準備
   - subgridの活用検討
   - gap プロパティの統一使用

###### 実行する作業
1. **Grid定義の変数化**
   - カード幅の最小値を変数化
   - グリッドギャップの統一
   - ブレークポイント別の調整

2. **Flexbox最適化**
   - 不要なプロパティ削除
   - ショートハンド記法の活用
   - align-items/justify-contentの最適化

3. **パフォーマンス向上**
   - contain: layoutの適用
   - will-changeの適切な使用
   - レイアウトシフト対策

###### 期待される効果
- レイアウト計算の最適化
- Grid/Flexboxコード量15%削減
- レスポンシブデザインの保守性向上
- Core Web Vitals（CLS）の改善

#### 1.2 JavaScript最適化
- [ ] バンドル化・ミニファイ実装
- [ ] Tree shaking導入
- [ ] コード分割（Critical/Non-critical）
- [ ] Service Workerのキャッシュ戦略改善

#### 1.3 画像最適化
- [ ] WebP自動生成・配信
- [ ] レスポンシブ画像の実装
- [ ] Lazy loading最適化
- [ ] 画像圧縮の自動化

### 2. 開発体験・保守性 🛠️

#### 2.1 コード品質向上

##### 2.1.1 ESLint設定の強化

###### 現状の確認
✅ **既に導入済みの項目**
- ESLint 9.33.0 (最新のFlat Config形式)
- Stylelint 16.23.1 (CSS Linting)
- Prettier 3.6.2 (コードフォーマッター)
- prettier-plugin-go-template (Hugoテンプレート対応)

###### 現在の設定レベル
```javascript
// eslint.config.mjs の現在のルール
rules: {
  "no-var": "error",           // var禁止
  "prefer-const": "error",     // const推奨
  "eqeqeq": "error",          // 厳密等価演算子
  "no-console": "off",        // console.log許可（本番では要検討）
  "no-unused-vars": "warn",   // 未使用変数は警告
}
```

###### 改善すべき点

**1. セキュリティルールの追加**
```javascript
// 追加推奨ルール
"no-eval": "error",                    // eval()禁止
"no-implied-eval": "error",            // setTimeout/setInterval文字列禁止
"no-new-func": "error",               // Function()コンストラクタ禁止
"no-script-url": "error",             // javascript:URL禁止
```

**2. パフォーマンスルールの強化**
```javascript
"no-loop-func": "error",              // ループ内関数作成禁止
"no-inner-declarations": "error",     // ネストした関数宣言禁止
"array-callback-return": "error",     // Array methodの戻り値必須
```

**3. アクセシビリティ考慮**
```javascript
// eslint-plugin-jsx-a11yの導入検討（Hugo templateにも適用可能な部分）
"no-global-assign": "error",          // グローバル変数の再代入禁止
```

**4. 本番環境用の厳格化**
```javascript
// CI/本番ビルド用
"no-console": "error",                // console文禁止
"no-debugger": "error",              // debugger文禁止
"no-alert": "error",                 // alert/confirm/prompt禁止
```

##### 2.1.2 Prettier設定の詳細化

###### 現状の問題
- `.prettierrc`設定ファイルが未作成
- Hugoテンプレート用の詳細設定不足
- エディタ統合の自動化不完全

###### 実行する作業

**1. Prettier設定ファイル作成**
```json
// .prettierrc.json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "quoteProps": "as-needed",
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "go-template",
        "printWidth": 120
      }
    },
    {
      "files": "*.css",
      "options": {
        "singleQuote": false,
        "printWidth": 120
      }
    }
  ]
}
```

**2. .prettierignore作成**
```
# Build outputs
public/
resources/
node_modules/

# Vendor files
themes/karuta/static/js/mermaid.min.js
themes/karuta/static/js/mermaid-init.js

# Hugo generated
.hugo_build.lock
```

##### 2.1.3 Pre-commit hooks設定

###### 現状
- Git pre-commit hooks未設定
- コミット前のコード品質チェック自動化なし
- 不適切なコードがコミットされるリスク

###### 実行する作業

**1. Huskyの導入**
```bash
npm install --save-dev husky lint-staged
npm pkg set scripts.prepare="husky install"
npm run prepare
```

**2. lint-stagedの設定**
```json
// package.json に追加
"lint-staged": {
  "themes/karuta/static/js/**/*.js": [
    "eslint --fix",
    "prettier --write"
  ],
  "themes/karuta/static/css/**/*.css": [
    "stylelint --fix",
    "prettier --write"
  ],
  "themes/karuta/layouts/**/*.html": [
    "prettier --write"
  ]
}
```

**3. Git hooks設定**
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run lint:all
```

**4. commit-msgフックの追加**
```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Conventional Commits形式のチェック
npx --no -- commitlint --edit ${1}
```

##### 2.1.4 追加のDeveloper Experience向上

###### 1. エディタ統合設定

**VSCode設定ファイル作成**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "eslint.workingDirectories": ["themes/karuta"],
  "files.associations": {
    "*.html": "gotemplate"
  }
}
```

**推奨拡張機能**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "stylelint.vscode-stylelint",
    "bradlc.vscode-tailwindcss"
  ]
}
```

###### 2. CI/CD統合

**GitHub Actions設定**
```yaml
# .github/workflows/lint.yml
name: Lint and Format Check
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint:all
      - run: npm run check
```

###### 期待される効果
- コミット時の自動品質チェック
- チーム間でのコード品質統一
- 開発時の早期エラー発見
- CI/CDでの品質保証自動化

##### 2.1.5 TypeScript導入検討

###### 現在のJavaScript分析
- 純粋なVanilla JavaScript使用
- ライブラリ依存なし（軽量性重視）
- DOM操作中心のコード

###### TypeScript導入のメリット・デメリット

**メリット**
- 型安全性によるバグ削減
- IDE支援の向上
- ドキュメント代わりの型定義
- リファクタリングの安全性

**デメリット**
- ビルドステップの複雑化
- Hugoとの統合コスト
- 軽量性の犠牲
- 学習コスト

###### 段階的導入戦略

**Phase 1: JSDoc + TypeScriptチェック**
```javascript
// JSDocでの型注釈
/**
 * @param {HTMLElement} element
 * @param {string} className
 * @returns {boolean}
 */
function hasClass(element, className) {
  return element.classList.contains(className);
}
```

**Phase 2: .d.ts ファイルでの型定義**
```typescript
// types/global.d.ts
interface Window {
  __DEFAULT_COVER: string;
}

declare const modal: HTMLElement;
```

**Phase 3: 完全TypeScript移行（必要に応じて）**
- Hugo Pipesでのトランスパイル
- esbuildとの統合
- 型定義ファイルの整備

###### 推奨アプローチ
軽量性を重視し、**Phase 1（JSDoc）から開始**を推奨。
必要に応じてPhase 2への移行を検討。

#### 2.2 CSS設計改善

##### 2.2.1 BEM記法の統一

###### 現状の問題
- 命名規則が混在（`card-title`, `tl-year`, `site-header`）
- BEMの要素（__）やモディファイア（--）が未使用
- コンポーネント間での命名一貫性不足

###### 現在の命名パターン分析
```css
/* 現在: ハイフン区切り */
.card-title, .card-body, .card-cover
.site-header, .site-nav, .site-title
.tl-year, .tl-item, .tl-marker
.theme-toggle, .nav-toggle

/* 提案: BEM記法への統一 */
.card__title, .card__body, .card__cover
.card--featured, .card--small
.site-header__nav, .site-header__title
.timeline__year, .timeline__item, .timeline__marker
```

###### 実行する作業
1. **Block（ブロック）の定義**
   - `card`: 記事カードコンポーネント
   - `site-header`: サイトヘッダー
   - `timeline`: アーカイブページのタイムライン
   - `pagination`: ページネーション
   - `search-modal`: 検索モーダル

2. **Element（要素）の特定**
   - `card__cover`, `card__body`, `card__title`, `card__text`
   - `site-header__nav`, `site-header__logo`, `site-header__toggle`
   - `timeline__year`, `timeline__item`, `timeline__marker`

3. **Modifier（モディファイア）の追加**
   - `card--featured`: 注目記事
   - `card--small`: 小サイズカード
   - `timeline__item--current`: 現在の年
   - `search-modal--open`: モーダル開閉状態

###### 移行作業
1. HTMLテンプレートのclass属性更新
2. CSSセレクタの置換
3. JavaScriptでのクラス参照更新
4. 段階的リファクタリング（旧クラス併用期間設定）

###### 期待される効果
- コンポーネント構造の可視化
- CSS詳細度の問題解決
- 保守性・可読性の向上

##### 2.2.2 コンポーネント分割

###### 現状の課題
- 1855行のmain.cssに全スタイルが集約
- コンポーネント境界が不明確
- 部分的な変更時も全体再ビルド

###### 提案する分割構造
```
css/
├── core/
│   ├── variables.css      /* CSS変数 */
│   ├── reset.css          /* リセットCSS */
│   └── typography.css     /* フォント・テキスト */
├── layout/
│   ├── header.css         /* サイトヘッダー */
│   ├── footer.css         /* サイトフッター */
│   └── grid.css           /* レイアウトグリッド */
├── components/
│   ├── card.css           /* 記事カード */
│   ├── pagination.css     /* ページネーション */
│   ├── search-modal.css   /* 検索モーダル */
│   ├── timeline.css       /* タイムライン */
│   └── theme-toggle.css   /* テーマ切替 */
├── utilities/
│   ├── spacing.css        /* マージン・パディング */
│   └── visibility.css     /* 表示制御 */
└── themes/
    ├── light.css          /* ライトテーマ */
    └── dark.css           /* ダークテーマ */
```

###### 実行する作業
1. **現在のmain.cssをセクション別に分割**
2. **@importによる統合またはビルドツールでの結合**
3. **コンポーネントごとの依存関係整理**
4. **パフォーマンス影響の測定・最適化**

###### メリット
- 開発時の認知負荷軽減
- チーム開発での競合回避
- 使用していないコンポーネントの除外可能
- Hot Reloadの高速化

##### 2.2.3 Design Token導入

###### Design Tokenとは
デザインシステムの基本値（色、サイズ、間隔等）を統一形式で管理する仕組み

###### 現在の課題
- カラーパレットがCSS変数のみで管理
- サイズ・間隔の体系的な定義不足
- デザインとコードの同期が手動

###### 提案するToken構造
```json
{
  "color": {
    "base": {
      "white": "#ffffff",
      "gray-50": "#f8fafc",
      "gray-900": "#1f2937"
    },
    "semantic": {
      "primary": "{color.base.blue-600}",
      "success": "{color.base.green-600}",
      "danger": "{color.base.red-600}"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  },
  "typography": {
    "font-size": {
      "sm": "14px",
      "base": "16px",
      "lg": "18px"
    },
    "line-height": {
      "tight": "1.25",
      "normal": "1.5",
      "relaxed": "1.75"
    }
  }
}
```

###### 実行する作業
1. **現在のCSS変数をToken化**
2. **Style Dictionary等のツール導入**
3. **CSS変数・SASS変数・JSON形式での出力**
4. **デザインツール（Figma等）との連携**

###### 期待される効果
- デザインシステムの一元管理
- 複数プラットフォーム対応（Web/App）
- デザイナー・開発者間の同期向上

##### 2.2.4 CSS Modules検討

###### CSS Modulesとは
CSSクラス名をJavaScriptモジュールとしてimportし、一意性を保証する技術

###### 現在のHugoでの課題
- Hugoは静的サイトジェネレータでJavaScript bundlerなし
- CSS Modulesには通常WebpackやVite等が必要
- Goテンプレートとの統合が複雑

###### 検討する代替案

**1. CSS-in-JS風のScopedスタイル**
```html
<!-- Hugoテンプレート内でのscoped style -->
{{ $componentId := printf "card-%s" (.RelPermalink | md5) }}
<article class="card {{ $componentId }}">
<style>
.{{ $componentId }} .card__title { /* component-specific styles */ }
</style>
```

**2. Hugo Pipesでのビルド時処理**
```yaml
# hugo.yaml
build:
  buildStats:
    enable: true
  cacheDir: "cache"
```

**3. PostCSS統合での擬似CSS Modules**
- プリフィックス自動付与
- 未使用CSS削除
- クラス名の短縮化

###### 実行する作業
1. **現在のHugo Pipesでの実現可能性調査**
2. **PostCSS + Hugo統合の検証**
3. **パフォーマンス影響の測定**
4. **代替手法の効果検証**

###### 判断基準
- Hugo生態系との親和性
- ビルド時間への影響
- 開発体験の向上度
- 保守コストとのバランス

###### 結論
CSS Modulesの完全実装は困難だが、以下の部分的導入を推奨：
- BEM記法での擬似スコープ化
- Hugo Pipesでのプリフィックス自動付与
- コンポーネント単位でのCSS分割

#### 2.3 テスト環境構築

##### 2.3.1 単体テスト（Jest）

###### 実装内容
- **JavaScriptファイルのテスト**
  - `search.js` - 検索機能のロジック
  - `theme.js` - ダークモード切替機能  
  - `nav.js` - ナビゲーション動作
  - `lazy-load.js` - 画像遅延読み込み

###### テストファイル例
```javascript
// tests/search.test.js
describe('検索機能', () => {
  test('検索結果のフィルタリング', () => {
    const results = searchPosts('Hugo', mockPosts);
    expect(results).toHaveLength(3);
  });
  
  test('空文字での検索', () => {
    const results = searchPosts('', mockPosts);
    expect(results).toEqual(mockPosts);
  });
});

// tests/theme.test.js
describe('テーマ切替機能', () => {
  test('ダークモード切替', () => {
    const mockLocalStorage = {};
    global.localStorage = {
      setItem: (key, val) => mockLocalStorage[key] = val,
      getItem: (key) => mockLocalStorage[key]
    };
    
    toggleTheme();
    expect(document.body.classList.contains('theme-dark')).toBe(true);
  });
});
```

##### 2.3.2 E2Eテスト（Playwright）

###### 実装内容
- **ブラウザでの実際の操作テスト**
  - ページ遷移の確認
  - 検索モーダルの開閉
  - レスポンシブ表示
  - フォーム送信

###### テストファイル例
```javascript
// tests/e2e/navigation.spec.js
test('検索モーダルの動作', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="search-button"]');
  await expect(page.locator('.search-modal')).toBeVisible();
  
  // 検索実行
  await page.fill('[data-testid="search-input"]', 'Hugo');
  await expect(page.locator('.search-results li')).toHaveCount(3);
});

// tests/e2e/theme.spec.js
test('テーマ切替機能', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="theme-toggle"]');
  await expect(page.locator('body')).toHaveClass(/theme-dark/);
});

// tests/e2e/responsive.spec.js
test('レスポンシブデザイン', async ({ page }) => {
  await page.goto('/');
  
  // モバイル表示
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.nav-toggle')).toBeVisible();
  
  // デスクトップ表示
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.locator('.nav-toggle')).toBeHidden();
});
```

##### 2.3.3 アクセシビリティテスト

###### 実装内容
- **WCAG 2.1 AA準拠チェック**
  - カラーコントラスト比の自動測定
  - キーボードナビゲーション確認
  - スクリーンリーダー対応チェック
  - ARIA属性の妥当性

###### テストファイル例
```javascript
// tests/a11y/accessibility.spec.js
import { AxeBuilder } from '@axe-core/playwright';

test('ホームページのアクセシビリティ', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('キーボードナビゲーション', async ({ page }) => {
  await page.goto('/');
  
  // Tabキーでのフォーカス移動
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.locator('.logo')).toBeFocused();
});

// tests/a11y/contrast.spec.js
test('カラーコントラスト比チェック', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();
  
  expect(results.violations).toEqual([]);
});
```

##### 2.3.4 Visual Regression Testing

###### 実装内容
- **デザインの意図しない変更検出**
  - スクリーンショット比較
  - 複数ブラウザ・デバイスでの表示確認
  - CSS変更時の影響範囲チェック

###### テストファイル例
```javascript
// tests/visual/pages.spec.js
test('ホームページの見た目確認', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});

test('記事ページの見た目確認', async ({ page }) => {
  await page.goto('/posts/sample-post/');
  await expect(page).toHaveScreenshot('article-page.png');
});

// tests/visual/components.spec.js
test('カードコンポーネントの見た目確認', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.card').first()).toHaveScreenshot('card-component.png');
});

test('ダークモードの見た目確認', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="theme-toggle"]');
  await expect(page).toHaveScreenshot('homepage-dark.png');
});
```

##### 2.3.5 パフォーマンステスト

###### 実装内容
- **Core Web Vitals測定**
  - Lighthouse scoreの自動測定
  - LCP, FID, CLSの監視
  - 画像最適化の効果確認

###### テストファイル例
```javascript
// tests/performance/lighthouse.spec.js
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

test('Lighthouseスコア測定', async () => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'seo'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse('http://localhost:1313', options);
  await chrome.kill();
  
  const scores = runnerResult.lhr.categories;
  expect(scores.performance.score).toBeGreaterThan(0.9); // 90点以上
  expect(scores.accessibility.score).toBeGreaterThan(0.95); // 95点以上
  expect(scores.seo.score).toBeGreaterThan(0.9); // 90点以上
});
```

##### 2.3.6 Hugo固有のテスト

###### 実装内容
- **静的サイト生成のテスト**
  - `hugo build`の成功確認
  - 生成されたHTMLの妥当性
  - リンク切れチェック
  - サイトマップの正確性

###### テストファイル例
```javascript
// tests/hugo/build.spec.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

test('Hugo build成功確認', async () => {
  const { stdout, stderr } = await execAsync('hugo --environment=test');
  expect(stderr).toBe('');
  expect(fs.existsSync('./public/index.html')).toBe(true);
});

test('HTMLバリデーション', async () => {
  // HTMLファイルの妥当性をチェック
  const htmlFiles = ['public/index.html', 'public/posts/index.html'];
  
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatch(/<!DOCTYPE html>/);
    expect(content).toMatch(/<meta charset="utf-8">/);
    expect(content).toMatch(/<title>.+<\/title>/);
  }
});

// tests/hugo/links.spec.js
test('リンク切れチェック', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  
  // 内部リンクをすべて取得
  const links = await page.$$eval('a[href^="/"]', links => 
    links.map(link => link.href)
  );
  
  // 各リンクにアクセス
  for (const link of links) {
    const response = await page.goto(link);
    expect(response.status()).toBe(200);
  }
});
```

##### 2.3.7 テスト設定ファイル

###### Jest設定
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'themes/karuta/static/js/**/*.js',
    '!themes/karuta/static/js/**/*.min.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

###### Playwright設定
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:1313',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'hugo server --port=1313',
    port: 1313,
    reuseExistingServer: !process.env.CI
  }
};
```

###### package.jsonのテストスクリプト
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:a11y": "playwright test tests/a11y/",
    "test:visual": "playwright test tests/visual/",
    "test:all": "npm run test && npm run test:e2e",
    "hugo:test": "hugo server --environment=test --port=1313"
  }
}
```

###### CI/CD統合
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:coverage
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

###### 期待される効果
- コード変更時の品質保証
- リグレッション（機能退行）の防止  
- アクセシビリティ基準の自動チェック
- パフォーマンス劣化の早期発見
- チーム開発での品質統一

- [ ] 単体テスト（Jest）
- [ ] E2Eテスト（Playwright）
- [ ] アクセシビリティテスト
- [ ] Visual Regression Testing
- [ ] パフォーマンステスト
- [ ] Hugo固有のテスト

### 3. アクセシビリティ強化 ♿

#### 3.1 WCAG準拠性向上
- [ ] 全要素のcolor-contrast AA準拠チェック
- [ ] フォーカス管理の詳細実装
- [ ] ARIA属性の動的コンテンツ対応
- [ ] キーボードナビゲーション強化

#### 3.2 スクリーンリーダー対応
- [ ] 検索結果の読み上げ改善
- [ ] Live Regionの実装
- [ ] Skip Link機能拡張
- [ ] 多言語対応のaria-label

### 4. セキュリティ強化 🔒

#### 4.1 基本セキュリティ
- [ ] Content Security Policy (CSP) 実装
- [ ] XSS対策の強化
- [ ] CSRF対策
- [ ] セキュリティヘッダー設定

#### 4.2 依存関係管理
- [ ] 脆弱性スキャン自動化
- [ ] 依存関係の定期更新
- [ ] セキュリティ監査の実装
- [ ] SAST/DAST導入

### 5. SEO・構造化データ 📈

#### 5.1 構造化データ拡張

##### 5.1.1 JSON-LD形式での実装

###### 実装内容
- HTMLの`<head>`内に`<script type="application/ld+json">`タグでメタデータを追加
- サイト情報、記事情報、著者情報などを構造化して記述
- 検索エンジンがコンテンツを理解しやすくする

###### 実装する構造化データ
1. **WebSite スキーマ**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "WebSite",
     "name": "サイト名",
     "url": "https://example.com",
     "potentialAction": {
       "@type": "SearchAction",
       "target": "https://example.com/search?q={search_term_string}",
       "query-input": "required name=search_term_string"
     }
   }
   ```

2. **BlogPosting スキーマ**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "BlogPosting",
     "headline": "記事タイトル",
     "datePublished": "2024-01-01",
     "dateModified": "2024-01-01",
     "author": {
       "@type": "Person",
       "name": "著者名"
     },
     "publisher": {
       "@type": "Organization",
       "name": "サイト名"
     }
   }
   ```

3. **Organization スキーマ**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "name": "組織名",
     "url": "https://example.com",
     "logo": "https://example.com/logo.png"
   }
   ```

##### 5.1.2 リッチスニペット対応

###### 実装内容
- 検索結果に星評価、価格、画像などの追加情報を表示
- Article、BlogPosting、Review等のスキーマタイプを実装
- 検索結果でのクリック率向上を目指す

###### 対応するリッチスニペット
1. **記事（Article）**
   - タイトル、公開日、著者名
   - アイキャッチ画像
   - 記事の要約

2. **パンくずリスト（BreadcrumbList）**
   - ナビゲーション階層の表示
   - 検索結果での位置情報提供

3. **サイト内検索ボックス（SearchAction）**
   - Google検索結果にサイト内検索ボックス表示
   - 直接サイト内検索が可能

##### 5.1.3 パンくずリスト構造化

###### 実装内容
- サイトのナビゲーション階層を構造化データで定義
- `BreadcrumbList`スキーマを使用
- 検索結果にパンくずリストを表示させる

###### BreadcrumbList実装例
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
      "name": "カテゴリ名",
      "item": "https://example.com/category/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "記事タイトル"
    }
  ]
}
```

##### 5.1.4 FAQスキーマ対応

###### 実装内容
- よくある質問と回答をFAQPageスキーマで構造化
- 検索結果に質問と回答を直接表示
- 音声検索での回答候補になる可能性

###### FAQPage実装例
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Hugoテーマの使い方は？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "テーマのインストール方法と基本的な設定について説明します..."
      }
    },
    {
      "@type": "Question",
      "name": "カスタマイズ方法は？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "config.tomlファイルを編集してカスタマイズできます..."
      }
    }
  ]
}
```

###### 実装ファイル
- `layouts/partials/structured-data/website.html`
- `layouts/partials/structured-data/article.html`
- `layouts/partials/structured-data/breadcrumb.html`
- `layouts/partials/structured-data/faq.html`

###### 期待される効果
- SEO向上と検索結果での視認性向上
- リッチスニペットによるCTR改善
- 音声検索での回答候補となる可能性
- 検索エンジンによるコンテンツ理解の向上

- [ ] JSON-LD形式での実装
- [ ] リッチスニペット対応
- [ ] パンくずリスト構造化
- [ ] FAQスキーマ対応

#### 5.2 SEO最適化

##### 5.2.1 サイトマップ動的生成改善

###### 実装内容
- Hugoの`sitemap.xml`テンプレートをカスタマイズ
- 記事の更新頻度、優先度の設定
- 画像サイトマップの追加
- 多言語サイトマップの対応

###### 実装する機能
1. **カスタムサイトマップテンプレート**
   ```xml
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
           xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
     {{ range .Data.Pages }}
     <url>
       <loc>{{ .Permalink }}</loc>
       <lastmod>{{ .Lastmod.Format "2006-01-02T15:04:05-07:00" }}</lastmod>
       <changefreq>{{ .Params.changefreq | default "monthly" }}</changefreq>
       <priority>{{ .Params.priority | default 0.5 }}</priority>
       {{ if .Params.images }}
       {{ range .Params.images }}
       <image:image>
         <image:loc>{{ . | absURL }}</image:loc>
       </image:image>
       {{ end }}
       {{ end }}
     </url>
     {{ end }}
   </urlset>
   ```

2. **コンテンツタイプ別の優先度設定**
   - ホームページ: 1.0
   - 記事ページ: 0.8
   - カテゴリページ: 0.6
   - タグページ: 0.4
   - アーカイブページ: 0.3

3. **更新頻度の自動設定**
   - 最近更新されたページ: weekly
   - 1ヶ月以内: monthly
   - 1年以内: yearly
   - 1年以上: never

##### 5.2.2 メタデータの最適化

###### 実装内容
- タイトルタグの最適化（文字数制限、キーワード配置）
- メタディスクリプションの動的生成
- カノニカルURLの設定
- robots.txtの最適化

###### 実装する機能
1. **タイトルタグ最適化**
   ```html
   {{ $title := .Title }}
   {{ if .IsHome }}
     <title>{{ .Site.Title }} - {{ .Site.Params.description }}</title>
   {{ else if eq .Kind "taxonomy" }}
     <title>{{ $title }}の記事一覧 | {{ .Site.Title }}</title>
   {{ else }}
     {{ $title = printf "%s | %s" .Title .Site.Title }}
     {{ if gt (len $title) 60 }}
       {{ $title = printf "%s | %s" (.Title | truncate 50 "") .Site.Title }}
     {{ end }}
     <title>{{ $title }}</title>
   {{ end }}
   ```

2. **メタディスクリプション自動生成**
   ```html
   {{ $description := "" }}
   {{ if .Description }}
     {{ $description = .Description }}
   {{ else if .Summary }}
     {{ $description = .Summary | plainify | truncate 155 }}
   {{ else }}
     {{ $description = .Site.Params.description }}
   {{ end }}
   <meta name="description" content="{{ $description }}">
   ```

3. **カノニカルURL設定**
   ```html
   <link rel="canonical" href="{{ .Permalink }}">
   {{ if .Paginator }}
     {{ if .Paginator.HasPrev }}
       <link rel="prev" href="{{ .Paginator.Prev.URL | absURL }}">
     {{ end }}
     {{ if .Paginator.HasNext }}
       <link rel="next" href="{{ .Paginator.Next.URL | absURL }}">
     {{ end }}
   {{ end }}
   ```

4. **robots.txt最適化**
   ```
   User-agent: *
   Allow: /
   
   Disallow: /admin/
   Disallow: /private/
   Disallow: /search/
   Disallow: /*?*
   
   Sitemap: {{ .Site.BaseURL }}sitemap.xml
   ```

##### 5.2.3 Open Graph画像自動生成

###### 実装内容
- 記事タイトルから動的にOG画像を生成
- テンプレート化されたデザイン
- フォールバック画像の設定
- Twitter Cards対応

###### 実装する機能
1. **Hugo Image Processingによる動的画像生成**
   ```html
   {{ $ogImage := "" }}
   {{ if .Params.image }}
     {{ $ogImage = .Params.image }}
   {{ else if .Site.Params.defaultOGImage }}
     {{ $image := resources.Get .Site.Params.defaultOGImage }}
     {{ $ogImage = ($image.Fill "1200x630 Center").Permalink }}
   {{ else }}
     <!-- 動的OG画像生成のロジック -->
     {{ $ogImage = printf "/og-images/%s.png" (.Title | urlize) }}
   {{ end }}
   ```

2. **Open Graphメタタグ**
   ```html
   <meta property="og:title" content="{{ .Title }}">
   <meta property="og:description" content="{{ $description }}">
   <meta property="og:type" content="{{ if .IsPage }}article{{ else }}website{{ end }}">
   <meta property="og:url" content="{{ .Permalink }}">
   <meta property="og:image" content="{{ $ogImage | absURL }}">
   <meta property="og:image:width" content="1200">
   <meta property="og:image:height" content="630">
   <meta property="og:site_name" content="{{ .Site.Title }}">
   <meta property="og:locale" content="{{ .Site.Language.Lang | default "ja_JP" }}">
   ```

3. **Twitter Cards対応**
   ```html
   <meta name="twitter:card" content="summary_large_image">
   <meta name="twitter:title" content="{{ .Title }}">
   <meta name="twitter:description" content="{{ $description }}">
   <meta name="twitter:image" content="{{ $ogImage | absURL }}">
   {{ with .Site.Params.twitter }}
   <meta name="twitter:site" content="@{{ . }}">
   {{ end }}
   ```

4. **OG画像生成スクリプト（Node.js/Puppeteer）**
   ```javascript
   // scripts/generate-og-images.js
   const puppeteer = require('puppeteer');
   const fs = require('fs');
   
   async function generateOGImage(title, outputPath) {
     const browser = await puppeteer.launch();
     const page = await browser.newPage();
     
     await page.setViewport({ width: 1200, height: 630 });
     
     const html = `
       <div style="
         width: 1200px; 
         height: 630px; 
         background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
         display: flex;
         align-items: center;
         justify-content: center;
         font-family: 'Noto Sans JP', sans-serif;
         color: white;
         text-align: center;
         padding: 40px;
         box-sizing: border-box;
       ">
         <h1 style="font-size: 48px; margin: 0; line-height: 1.2;">
           ${title}
         </h1>
       </div>
     `;
     
     await page.setContent(html);
     await page.screenshot({ path: outputPath, fullPage: true });
     await browser.close();
   }
   ```

##### 5.2.4 Core Web Vitals改善

###### 実装内容
- LCP（Largest Contentful Paint）の最適化
- FID（First Input Delay）の改善
- CLS（Cumulative Layout Shift）の削減
- パフォーマンス測定の自動化

###### 実装する最適化
1. **LCP（Largest Contentful Paint）最適化**
   ```html
   <!-- 重要な画像のプリロード -->
   {{ with .Params.image }}
   <link rel="preload" as="image" href="{{ . | absURL }}">
   {{ end }}
   
   <!-- WebP画像の使用 -->
   {{ $image := resources.Get .Params.image }}
   {{ if $image }}
   <picture>
     <source srcset="{{ ($image.Resize "800x webp").RelPermalink }}" type="image/webp">
     <img src="{{ ($image.Resize "800x").RelPermalink }}" alt="{{ .Title }}" loading="lazy">
   </picture>
   {{ end }}
   ```

2. **FID（First Input Delay）改善**
   ```javascript
   // JavaScript最適化
   // 重いタスクの分割
   function processLargeTask(items) {
     const processItem = (index) => {
       if (index >= items.length) return;
       
       // アイテム処理
       processItemSync(items[index]);
       
       // 次のタスクを非同期で実行
       setTimeout(() => processItem(index + 1), 0);
     };
     
     processItem(0);
   }
   
   // イベントハンドラーの最適化
   document.addEventListener('click', (e) => {
     if (e.target.matches('.btn')) {
       // 軽量な処理のみ同期実行
       updateUI();
       
       // 重い処理は非同期実行
       setTimeout(() => heavyProcessing(), 0);
     }
   }, { passive: true });
   ```

3. **CLS（Cumulative Layout Shift）削減**
   ```css
   /* 画像のアスペクト比保持 */
   .card-image {
     aspect-ratio: 16 / 9;
     object-fit: cover;
   }
   
   /* フォント読み込み最適化 */
   @font-face {
     font-family: 'Noto Sans JP';
     font-display: swap;
     src: url('/fonts/noto-sans-jp.woff2') format('woff2');
   }
   
   /* レイアウトシフト防止 */
   .loading-placeholder {
     width: 100%;
     height: 200px;
     background: #f0f0f0;
     border-radius: 8px;
   }
   ```

4. **パフォーマンス測定自動化**
   ```javascript
   // scripts/performance-audit.js
   const lighthouse = require('lighthouse');
   const chromeLauncher = require('chrome-launcher');
   
   async function runAudit(url) {
     const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
     const options = {
       logLevel: 'info',
       output: 'json',
       onlyCategories: ['performance'],
       port: chrome.port,
     };
     
     const runnerResult = await lighthouse(url, options);
     await chrome.kill();
     
     const scores = runnerResult.lhr.categories.performance.score * 100;
     const metrics = runnerResult.lhr.audits;
     
     return {
       performance: scores,
       lcp: metrics['largest-contentful-paint'].displayValue,
       fid: metrics['max-potential-fid'].displayValue,
       cls: metrics['cumulative-layout-shift'].displayValue
     };
   }
   ```

###### 実装ファイル
- `layouts/partials/seo/sitemap.xml`
- `layouts/partials/seo/meta.html`
- `layouts/partials/seo/opengraph.html`
- `static/robots.txt`
- `scripts/generate-og-images.js`
- `scripts/performance-audit.js`

###### パフォーマンス目標
- Lighthouse Performance Score: 95+
- LCP: <2.5秒
- FID: <100ms
- CLS: <0.1

###### 期待される効果
- 検索エンジンランキングの向上
- ユーザー体験の改善
- ソーシャルメディアでの視認性向上
- モバイル検索での優位性確保

- [ ] サイトマップ動的生成改善
- [ ] メタデータの最適化
- [ ] Open Graph画像自動生成
- [ ] Core Web Vitals改善

### 6. コード品質・保守性 🧹

#### 6.1 コードクリーンアップ
- [ ] console.log削除（本番環境）
- [ ] マジックナンバーの定数化
- [ ] 大きな関数のリファクタリング
- [ ] エラーハンドリング強化

#### 6.2 ドキュメント整備
- [ ] コンポーネントドキュメント
- [ ] 設定ガイド詳細化
- [ ] カスタマイズガイド
- [ ] 貢献ガイドライン

## 実装優先度

### 🔴 高優先度（セキュリティ・基盤）
1. **CSP実装** - セキュリティ強化
2. ✅ **ESLint/Prettier設定** - 開発体験向上 **（完了）**
3. ✅ **CSS重複削除** - パフォーマンス改善 **（完了）**
4. **テスト環境構築** - 品質保証

### 🟡 中優先度（機能・UX改善）
5. ✅ **構造化データ実装（JSON-LD）** - SEO効果、リッチスニペット **（完了）**
6. **アクセシビリティ強化** - WCAG完全準拠
7. **JavaScript最適化** - パフォーマンス向上
8. **画像最適化** - 読み込み速度改善

### 🟢 低優先度（拡張・改善）
9. **TypeScript導入** - 型安全性
10. **多言語対応** - 国際化
11. **PWA機能** - オフライン対応
12. **ダークモード強化** - UI/UX向上

## 実装スケジュール

### Phase 1: 基盤整備（1-2週間）
- CSP実装
- ESLint/Prettier設定
- 基本テスト環境構築

### Phase 2: 最適化（2-3週間）
- CSS/JavaScript最適化
- アクセシビリティ強化
- SEO改善

### Phase 3: 拡張機能（3-4週間）
- 高度なテスト実装
- セキュリティ監査
- パフォーマンス最適化

### Phase 4: 完成・公開（1週間）
- ドキュメント整備
- 最終テスト
- リリース準備

## 成功指標

### パフォーマンス
- Lighthouse Score: 95+
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1

### アクセシビリティ
- WCAG 2.1 AA 100%準拠
- axe-core violations: 0
- キーボード操作100%対応

### SEO
- Core Web Vitals: すべてGreen
- 構造化データエラー: 0
- モバイルフレンドリー: 100%

### 開発体験
- ESLint errors: 0
- Test coverage: 80%+
- Build time: <30s