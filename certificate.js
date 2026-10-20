// SOWMYA: PDF certificate with a QR that opens verify.html
const PUBLIC_URL="https://friendly-arithmetic-29b6c4.netlify.app/"; // change this if your Netlify link changes
async function makeCertificate(id){
 const{data:d}=await sb.from("checkins").select("*").eq("id",id).single();
 const hash=await certHash(d);const url=PUBLIC_URL+"verify.html?id="+id+"&h="+hash; // always the public link, so phones can open it
 const pdf=new window.jspdf.jsPDF({orientation:"landscape"});
 pdf.setFontSize(26);pdf.text("Certificate of Volunteer Service",148,45,{align:"center"});
 pdf.setFontSize(16);pdf.text(d.name+" volunteered "+d.hours+" hours at "+d.event_name,148,90,{align:"center"});
 const t=document.createElement("div");new QRCode(t,{text:url,width:120,height:120});
 await new Promise(r=>setTimeout(r,400));
 pdf.addImage(t.querySelector("canvas").toDataURL(),"PNG",128,115,40,40);
 pdf.setFontSize(9);pdf.text("Scan to verify. Fingerprint: "+hash+"   ID: "+id,148,165,{align:"center"});pdf.save("certificate.pdf")}
