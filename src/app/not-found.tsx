import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-xl text-zinc-400 mb-6">페이지를 찾을 수 없습니다</h2>
        <p className="text-sm text-zinc-500 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-[#5E6AD2] text-white rounded-lg text-sm font-medium hover:bg-[#4F5ABF] transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
