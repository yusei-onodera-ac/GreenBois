# 04. アーキテクチャ

## 技術スタック

| 領域 | 採用technology |
| --- | --- |
| フレームワーク | Next.js 16(App Router、Server Components + Server Actions) |
| 言語 | TypeScript |
| UI | React 19、Tailwind CSS v4 |
| DB / ORM | SQLite(ローカル開発) + Prisma 5。将来はPostgreSQL(+PostGIS)への切り替えを想定 |
| 地図 | MapLibre GL JS(ラスタタイル。OSM/GSI) |
| 認証 | 開発用スタブ(Cookieセッション)。本番はLINEログインを想定 |
| CSV/データ取り込み | `csv-parse`(東京都オープンデータの取り込みスクリプト用) |

## ディレクトリ構成(`app/src/`)

```
app/
  (citizen)/          都民向け画面。専用のheader/footer(layout.tsx)
    map/               ホーム(ヒーロー・統計・カルーセル・地図)
    proposals/         一覧・詳細・新規投稿
    mypage/
    dev-login/
  admin/               行政向け画面。都民向けとは別配色・別ヘッダー
    (protected)/       認証ガード付き(ダッシュボード・詳細)
    login/
components/            ページ間で共有するUIコンポーネント
lib/                   ドメインロジック・ユーティリティ
```

主要な`lib/`:

| ファイル | 役割 |
| --- | --- |
| `enums.ts` | カテゴリ・ステータス等のリテラル型・ラベル・配色の単一の出典 |
| `jurisdiction.ts` | 管轄自動判定(F9)のコアロジック |
| `geo.ts` | 距離計算(haversine)・折れ線最短距離・種別優先度つき近傍探索 |
| `scoring.ts` | 優先度スコア計算 |
| `auth.ts` | 開発用スタブ認証のセッション取得 |
| `mapStyle.ts` | 地図タイルのスタイル定義(関数形式) |
| `tokyoWards.ts` | 東京23区の概略座標+全国地方公共団体コード |
| `uploadPhoto.ts` | 写真アップロード(ローカル`public/uploads/`への保存) |

`app/prisma/ingest/`: 東京都オープンデータの取り込みスクリプト(`fetchParks.ts`、`seedAuthorities.ts`)。リクエスト処理には含めず、手動実行してDBにキャッシュする設計。

## ルーティング構成

Next.jsのroute groupsで、都民向け(`(citizen)`)と行政向け(`admin`)を分離。両者は見た目(配色・ヘッダー構成)を意図的に変えている:

- 都民向け: 白背景+明るい緑(`#2f8f39`系)のアクセント。実在の通報プラットフォーム「My City Report」(東京都建設局採用)を参考にした配色。
- 行政向け: slate/sky系の実務ツールらしい落ち着いたトーン(色数を増やさず、都民向けと同じ構造パターン(ユーティリティバー・ステータスバッジ等)だけを共有する)。

## デザインシステム

- 角丸は控えめ(`rounded-sm`中心)。デジタル庁デザインシステムやe-Govポータルの実際のCSS(角丸0〜4px、ボーダー中心でシャドウをほぼ使わない)を参考にしている。
- ステータス(`draft`〜`rejected`)は意味が伝わるセマンティックカラー(`globals.css`の`--color-status-*`)、カテゴリは全て同じ緑に統一し、区別はアイコン形状(`components/CategoryIcon.tsx`)で行う。
- 共有コンポーネント: `StatusBadge`(ステータス表示)、`StatusStepper`(進捗ステップ表示)、`DeterminationBadge`(管轄判定の信頼度表示)、`ProposalCard`(一覧/カルーセル共通カード)、`PhotoGallery`(写真ギャラリー)。

## 開発環境の起動

```bash
npm --prefix app run dev
```

初回セットアップ:

```bash
npm --prefix app install
npm --prefix app run db:seed
npm --prefix app run ingest:authorities
npm --prefix app run ingest:parks
```

`ingest:parks`は東京都オープンデータカタログ・GSI APIへの実際のHTTPリクエストを伴うため、完了まで数分かかる(`MAX_GEOCODE_PER_WARD`環境変数で1回あたりのジオコーディング件数上限を調整可能。デフォルト40。冪等なので複数回実行すれば続きから取り込める)。
