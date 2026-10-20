// SHA-256 fingerprint of a certificate record. Same function issues and verifies, so any edit to hours/name/event changes it.
async function certHash(c){const s=[c.id,c.name,c.event_name,c.hours,c.out_time].join("|");
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("").slice(0,16).toUpperCase()}
