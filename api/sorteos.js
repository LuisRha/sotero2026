export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    env: {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE
    }
  });
}
