"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recalculateScore } from "@/lib/scoring";
import { STATUS_TRANSITIONS, ProposalStatus } from "@/lib/enums";

export async function signProposal(formData: FormData) {
  const proposalId = String(formData.get("proposalId"));
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/dev-login?next=/proposals/${proposalId}`);
  }

  const existing = await prisma.signature.findUnique({
    where: { proposalId_userId: { proposalId, userId: user.id } },
  });
  if (existing) {
    // 重複署名は無視(F4: 1提案1署名の重複防止)
    return;
  }

  await prisma.signature.create({ data: { proposalId, userId: user.id } });

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: { signatures: true },
  });

  const score = await recalculateScore(proposalId);

  // 署名数がしきい値に到達したら自動的に審査ステータスへ遷移
  const nextStatuses = STATUS_TRANSITIONS[proposal.status as ProposalStatus];
  if (
    proposal.status === "collecting" &&
    proposal.signatures.length + 1 >= proposal.signatureTarget &&
    nextStatuses.includes("screening")
  ) {
    await prisma.proposal.update({ where: { id: proposalId }, data: { status: "screening" } });
    await prisma.statusHistory.create({
      data: {
        proposalId,
        fromStatus: "collecting",
        toStatus: "screening",
        changedByUserId: user.id,
      },
    });
  }

  void score;
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/map");
}
