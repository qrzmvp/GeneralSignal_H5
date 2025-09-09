'use client'

export default function DebugPage() {
  const isProd = process.env.NODE_ENV === 'production'
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto text-white space-y-6">
        <h1 className="text-3xl font-bold">� Debug</h1>
        {isProd ? (
          <div className="bg-yellow-100 text-yellow-800 p-6 rounded-lg">
            <p className="font-semibold mb-2">生产环境已禁用调试页</p>
            <p>该页面仅在本地开发环境使用，避免阻塞构建。请在本地运行开发服务器后再进行邮件配置与 Supabase 调试。</p>
          </div>
        ) : (
          <div className="bg-blue-100 text-blue-900 p-6 rounded-lg">
            <p className="font-semibold mb-2">开发环境</p>
            <p>请在本地继续使用此前的调试工具代码（已简化以确保线上构建通过）。</p>
          </div>
        )}
      </div>
    </div>
  )
}
