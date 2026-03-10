import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {

  try {

    // Solo permitir GET
    if(req.method !== "GET"){
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { data, error } = await supabase
      .from("tickets")
      .select("numero, ganador, telefono, compra_id, created_at")
      .eq("premio", true)
      .eq("usado", true)
      .order("created_at", { ascending: false });

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