"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_TRANSITIONS, ProposalStatus } from "@/lib/enums";

export async function changeStatus(formData: FormData) {
  const proposalId = String(formData.get("proposalId"));
  const toStatus = String(formData.get("toStatus")) as ProposalStatus;

  const user = await getCurrentUser();
  if (!user || user.userType !== "admin") {
    throw new Error("行政職員のみ操作できます");
  }

  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  const allowed = STATUS_TRANSITIONS[proposal.status as ProposalStatus];
  if (!allowed.includes(toStatus)) {
    throw new Error(`「${proposal.status}」から「${toStatus}」への変更は許可されていません`);
  }

  await prisma.proposal.update({ where: { id: proposalId }, data: { status: toStatus } });
  await prisma.statusHistory.create({
    data: {
      proposalId,
      fromStatus: proposal.status,
      toStatus,
      changedByUserId: user.id,
    },
  });

  revalidatePath(`/admin/${proposalId}`);
  revalidatePath("/admin");
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/admin/${proposalId}`);
}
