import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {

  try {

    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    // =========================
    // GET → LISTAR SORTEOS
    // =========================
    if (req.method === "GET") {

      const { data, error } = await supabase
        .from("sorteos")
        .select("*")
        .order("id", { ascending:false });

      if (error) {
        return res.status(500).json({ error:error.message });
      }

      return res.status(200).json(data);
    }

    // =========================
    // POST → CREAR SORTEO
    // =========================
    if (req.method === "POST") {

      const { 
        nombre,
        premio,
        imagen,
        precio_ticket,
        total_numeros,
        activo
      } = body;

      if (!nombre) {
        return res.status(400).json({ error:"Nombre requerido" });
      }

      // si el nuevo sorteo será activo
      if (activo) {

        // cerrar todos los demás
        await supabase
          .from("sorteos")
          .update({ estado:"cerrado" })
          .neq("id",0);

      }

      const { error } = await supabase
        .from("sorteos")
        .insert([{

          nombre,
          premio,
          imagen,
          precio_ticket,
          total_numeros,
          estado: activo ? "activo" : "cerrado"

        }]);

      if (error) {
        return res.status(500).json({ error:error.message });
      }

      return res.status(200).json({ ok:true });
    }

    // =========================
    // PUT → ACTIVAR / CERRAR
    // =========================
    if (req.method === "PUT") {

      const { id, estado } = body;

      if (!id) {
        return res.status(400).json({ error:"ID requerido" });
      }

      // si se activa un sorteo
      if (estado === "activo") {

        // cerrar todos
        await supabase
          .from("sorteos")
          .update({ estado:"cerrado" })
          .neq("id",0);

      }

      const { error } = await supabase
        .from("sorteos")
        .update({ estado })
        .eq("id", id);

      if (error) {
        return res.status(500).json({ error:error.message });
      }

      return res.status(200).json({ ok:true });
    }

    // =========================
    // DELETE → ELIMINAR
    // =========================
    if (req.method === "DELETE") {

      const { id } = body;

      if (!id) {
        return res.status(400).json({ error:"ID requerido" });
      }

      const { error } = await supabase
        .from("sorteos")
        .delete()
        .eq("id", id);

      if (error) {
        return res.status(500).json({ error:error.message });
      }

      return res.status(200).json({ ok:true });
    }

    return res.status(405).json({ error:"Método no permitido" });

  } catch(err) {

    return res.status(500).json({ error:err.message });

  }

}