import { createClient } from "@supabase/supabase-js";

// Inicialización del cliente
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // ¡OJO! No uses esto en el cliente, solo en API Routes
);

export default async function handler(req, res) {
  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    // =========================
    // GET → LISTAR SORTEOS CON PROGRESO
    // =========================
    if (req.method === "GET") {
      // Modificamos el select para que traiga el conteo de tickets automáticamente
      // Esto hará que tu barra de progreso funcione de inmediato
      const { data, error } = await supabase
        .from("sorteos")
        .select(`
          *,
          tickets:tickets(count)
        `)
        .order("id", { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Procesamos la data para que el frontend reciba un porcentaje limpio
      const sorteosConProgreso = data.map(sorteo => {
        const vendidos = sorteo.tickets?.[0]?.count || 0;
        const porcentaje = sorteo.total_numeros > 0 
          ? (vendidos / sorteo.total_numeros) * 100 
          : 0;
        
        return {
          ...sorteo,
          vendidos,
          porcentaje: Math.min(porcentaje, 100).toFixed(2)
        };
      });

      return res.status(200).json(sorteosConProgreso);
    }

    // =========================
    // POST → CREAR SORTEO
    // =========================
    if (req.method === "POST") {
      const { nombre, premio, imagen, precio_ticket, total_numeros, activo } = body;

      if (!nombre || !total_numeros) {
        return res.status(400).json({ error: "Nombre y total de números son requeridos" });
      }

      // Si el nuevo sorteo es "activo", cerramos los demás primero
      if (activo) {
        await supabase
          .from("sorteos")
          .update({ estado: "cerrado" })
          .neq("id", 0); // Truco para actualizar todas las filas
      }

      const { error } = await supabase.from("sorteos").insert([
        {
          nombre,
          premio,
          imagen,
          precio_ticket,
          total_numeros,
          estado: activo ? "activo" : "cerrado",
        },
      ]);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // =========================
    // PUT → ACTUALIZAR ESTADO
    // =========================
    if (req.method === "PUT") {
      const { id, estado } = body;

      if (!id) return res.status(400).json({ error: "ID requerido" });

      if (estado === "activo") {
        // Garantizamos que solo haya uno activo a la vez
        await supabase
          .from("sorteos")
          .update({ estado: "cerrado" })
          .neq("id", id); 
      }

      const { error } = await supabase
        .from("sorteos")
        .update({ estado })
        .eq("id", id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // =========================
    // DELETE → ELIMINAR
    // =========================
    if (req.method === "DELETE") {
      const { id } = body;
      if (!id) return res.status(400).json({ error: "ID requerido" });

      const { error } = await supabase.from("sorteos").delete().eq("id", id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}