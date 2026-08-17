"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { determineJurisdiction } from "@/lib/jurisdiction";
import { recalculateScore } from "@/lib/scoring";
import { savePhotoUpload } from "@/lib/uploadPhoto";
import { LandType, ProposalCategory } from "@/lib/enums";

export async function createProposal(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/dev-login");
  }

  const category = String(formData.get("category")) as ProposalCategory;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const landType = String(formData.get("landType")) as LandType;

  if (!title || !description || Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("必須項目が入力されていません");
  }

  const signatureTarget = category === "private_greening" ? 300 : 50;

  const proposal = await prisma.proposal.create({
    data: {
      userId: user.id,
      category,
      title,
      description,
      lat,
      lng,
      landType,
      status: "collecting",
      signatureTarget,
    },
  });

  const jurisdiction = determineJurisdiction(landType);
  await prisma.jurisdiction.create({
    data: { proposalId: proposal.id, ...jurisdiction },
  });

  await prisma.statusHistory.create({
    data: { proposalId: proposal.id, toStatus: "collecting", changedByUserId: user.id },
  });

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const url = await savePhotoUpload(photo);
    if (url) {
      await prisma.attachment.create({
        data: { proposalId: proposal.id, type: "photo_before", url },
      });
    }
  }

  await recalculateScore(proposal.id);

  redirect(`/proposals/${proposal.id}`);
}
