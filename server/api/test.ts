// 简单的测试 API
export default function handler(req: any, res: any) {
  res.status(200).json({
    message: 'Hello from Vercel!',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.COZE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.COZE_SUPABASE_ANON_KEY,
    }
  });
}
