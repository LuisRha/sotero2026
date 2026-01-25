import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  try {
    // =========================
    // GET → LISTAR COMPRAS
    // =========================
    if (req.method === "GET") {
      const { sorteo_id, estados } = req.query;

      let query = supabase
        .from("compras")
        .select("*")
        .order("created_at", { ascending: false });

      if (sorteo_id) {
        query = query.eq("sorteo_id", sorteo_id);
      }

      if (estados) {
        const lista = estados.split(",");
        query = query.in("estado", lista);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    // =========================
    // POST → CREAR COMPRA
    // =========================
    if (req.method === "POST") {
      const {
        sorteo_id,
        nombre,
        whatsapp,
        cantidad,
        numeros,
        voucher,
        total
      } = req.body;

      if (
        !sorteo_id ||
        !nombre ||
        !whatsapp ||
        !cantidad ||
        !numeros ||
        !voucher ||
        !total
      ) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      const { error } = await supabase.from("compras").insert([
        {
          sorteo_id,
          nombre,
          whatsapp,
          cantidad,
          numeros,
          voucher,
          total,
          estado: "pendiente"
        }
      ]);

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
    return res.status(500).json({ error: err.message });
  }
}
