import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// 開発用の認証スタブ。
// 本番相当はLINEログイン(OAuth)を想定(docs/03-external-integration.md)だが、
// ローカル開発フェーズでは Cookie にユーザーIDを保存する簡易ログインで代替する。
const COOKIE_NAME = "gv_user_id";

// admin/layout.tsx と admin/page.tsx など、1リクエスト内で複数箇所から
// 呼ばれることがあるため cache() でラップし、DBクエリの重複実行を防ぐ。
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminRole: true },
  });
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("ログインが必要です");
  }
  return user;
}

export { COOKIE_NAME };
