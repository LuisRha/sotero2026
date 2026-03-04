const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

// Crear cliente de Supabase
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Esperar que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("btnLogin");

  if(btn){
    btn.addEventListener("click", login);
  }

});

async function login(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if(error){

    document.getElementById("msg").innerText = "Credenciales incorrectas";
    return;

  }

  // Login correcto
  window.location.href = "admin.html";

}