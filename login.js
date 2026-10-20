// ANUSHKA: login/signup (Supabase). Never stores null; login auto-creates a missing profile.
const msg=t=>document.getElementById("msg").textContent=t,val=i=>document.getElementById(i).value;
async function saveProfile(user){
 let{data:p}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(!p){p={id:user.id,name:val("name")||user.email.split("@")[0],role:val("role")};const r=await sb.from("profiles").insert(p);if(r.error)return msg(r.error.message)}
 localStorage.setItem("user",JSON.stringify(p));location=p.type?"dashboard.html":"profile.html"}
async function signup(){
 const{data,error}=await sb.auth.signUp({email:val("email"),password:val("pass")});
 if(error){if(/already/i.test(error.message))return login();return msg(error.message)}
 if(!data.session)return msg("Turn OFF 'Confirm email' in Supabase, then try Log in.");
 await saveProfile(data.user)}
async function login(){
 const{data,error}=await sb.auth.signInWithPassword({email:val("email"),password:val("pass")});
 if(error)return msg(error.message);await saveProfile(data.user)}
