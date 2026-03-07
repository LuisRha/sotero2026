import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {

  try {

    // =========================
    // OBTENER CONFIGURACIÓN
    // =========================
    if (req.method === "GET") {

      const { data, error } = await supabase
        .from("configuracion")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    // =========================
    // ACTUALIZAR CONFIGURACIÓN
    // =========================
    if (req.method === "PUT") {

      const { clave, valor } = req.body;

      if (!clave) {
        return res.status(400).json({ error: "La clave es obligatoria" });
      }

      const { error } = await supabase
        .from("configuracion")
        .upsert({ clave, valor }, { onConflict: "clave" });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    // =========================
    // MÉTODO NO PERMITIDO
    // =========================
    return res.status(405).json({ error: "Método no permitido" });

  } catch (err) {

    return res.status(500).json({
      error: "Error interno del servidor",
      detalle: err.message
    });

  }

}