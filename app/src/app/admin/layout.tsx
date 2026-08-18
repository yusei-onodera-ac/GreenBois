// /admin 配下(ログイン画面・ダッシュボード双方)で共有する行政システム用の背景。
// 認証ガードとヘッダー/フッターは (protected) レイアウトの側で持つ
// (/admin/login をこのガードで包むと未ログイン時にリダイレクトループになるため)。
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">{children}</div>;
}
