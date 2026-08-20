// /admin 配下(ログイン画面・ダッシュボード双方)で共有する背景。
// 都民向け((citizen)/layout.tsx)と同じforest/stoneトークンに統一している
// (以前は濃色slate系だったが、本文は元々forest/stoneで、ヘッダー/フッターだけ
// 濃色という継ぎ接ぎが視覚的な不統一の原因になっていたため)。
// 認証ガードとヘッダー/フッターは (protected) レイアウトの側で持つ
// (/admin/login をこのガードで包むと未ログイン時にリダイレクトループになるため)。
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col bg-stone-50 text-forest-950">{children}</div>;
}
