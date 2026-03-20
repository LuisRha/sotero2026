import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res){

  if(req.method !== "GET"){
    return res.status(405).json({ error: "Método no permitido" });
  }

  try{

    let { numero } = req.query;

    if(!numero){
      return res.status(400).json({ error: "Número requerido" });
    }

    numero = String(numero).padStart(5, "0");

    const { data, error } = await supabase
      .from("tickets")
      .select("usado")
      .eq("numero", numero)
      .single();

    if(error){
      return res.status(200).json({ usado: false });
    }

    return res.status(200).json(data);

  }catch(err){

    console.error(err);
    return res.status(500).json({ error: "Error interno" });

  }

}