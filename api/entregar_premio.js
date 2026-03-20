import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res){

  if(req.method !== "POST"){
    return res.status(405).json({ error: "Método no permitido" });
  }

  try{

    let { numero } = req.body;

    if(!numero){
      return res.status(400).json({ error: "Número requerido" });
    }

    // 🔥 asegurar formato con ceros (ej: 05673)
    numero = String(numero).padStart(5, "0");

    const { data, error } = await supabase
      .from("tickets")
      .update({ usado: true })
      .eq("numero", numero)
      .select(); // 👈 importante para verificar si actualizó

    if(error){
      console.error("ERROR SUPABASE:", error);
      return res.status(500).json({ error: "Error en base de datos" });
    }

    // ⚠️ si no actualizó nada
    if(!data || data.length === 0){
      return res.status(404).json({ error: "Número no encontrado" });
    }

    return res.status(200).json({ ok: true, numero });

  }catch(err){

    console.error("ERROR GENERAL:", err);
    return res.status(500).json({ error: "Error interno" });

  }

}