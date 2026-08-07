# 02. データモデル — GreenVoice TOKYO

前提：[01-requirements.md](./01-requirements.md) の機能要件（F1〜F10）を満たすためのデータ構造。実装時のDB選定は [04-architecture.md](./04-architecture.md) を参照。

## 1. ER図（概念モデル）

```mermaid
erDiagram
    USER ||--o{ PROPOSAL : "投稿する"
    USER ||--o{ SIGNATURE : "署名する"
    PROPOSAL ||--o{ SIGNATURE : "集める"
    PROPOSAL ||--o| JURISDICTION : "紐づく"
    PROPOSAL ||--o| SCORE : "算出される"
    PROPOSAL ||--o{ STATUS_HISTORY : "記録される"
    PROPOSAL ||--o{ ATTACHMENT : "添付される"
    PROPOSAL ||--o| BUDGET_ALLOCATION : "予算化される"
    PROPOSAL ||--o| GREEN_AGREEMENT : "私有地の場合、締結する"
    BUDGET_CYCLE ||--o{ BUDGET_ALLOCATION : "含む"
    USER ||--o| ADMIN_ROLE : "行政職員の場合、持つ"

    USER {
      string id PK
      string display_name
      string line_user_id "LINEログイン識別子（ハッシュ化）"
      string user_type "citizen | corporate | admin"
      datetime created_at
    }

    PROPOSAL {
      string id PK
      string user_id FK
      string category "bench | shade | planting | private_greening | other"
      string title
      text description
      float lat
      float lng
      string land_type "public_metro | public_ward | private | unknown"
      string status "draft | collecting | screening | adopted | in_progress | completed | rejected"
      int signature_target "必要署名数（案件規模で可変）"
      datetime created_at
    }

    SIGNATURE {
      string id PK
      string proposal_id FK
      string user_id FK
      datetime signed_at
    }

    JURISDICTION {
      string id PK
      string proposal_id FK
      string authority_name "所管部署（例: 建設局/環境局/区みどり公園課）"
      string determination_method "gis_auto | manual_review"
    }

    SCORE {
      string id PK
      string proposal_id FK
      float signature_score
      float open_data_score "緑被率・人口密度等から算出"
      float total_score
      datetime calculated_at
    }

    STATUS_HISTORY {
      string id PK
      string proposal_id FK
      string from_status
      string to_status
      string changed_by_user_id FK
      datetime changed_at
    }

    ATTACHMENT {
      string id PK
      string proposal_id FK
      string type "photo_before | photo_after"
      string url
    }

    BUDGET_CYCLE {
      string id PK
      string name "例: 2026年度第2四半期 参加型緑化予算枠"
      float total_amount
      date start_date
      date end_date
    }

    BUDGET_ALLOCATION {
      string id PK
      string proposal_id FK
      string budget_cycle_id FK
      float allocated_amount
      string decision_note
    }

    GREEN_AGREEMENT {
      string id PK
      string proposal_id FK
      int minimum_years "最低継続年数（原案では5年）"
      date agreed_at
      string report_status "定期報告の状況"
    }

    ADMIN_ROLE {
      string id PK
      string user_id FK
      string jurisdiction_scope "所管範囲"
      string role_level "reviewer | approver"
    }
```

## 2. 補足（設計上の判断根拠）

- **`PROPOSAL.land_type` を早期に持たせる理由**：原案の「①縦割り行政・管轄の壁」への対処として、GIS位置情報から公有地/私有地・所管を自動タグ付けする方針（[01-requirements.md](./01-requirements.md) F9）をデータ構造から担保する。
- **`SCORE` を `PROPOSAL` から分離した理由**：署名数は随時変動し、オープンデータ側の指標も更新され得るため、スコアは再計算可能な独立エンティティとして履歴管理できるようにする（原案の「②声の大きさによる偏り」への対処＝単純な署名数順ではなく複合指標にするため）。
- **`STATUS_HISTORY` を持つ理由**：原案の「公共デザインの視点：民主的統制」（判断根拠の透明化・異議申立て可能性）に対応するため、ステータス変更を誰が・いつ行ったかを追跡可能にする。
- **`GREEN_AGREEMENT` を独立エンティティにした理由**：原案の「③私有地緑化の権利と維持管理」対策（緑地協定の締結を助成要件化）をデータとして表現する。
- **`BUDGET_CYCLE` / `BUDGET_ALLOCATION` は実際の会計処理と分離**：[01-requirements.md](./01-requirements.md) のスコープ定義どおり、実予算執行（振込等）は対象外のため、あくまで「決定を記録する」台帳としてのみ扱う。

## 3. MVPで簡略化する点（要検証）

- `SCORE.open_data_score` の算出式は、実際に取得できたオープンデータ指標（[03-external-integration.md](./03-external-integration.md)）によって変わるため、MVP実装時に確定させる（現時点では緑被率・人口密度を仮の指標として想定）。
- `JURISDICTION.determination_method` は当面 `manual_review` を許容し、GIS自動判定（`gis_auto`）は対象エリアが確定してから有効化する。
