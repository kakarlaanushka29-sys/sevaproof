// VINAY: rotating QR. Token changes every 30 s, so a screenshot shared with a friend expires.
const STEP=30000;
const makeToken=eid=>eid+"|"+Math.floor(Date.now()/STEP);
function tokenValid(t){const[a,n]=String(t).split("|");return Math.abs(Math.floor(Date.now()/STEP)-Number(n))<=1?a:null}
function showQR(el,eid){el.innerHTML="";new QRCode(el,{text:makeToken(eid),width:220,height:220})}
function startRotating(el,eid){showQR(el,eid);return setInterval(()=>showQR(el,eid),STEP)}
