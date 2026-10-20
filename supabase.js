// HYMAVATHI: paste Project URL and anon/publishable key from Supabase > Project Settings > API
const sb=supabase.createClient("https://rdvaiottkdjrmdkckffs.supabase.co","sb_publishable_B889OaYA6QSJ7eqHgFfoMQ_UaNAXf4n");
const me=()=>JSON.parse(localStorage.getItem("user")||"{}");
const uid=async()=>(await sb.auth.getUser()).data.user?.id;
async function createEvent(name,lat,lng){const{data,error}=await sb.from("events").insert({name,lat,lng,owner:await uid()}).select().single();if(error)throw error;return data.id}
async function getEvents(){return(await sb.from("events").select("*")).data||[]}
async function getMyCheckins(){return(await sb.from("checkins").select("*").eq("uid",await uid())).data||[]}
async function getEventCheckins(eid){return(await sb.from("checkins").select("*").eq("event_id",eid)).data||[]}
function dist(a,b,c,d){const R=6371000,t=x=>x*Math.PI/180,h=Math.sin(t(c-a)/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(t(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(h))}

// NEW: an id that stays on this phone. The database allows only one volunteer per phone per event (see setup_device_lock.sql).
const deviceId=()=>{let d=localStorage.getItem("sevaDevice");if(!d){d=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():"d"+Date.now()+Math.random().toString(16).slice(2);localStorage.setItem("sevaDevice",d)}return d};

// After a valid QR scan. Row id = event+user, so duplicate check-ins are impossible.
// whenMs (optional): the time the volunteer really scanned. Offline scans pass it, so hours use scan time, not sync time.
async function scanEvent(eid,lat,lng,whenMs){
 const now=whenMs||Date.now();
 const{data:ev}=await sb.from("events").select("*").eq("id",eid).maybeSingle();
 if(!ev)throw new Error("Event not found");
 if(ev.lat&&dist(lat,lng,ev.lat,ev.lng)>200)throw new Error("You are too far from the event (200 m limit)");
 const u=await uid(),id=eid+"_"+u,{data:c}=await sb.from("checkins").select("*").eq("id",id).maybeSingle();
 if(!c){
  const row={id,event_id:eid,event_name:ev.name,uid:u,name:me().name,in_time:now,device_id:deviceId()};
  let{error}=await sb.from("checkins").insert(row);
  // If setup_device_lock.sql has not been run yet, the device_id column is missing: save without it so check-in still works
  if(error&&/could not find.*device_id/i.test(error.message)){delete row.device_id;({error}=await sb.from("checkins").insert(row))}
  if(error){
   if(/one_phone_per_event/.test(error.message))throw new Error("This phone already checked in another volunteer. Each volunteer must use their own phone.");
   if(error.code==="23505")throw new Error("Already checked in");
   throw error}
  return "in"}
 if(c.out_time)throw new Error("Already checked out");
 if(now<=c.in_time)throw new Error("Check-out time must be after check-in time");
 const{error:e2}=await sb.from("checkins").update({out_time:now,hours:+((now-c.in_time)/36e5).toFixed(2)}).eq("id",id);
 if(e2)throw e2;
 return "out"}