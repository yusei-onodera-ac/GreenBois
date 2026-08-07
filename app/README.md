# GreenVoice TOKYO — ローカル開発版

東京都知事杯オープンデータ・ハッカソン提案事業「GreenVoice TOKYO」のMVP実装。
構想・要件定義は [`../docs/`](../docs/README.md) を参照。

## セットアップ

```bash
npm install
npm run db:seed   # デモ用データを投入(初回のみ / prisma migrate dev は自動でSQLite DBを作成済み)
npm run dev
```

デフォルトでは `http://localhost:3000` で起動します(使用中の場合は空いているポートに自動で切り替わります)。
`.env` の `DATABASE_URL` はSQLite(`file:./dev.db`)です。

## ログイン(開発用スタブ)

本番はLINEログインを想定していますが(`docs/03-external-integration.md`)、ローカル開発中は
`/dev-login` からデモユーザー(都民2名・企業1名・行政職員1名)を選んでログインできます。

## 主な画面

| パス | 内容 | 要件定義との対応 |
| --- | --- | --- |
| `/map` | 提案マップ・一覧 | F1 |
| `/proposals/new` | 提案投稿フォーム | F2 |
| `/proposals/[id]` | 提案詳細・署名 | F3, F4 |
| `/mypage` | 自分の投稿・署名一覧 | F5 |
| `/admin` | 行政ダッシュボード(要`admin`ユーザーでログイン) | F6, F8, F9 |
| `/admin/[id]` | 審査・ステータス変更 | F7 |

## 実装メモ・既知の制約(ローカル開発フェーズ)

- **DB**: ローカルはSQLite。本番は AWS RDS for PostgreSQL(+PostGIS)へ移行想定(`docs/04-architecture.md`)。
  SQLiteはenumを未サポートのため、列挙値は`src/lib/enums.ts`のString+リテラル型で管理。
- **認証**: LINEログインは未接続。`/dev-login`のCookieベーススタブで代替。
- **地図タイル**: 外部タイルサーバーへの通信が不安定/ブロックされる環境でも確実に動くよう、外部通信不要の
  最小スタイル(背景色のみ、`src/lib/mapStyle.ts`)を使用。ピンの配置・クリック等の機能は影響を受けない。
  実際の地図画像(道路・地名等)を出すには、本番で国土地理院タイル等の実データソースへ差し替えが必要。
- **優先度スコアリング** (`src/lib/scoring.ts`): 署名達成度は実データだが、オープンデータスコアは
  土地区分・カテゴリに基づく仮の代理指標。東京都「緑のオープンデータ」実接続は未実装(TODO)。
- **管轄自動判定** (`src/lib/jurisdiction.ts`): GIS空間結合は未実装、投稿者の自己申告landTypeを
  そのまま採用する簡易版(`manual_review`)。
- **公開・AWSデプロイ**: 意図的に未着手(機能が固まった最後の段階で対応する方針)。

## 今後の段階(案)

1. 東京都オープンデータ(緑のGIS・公園施設API)との実接続
2. LINEログインの実装
3. 写真アップロード(現状は未実装。投稿にAttachmentモデルはあるが画面未接続)
4. AWSへのデプロイ構成検討
