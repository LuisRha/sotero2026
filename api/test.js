import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // prueba simple
    const { data, error } = await supabase
      .from("sorteos")
      .select("*")
      .limit(1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      ok: true,
      data
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
