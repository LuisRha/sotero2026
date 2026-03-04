import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req,res){

  if(req.method === "GET"){

    const { data, error } = await supabase
    .from("configuracion")
    .select("*");

    if(error) return res.status(500).json({error:error.message});

    return res.status(200).json(data);

  }

  if(req.method === "PUT"){

    const { clave, valor } = req.body;

    const { error } = await supabase
    .from("configuracion")
    .update({valor})
    .eq("clave",clave);

    if(error) return res.status(500).json({error:error.message});

    return res.status(200).json({ok:true});

  }

}