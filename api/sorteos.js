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

      const { nombre, activo } = body;

      if (!nombre) {
        return res.status(400).json({ error:"Nombre requerido" });
      }

      const { error } = await supabase
        .from("sorteos")
        .insert([
          {
            nombre,
            estado: activo ? "activo" : "cerrado"
          }
        ]);

      if (error) {
        return res.status(500).json({ error:error.message });
      }

      return res.status(200).json({ ok:true });
    }


    // =========================
    // PUT → CERRAR / ACTIVAR
    // =========================
    if (req.method === "PUT") {

      const { id, estado } = body;

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