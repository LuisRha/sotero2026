import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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
      console.error(error);
      return res.status(500).json({ error: "Error actualizando" });
    }

    return res.status(200).json({ ok: true });

  }catch(err){

    console.error(err);
    return res.status(500).json({ error: "Error interno" });

  }

}