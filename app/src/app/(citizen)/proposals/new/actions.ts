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
  // F9本格版: LocationPicker.tsxのGSI逆ジオコーディングで自動取得される区名
  // (管轄自動判定の区フォールバックに使う。空文字なら未取得としてnull扱い)
  const wardRaw = String(formData.get("ward") ?? "").trim();
  const ward = wardRaw || null;
  // 都民が「この場所を公道として投稿する」を選んだ場合のみ"true"
  // (LocationPicker.tsx参照。区フォールバックで道路担当を選ぶためのヒント)。
  const isRoadFallback = formData.get("isRoadFallback") === "true";

  // 複数枚(最大5枚)対応。input側にmax指定は無いため、フォーム改ざん等での
  // 過剰送信に備えてサーバー側でも上限チェックする。
  const MAX_PHOTOS = 5;
  const photos = formData.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
  if (!title || !description || Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("必須項目が入力されていません");
  }
  if (photos.length === 0) {
    throw new Error("写真を1枚以上選択してください");
  }
  if (photos.length > MAX_PHOTOS) {
    throw new Error(`写真は${MAX_PHOTOS}枚までです`);
  }

  // 新規提案は公有地(公園等)限定。フォーム側でも私有地は選択できないが、
  // フォーム改ざん等での不正な送信を防ぐ防御的チェック。
  if (category === "private_greening" || landType === "private") {
    throw new Error("新規のご提案は公有地(公園等)のみ受け付けています");
  }

  const signatureTarget = 50;

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

  const jurisdiction = await determineJurisdiction({ lat, lng, landType, ward, roadHint: isRoadFallback });
  await prisma.jurisdiction.create({
    data: { proposalId: proposal.id, ...jurisdiction },
  });

  // 「将来、管轄先へ自動でメール送信したい」の土台。実送信(SMTP等)は行わず、
  // 「誰宛に何を送る予定か」の記録のみを作る(行政ダッシュボードに表示)。
  if (jurisdiction.authorityId) {
    await prisma.notificationLog.create({
      data: { proposalId: proposal.id, authorityId: jurisdiction.authorityId, channel: "email", status: "planned" },
    });
  }

  await prisma.statusHistory.create({
    data: { proposalId: proposal.id, toStatus: "collecting", changedByUserId: user.id },
  });

  for (const photo of photos) {
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
