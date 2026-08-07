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
| `/map` | 実現ショーケース・提案マップ・一覧(並び替え対応) | F1, F11, F12 |
| `/proposals/new` | 提案投稿フォーム(区選択・住所検索対応) | F2 |
| `/proposals/[id]` | 提案詳細・署名(公開画面。本名・スコアは非表示) | F3, F4 |
| `/mypage` | 自分の投稿・署名一覧 | F5 |
| `/admin` | 行政ダッシュボード(要`admin`ユーザーでログイン。本名・スコア表示) | F6, F8, F9 |
| `/admin/[id]` | 審査・ステータス変更 | F7 |

## 実装メモ・既知の制約(ローカル開発フェーズ)

- **DB**: ローカルはSQLite。本番は AWS RDS for PostgreSQL(+PostGIS)へ移行想定(`docs/04-architecture.md`)。
  SQLiteはenumを未サポートのため、列挙値は`src/lib/enums.ts`のString+リテラル型で管理。
- **認証**: LINEログインは未接続。`/dev-login`のCookieベーススタブで代替。
- **個人情報保護**: 本名(`User.displayName`)は行政ダッシュボードのみで表示。公開画面(提案詳細・進捗履歴等)
  には匿名ハンドル(`User.handle`、例: 都民-A1B2、`src/lib/handle.ts`)のみを表示する。
- **優先度スコア**: `/proposals/[id]`(公開画面)には表示せず、`/admin`配下でのみ表示(`src/lib/scoring.ts`)。
  署名達成度は実データだが、オープンデータスコアは土地区分・カテゴリに基づく仮の代理指標。
  東京都「緑のオープンデータ」実接続は未実装(TODO)。
- **地図タイル**: 国土地理院(GSI)標準地図タイルを使用(APIキー不要、`src/lib/mapStyle.ts`)。
  位置指定は地図クリック/ドラッグに加え、区セレクト・住所/キーワード検索(国土地理院 住所検索API)にも対応
  (`src/components/LocationPicker.tsx`)。
- **地図ピン**: MapLibreのネイティブクラスタリング(GeoJSON source + cluster)を使用し、ズームレベルに
  応じてピンが重ならないよう自動集約する(`src/components/ProposalMap.tsx`)。ピンの色はジャンル(カテゴリ)別。
- **管轄自動判定** (`src/lib/jurisdiction.ts`): GIS空間結合は未実装、投稿者の自己申告landTypeを
  そのまま採用する簡易版(`manual_review`)。
- **公開・AWSデプロイ**: 意図的に未着手(機能が固まった最後の段階で対応する方針)。

## 今後の段階(案)

1. 東京都オープンデータ(緑のGIS・公園施設API)との実接続
2. LINEログインの実装
3. 写真アップロード(現状は未実装。投稿にAttachmentモデルはあるが画面未接続)
4. AWSへのデプロイ構成検討
