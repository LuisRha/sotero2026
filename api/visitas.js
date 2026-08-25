import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      // Obtener valor actual
      const { data } = await supabase
        .from("configuracion")
        .select("id, valor")
        .eq("clave", "visitas")
        .single();

      let visitas = data ? parseInt(data.valor || "0") : 0;
      visitas++;

      // Actualizar por id
      await supabase
        .from("configuracion")
        .update({ valor: String(visitas) })
        .eq("id", data.id);

      return res.status(200).json({ visitas });
    }

    if (req.method === "GET") {
      const { data } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("clave", "visitas")
        .single();

      const visitas = data ? parseInt(data.valor || "0") : 0;
      return res.status(200).json({ visitas });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
