# 08. 行政向けページの情報フロー仕様 — GreenVoice TOKYO

前提：[01-requirements.md](./01-requirements.md) の非機能要件「データ保護」を実装レベルまで具体化したもの。都民向け画面と行政向け画面（`/admin`, `/admin/[id]`）で、`Proposal`・`User` 等の各フィールドが実際に「どちらに・どの形で」渡るかを明示し、実装（Prismaクエリの `select` 句）がこの表と一致することを保証する。

## 1. 背景

これまで、都民向け画面と行政向け画面のデータの見え方の違いは、各ページが `include`（関連レコードの丸ごと取得）で取得したデータのうち「どのフィールドをJSXでレンダリングするか」という**ページごとの判断のみ**で担保されていた。`app/src/lib/auth.ts` の `getCurrentUser()` を含め、フィールド単位でのアクセス制御（`select` によるクエリレベルの絞り込み）は行われておらず、以下のギャップが実際に見つかっている。

- 行政向け詳細ページ（`/admin/[id]`）に**写真が一切表示されていなかった**（`attachments` をそもそもクエリしていない）。
- 都民向け詳細ページ（`/proposals/[id]`）が、画面には出さない署名者個人の `User` 行（本名を含む）をクエリに含めていた（レンダリングでは使われていない、未使用の過剰取得）。

本ドキュメントはこれらを是正した後の**あるべき状態**を定義する。

## 2. フィールド単位の情報フロー表

| データ項目 | 都民（`/proposals`, `/proposals/[id]`, `/map`） | 行政（`/admin`, `/admin/[id]`） | 実装上の担保方法 |
| --- | --- | --- | --- |
| 提案者の氏名（`User.displayName`） | 非表示 | 表示（本名） | `select` で都民向けクエリは `displayName` を取得しない |
| 提案者のハンドル（`User.handle`） | 表示（唯一の提案者表示） | 表示（本名と併記） | 双方が `select` で取得 |
| カテゴリ・タイトル・説明文 | 表示 | 表示 | 双方が `select` で取得 |
| 写真（`Attachment`） | 表示 | 表示 | 双方のクエリに `attachments: { take: 1 }` を含める |
| 優先度スコア（`Score`） | **非表示**（[01-requirements.md](./01-requirements.md) F8） | 表示（内訳含む） | 都民向けクエリは `score` を含めない |
| 管轄・所管（`Jurisdiction.authorityName`） | 表示 | 表示（判定方法も表示） | 双方が取得 |
| 署名数（集計） | 表示（件数のみ） | 表示（件数のみ） | `signatures` は `select: { id: true }` 等の件数計算に必要な最小限のみ。`user` リレーションは**双方とも取得しない** |
| 署名者個人の氏名・ハンドル | 非表示 | 非表示 | どちらのクエリも `signatures` に `include: { user: true }` を付けない |
| ステータス変更者（`StatusHistory.changedByUser`） | ハンドルのみ | 本名のみ | 都民向けは `select: { handle: true }`、行政向けは `select: { displayName: true }` |
| 緯度・経度 | 地図ピンの座標としてのみ使用（数値を画面に文字表示しない） | 数値をそのまま表示 | レンダリング側の方針（`toFixed(5)` 表示は行政向けのみ） |
| 緑地協定（`GreenAgreement`） | 非表示（現状どの都民向け画面でも使っていない） | 表示 | 行政向けクエリのみ `greenAgreement` を含める |
| 行政職員自身の情報（`displayName`, `AdminRole.jurisdictionScope`） | 該当なし | 表示（ヘッダー） | 行政職員本人の自己開示。`getCurrentUser()` の戻り値をそのまま使用 |

## 3. `getCurrentUser()` はフィールド制限をしない

`app/src/lib/auth.ts` の `getCurrentUser()` は `User` の全カラム（`lineUserId` を含む）を返す。これは意図的な設計であり、ログイン中の本人が自分の全情報にアクセスできること自体は問題ない。**アクセス制御の境界は、各ページ・各Server Actionが「他人のデータをクエリする際にどのフィールドを `select` するか」で引く**。この境界をコード上で強制するため、`/admin` 系・`/proposals` 系のクエリでは `include` ではなく `select` を用いて、上表と一致するフィールドのみを明示的に取得する（`app/src/app/admin/(protected)/page.tsx`、`app/src/app/admin/(protected)/[id]/page.tsx`、`app/src/app/(citizen)/proposals/[id]/page.tsx`、`app/src/app/(citizen)/proposals/page.tsx`）。

## 4. 今後フィールドを追加する際の運用ルール

新しいフィールド（`Proposal` や `User` への追加カラム、新しいリレーション）を都民向け・行政向けいずれかの画面に表示する際は、必ず本表を更新してから実装する。特に「本名 (`displayName`) を含むリレーションを `include`/`select` に追加する」変更は、都民向け画面のPRでは原則禁止とする。
