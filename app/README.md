# GreenVoice TOKYO — ローカル開発版

東京都知事杯オープンデータ・ハッカソン提案事業「GreenVoice TOKYO」のMVP実装。
構想・要件定義・行政制度への提言は [`../docs/`](../docs/README.md) を参照（特に期待効果のエビデンスは [`../docs/07-impact-and-policy.md`](../docs/07-impact-and-policy.md)）。

## セットアップ

```bash
npm install
npm run db:seed   # デモ用データを投入(初回のみ / prisma migrate dev は自動でSQLite DBを作成済み)
npm run dev
```

デフォルトでは `http://localhost:3000` で起動します(使用中の場合は空いているポートに自動で切り替わります)。
`.env` の `DATABASE_URL` はSQLite(`file:./dev.db`)です。

`dev` スクリプトは `next dev --webpack` を指定しています(Turbopackではない)。この環境ではTurbopackのdev用子プロセス生成がWindows側の要因(アンチウイルス等)で失敗しやすいため、webpackモードを既定にしている。Turbopackを試す場合は `next dev --turbopack` を直接実行すること。

## ログイン(開発用スタブ)

本番はLINEログインを想定していますが(`docs/03-external-integration.md`)、ローカル開発中はデモユーザーでログインできます。このサービスは**都民のみ**が利用できる(私有地・企業敷地への行政補助金交付は法的に不可能なため、企業アカウントは設けない。`docs/07-impact-and-policy.md` 3.2/3.4節)。都民向けと行政職員向けでログイン画面が分かれている：

- `/dev-login` — 都民アカウントのみ選択可能(2名)。行政職員アカウントはここには表示されない。
- `/admin/login` — 行政職員アカウントのみ選択可能(1名)。都民向けヘッダーからのリンクはなく、URLを直接開く必要がある。

行政職員としてログインすると `/admin` 配下は都民向けとは別配色(スレート系)のヘッダー・ナビゲーションになる(`src/app/admin/(protected)/layout.tsx`)。都民向けの「+提案する」等の導線は行政側には一切表示しない。

## 主な画面

| パス | 内容 | 要件定義との対応 |
| --- | --- | --- |
| `/map` | 実現ショーケース・提案マップ・一覧(並び替え対応) | F1, F11, F12 |
| `/proposals/new` | 提案投稿フォーム(区市選択→施設名の予測変換で位置指定、写真必須) | F2 |
| `/proposals?status=completed` | 実現した提案の一覧(マップの「もっと見る」から遷移) | F11, F12 |
| `/proposals/[id]` | 提案詳細・署名(公開画面。本名・スコアは非表示) | F3, F4 |
| `/mypage` | 自分の投稿・署名一覧 | F5 |
| `/dev-login` | 都民ログイン(開発用スタブ) | — |
| `/admin/login` | 行政職員ログイン(開発用スタブ。都民向けとは別画面) | — |
| `/admin` | 行政ダッシュボード(要`admin`ユーザーでログイン。本名・スコア表示) | F6, F8, F9 |
| `/admin/[id]` | 審査・ステータス変更 | F7 |

## 実装メモ・既知の制約(ローカル開発フェーズ)

- **DB**: ローカルはSQLite。本番は AWS RDS for PostgreSQL(+PostGIS)へ移行想定(`docs/04-architecture.md`)。
  SQLiteはenumを未サポートのため、列挙値は`src/lib/enums.ts`のString+リテラル型で管理。
- **認証**: LINEログインは未接続。都民は`/dev-login`、行政職員は`/admin/login`のCookieベーススタブでそれぞれ代替(`src/lib/auth.ts`)。同一Cookie(`gv_user_id`)を使うが、双方向になりすませないよう互いのログインアクションで相手側ユーザー種別を拒否する防御的チェックを入れている。
- **個人情報保護**: 本名(`User.displayName`)は行政ダッシュボードのみで表示。公開画面(提案詳細・進捗履歴等)
  には匿名ハンドル(`User.handle`、例: 都民-A1B2、`src/lib/handle.ts`)のみを表示する。
- **優先度スコア**: `/proposals/[id]`(公開画面)には表示せず、`/admin`配下でのみ表示(`src/lib/scoring.ts`)。
  署名達成度は実データだが、オープンデータスコアは土地区分・カテゴリに基づく仮の代理指標。
  東京都「緑のオープンデータ」実接続は未実装(TODO)。
- **新規投稿の対象範囲**: 現在、新規提案は都・区市町村が管理する公有地(公園・図書館・道路等)に限定している(`prisma`の`PublicSite`モデル、`src/app/(citizen)/proposals/new/`)。私有地緑化(`private_greening`カテゴリ)は選択肢から除外しているが、既存の私有地データは行政ダッシュボード等に残している。再受付の方針は`docs/07-impact-and-policy.md` 3.4節を参照。
- **地図タイル**: 国土地理院(GSI)標準地図タイルを使用(APIキー不要、`src/lib/mapStyle.ts`)。
  位置指定は「区市選択→施設名の予測変換(datalist)」で公有地の施設・道路を選ぶ方式を基本とし、地図クリック/ドラッグでの微調整、住所/キーワード検索(国土地理院 住所検索API)にも対応する(`src/components/LocationPicker.tsx`)。位置を確定すると国土地理院の逆ジオコーディングAPIでピンの上に住所ラベルを表示する。
- **地図ピン**: MapLibreのネイティブクラスタリング(GeoJSON source + cluster)を使用し、ズームレベルに
  応じてピンが重ならないよう自動集約する(`src/components/ProposalMap.tsx`)。ピンの色はジャンル(カテゴリ)別。
- **管轄自動判定** (`src/lib/jurisdiction.ts`): GIS空間結合は未実装。新規投稿は選択した`PublicSite`から`land_type`(都立/区立)が自動決定されるため、実質的には「施設マスタからの自動決定」(`manual_review`扱いのまま)。
- **アイコン**: 絵文字は使用せず、`src/components/icons.tsx` のインラインSVGアイコン(モノライン)で統一している。カテゴリアイコンは `src/components/CategoryIcon.tsx` が単一の入り口。
- **公開・AWSデプロイ**: 意図的に未着手(機能が固まった最後の段階で対応する方針)。

## 今後の段階(案)

1. 東京都オープンデータ(緑のGIS・公園施設API)との実接続
2. LINEログインの実装
3. AWSへのデプロイ構成検討
4. 私有地緑化の再受付可否の判断(`docs/07-impact-and-policy.md` 3.4節)
