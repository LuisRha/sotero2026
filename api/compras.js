import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// =========================
// MOTOR GENERADOR DE TICKETS
// =========================
function generarTickets(cantidad, numerosYaVendidos = []) {

  const vendidos = new Set(numerosYaVendidos);

  const principales = [];
  const extras = [];

  function generarNumero() {

    let num;

    do {

      num = Math.floor(Math.random() * 99999) + 1;
      num = num.toString().padStart(5, "0");

    } while (vendidos.has(num));

    vendidos.add(num);

    return num;
  }

  // generar números principales
  for (let i = 0; i < cantidad; i++) {
    principales.push(generarNumero());
  }

  // generar 4 extras
  for (let i = 0; i < 4; i++) {
    extras.push(generarNumero());
  }

  return {
    principales,
    extras
  };
}

export default async function handler(req, res) {
  try {

    // =========================
    // NORMALIZAR BODY
    // =========================
    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

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
        query = query.in("estado", estados.split(","));
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
        voucher,
        total
      } = body;

      if (
        !sorteo_id ||
        !nombre ||
        !whatsapp ||
        !cantidad ||
        !voucher ||
        !total
      ) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      // =========================
      // OBTENER NUMEROS YA VENDIDOS
      // =========================
      const { data: vendidosData } = await supabase
        .from("compras")
        .select("numeros, extras")
        .eq("sorteo_id", sorteo_id);

      let numerosVendidos = [];

      if (vendidosData) {

        vendidosData.forEach(c => {

          if (c.numeros) {
            // Limpiamos espacios por si acaso antes de hacer el split
            numerosVendidos.push(...c.numeros.replace(/\s/g, '').split(","));
          }

          if (c.extras) {
            numerosVendidos.push(...c.extras.replace(/\s/g, '').split(","));
          }

        });

      }

      // =========================
      // GENERAR TICKETS
      // =========================
      const tickets = generarTickets(Number(cantidad), numerosVendidos);

      const numeros = tickets.principales.join(",");
      const extras = tickets.extras.join(",");

      // =========================
      // INSERTAR COMPRA
      // =========================
      const { error } = await supabase.from("compras").insert([
        {
          sorteo_id,
          nombre,
          whatsapp,
          cantidad: Number(cantidad),
          numeros,
          extras,
          voucher,
          total: Number(total),
          estado: "pendiente"
        }
      ]);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    // =========================
    // PUT → APROBAR / RECHAZAR
    // =========================
    if (req.method === "PUT") {

      const { id, estado } = body;

      if (!id || !estado) {
        return res.status(400).json({ error: "ID o estado faltante" });
      }

      const { error } = await supabase
        .from("compras")
        .update({ estado })
        .eq("id", id);

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