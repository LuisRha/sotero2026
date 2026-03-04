const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

const supabase = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

document.getElementById("btnLogin").addEventListener("click", login);

async function login(){

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

const { data, error } = await supabase.auth.signInWithPassword({
email: email,
password: password
});

if(error){

document.getElementById("msg").innerText = "Credenciales incorrectas";
return;

}

window.location.href = "admin.html";

}