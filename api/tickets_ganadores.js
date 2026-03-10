import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {

  try {

    const { data, error } = await supabase
      .from("tickets")
      .select("numero, ganador, telefono")
      .eq("premio", true)
      .eq("usado", true);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);

  } catch (err) {

    res.status(500).json({
      error: "Error interno",
      detalle: err.message
    });

  }

}