// ANUSHKA: 3D tilt on cards (works on dynamically added cards too)
document.addEventListener("pointermove",e=>{
 const c=e.target.closest&&e.target.closest(".card");
 document.querySelectorAll(".card.t").forEach(x=>{if(x!==c){x.style.transform="";x.classList.remove("t")}});
 if(!c)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
 c.classList.add("t");c.style.transform="perspective(700px) rotateX("+(-y*9)+"deg) rotateY("+(x*9)+"deg) translateZ(8px)"});
