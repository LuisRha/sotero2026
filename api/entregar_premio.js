import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res){

  if(req.method !== "POST"){
    return res.status(405).json({ error: "Método no permitido" });
  }

  try{

    const { numero } = req.body;

    if(!numero){
      return res.status(400).json({ error: "Número requerido" });
    }

    const { error } = await supabase
      .from("tickets")
      .update({ usado: true })
      .eq("numero", numero);

    if(error){
      console.error("ERROR SUPABASE:", error);
      return res.status(500).json({ error: "Error actualizando" });
    }

    return res.status(200).json({ ok: true });

  }catch(err){

    console.error("ERROR GENERAL:", err);
    return res.status(500).json({ error: "Error interno" });

  }

}