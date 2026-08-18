# GreenVoice TOKYO ドキュメント

東京都オープンデータ・ハッカソン提案事業「GreenVoice TOKYO」の要件定義・構想ドキュメント一式。原案PDF「新規行政サービス事業案『GreenVoice TOKYO』」を土台に、実装可能なレベルまで深化させたもの。

## 読む順番

1. [00-concept.md](./00-concept.md) — 構想サマリー（課題構造、三方よし、行政経営レベル、何が仮説で何が確認済みか）
2. [01-requirements.md](./01-requirements.md) — 要件定義（スコープ、ペルソナ、機能要件、非機能要件）
3. [02-data-model.md](./02-data-model.md) — データモデル（ER図）
4. [03-external-integration.md](./03-external-integration.md) — 外部データ・API連携方針（実データ/モックの判断）
5. [04-architecture.md](./04-architecture.md) — 技術アーキテクチャ（Next.js + TypeScript構成）
6. [05-roadmap.md](./05-roadmap.md) — ロードマップと各フェーズの完了条件
7. [presentation/GreenVoice_TOKYO.pptx](./presentation/GreenVoice_TOKYO.pptx) — 上記をまとめたプレゼン資料(pptx、全19枚)
8. [06-presentation-outline.md](./06-presentation-outline.md) — プレゼン資料のテキスト版アウトライン(バックアップ・他ツールでの再生成用)
9. [07-impact-and-policy.md](./07-impact-and-policy.md) — 期待される効果（都民の生活・行政双方へのメリット）と、行政制度への具体的な提言。外部エビデンス（学術研究・政府統計・先行事例）付き
10. [08-admin-data-flow.md](./08-admin-data-flow.md) — 行政向けページ（`/admin`）に実際どの情報が渡るかのフィールド単位の仕様

## 現在のステータス

- フェーズ：要件定義・構想深化（Phase 0）— 完了
- 次フェーズ：本ドキュメント群のレビュー後、Next.jsプロジェクトのスキャフォールディング（Phase 1実装）に着手予定

## 未解決の「要検証」事項の一覧

各ドキュメントに散在する要検証事項をここに集約する。実装着手前に解消・再確認すること。

- 「緑のオープンデータ」の実ダウンロードURL・ライセンス条件・更新頻度（[03](./03-external-integration.md)）
- 公園施設情報APIのカバー自治体一覧とAPIキー取得手順（[03](./03-external-integration.md)）
- 熱環境・表面温度データの機械可読な公開有無（[03](./03-external-integration.md)）
- e-Stat等の人口統計APIの利用規約・レート制限（[03](./03-external-integration.md)）
- LINEログインのデベロッパー登録・審査期間（[03](./03-external-integration.md)）
- ホスティング先の国内データ保存要件への適合（[04](./04-architecture.md)）
- PostGIS対応マネージドDBサービスの選定（[04](./04-architecture.md)）
