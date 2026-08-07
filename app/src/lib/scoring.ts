import { prisma } from "@/lib/prisma";

// F8: 優先度スコアリング(簡易版)
//
// docs/02-data-model.md の SCORE.open_data_score は本来「緑被率・人口密度」等の
// 東京都オープンデータ(docs/03-external-integration.md)から算出する想定だが、
// ローカル開発フェーズでは実データ未接続のため、土地区分・カテゴリに基づく
// 簡易な代理指標で仮算出する(TODO: Phase1後半で東京都「緑のオープンデータ」/
// e-Stat人口統計との実連携に置き換える)。
function estimateOpenDataScore(params: { landType: string; category: string }): number {
  let score = 10; // ベーススコア
  if (params.landType === "public_ward" || params.landType === "public_metro") {
    score += 10; // 公有地は施工の速さの観点で加点
  }
  if (params.category === "private_greening") {
    score += 15; // 私有地緑化は面的インパクトが大きいため加点(要検証: 熱環境データ導入後に再調整)
  }
  return Math.min(score, 30);
}

export async function recalculateScore(proposalId: string) {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: { signatures: true },
  });

  const signatureRatio = Math.min(proposal.signatures.length / proposal.signatureTarget, 1);
  const signatureScore = signatureRatio * 70; // 署名達成度を重視(0〜70点)
  const openDataScore = estimateOpenDataScore({
    landType: proposal.landType,
    category: proposal.category,
  }); // 0〜30点
  const totalScore = signatureScore + openDataScore;

  return prisma.score.upsert({
    where: { proposalId },
    create: { proposalId, signatureScore, openDataScore, totalScore },
    update: { signatureScore, openDataScore, totalScore, calculatedAt: new Date() },
  });
}
