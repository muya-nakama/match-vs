const rulesLinkBtn=document.getElementById("rulesLinkBtn");
const historyLinkBtn=document.getElementById("historyLinkBtn");
const rulesOverlay=document.getElementById("rulesOverlay");
const historyOverlay=document.getElementById("historyOverlay");

function openInfoOverlay(el){
 if(!el)return;
 playDecision();
 el.classList.add("show");
 el.setAttribute("aria-hidden","false");
}
function closeInfoOverlay(el){
 if(!el)return;
 playDecision();
 el.classList.remove("show");
 el.setAttribute("aria-hidden","true");
}
rulesLinkBtn?.addEventListener("click",()=>openInfoOverlay(rulesOverlay));
historyLinkBtn?.addEventListener("click",()=>openInfoOverlay(historyOverlay));
document.querySelectorAll("[data-close-info]").forEach(btn=>{
 btn.addEventListener("click",()=>closeInfoOverlay(btn.closest(".infoOverlay")));
});
document.querySelectorAll(".infoOverlay").forEach(overlay=>{
 overlay.addEventListener("click",e=>{
  if(e.target===overlay)closeInfoOverlay(overlay);
 });
});

const gameTitleBtn=document.getElementById("gameTitleBtn");
gameTitleBtn?.addEventListener("click",()=>{
 if(lock)return;
 playDecision();
 stopBgm();
 stopTimer();
 stopIdleWatch();
 resetMissionSuccess();
 testerMode=false;
 tutorialMode=false;
 document.getElementById("testerBadge")?.classList.remove("show");
 gameRunning=false;
 pendingFinish=false;
 selected=null;
 hintPair=null;
 resultScreen.classList.remove("show");
 titleScreen.classList.remove("hidden");
 setMsg("隣のブロックへスワイプ");
});


/* =========================================================
   Meteor StrikeR / special block ambient glow
   2026-09-22 / Ver.2.76
   - arrows: slow, restrained directional pulse
   - asteroid: magma cracks breathe without washing out the rock
   - black hole: soft violet rim pulse
   - visual-only; game logic is untouched
   ========================================================= */
(function installSpecialBlockGlow(){
 const styleId="meteorStrikeRSpecialGlowStyle";
 if(!document.getElementById(styleId)){
  const style=document.createElement("style");
  style.id=styleId;
  style.textContent=`
   .tile.msrArrowGlow{
    position:relative;
    z-index:3;
    animation:msrArrowPulse 1.8s ease-in-out infinite;
    will-change:filter;
   }

   .tile.msrArrowGlowH{
    box-shadow:
      -8px 0 12px rgba(255,235,170,.20),
       8px 0 12px rgba(255,235,170,.20);
   }

   .tile.msrArrowGlowV{
    box-shadow:
      0 -8px 12px rgba(255,235,170,.20),
      0  8px 12px rgba(255,235,170,.20);
   }

   @keyframes msrArrowPulse{
    0%,100%{
     filter:
      brightness(1.10)
      saturate(1.08)
      drop-shadow(0 0 3px rgba(255,255,255,.30))
      drop-shadow(0 0 6px rgba(255,208,90,.26));
    }
    50%{
     filter:
      brightness(1.28)
      saturate(1.18)
      drop-shadow(0 0 4px rgba(255,255,255,.58))
      drop-shadow(0 0 9px rgba(255,196,64,.52))
      drop-shadow(0 0 12px rgba(255,116,48,.25));
    }
   }

   .tile.msrAsteroidGlow,
   .tile.msrBlackHoleGlow{
    isolation:isolate;
    overflow:visible;
   }

   .tile.msrAsteroidGlow::before,
   .tile.msrBlackHoleGlow::before{
    content:"";
    position:absolute;
    inset:0;
    z-index:0;
    pointer-events:none;
    border-radius:50%;
    background-repeat:no-repeat;
    background-position:center;
    background-size:contain;
    mix-blend-mode:screen;
   }

   .tile.msrAsteroidGlow::before{
    background-image:url("assets/blocks/asteroid.png");
    animation:msrMagmaBreathe 2.8s ease-in-out infinite;
    animation-delay:var(--msr-glow-delay,0s);
    will-change:opacity,filter;
   }

   .tile.msrBlackHoleGlow::before{
    inset:-3%;
    background-image:url("assets/blocks/black-hole.png");
    animation:msrBlackHoleBreathe 3.4s ease-in-out infinite;
    animation-delay:var(--msr-glow-delay,0s);
    will-change:opacity,filter,transform;
   }

   @keyframes msrMagmaBreathe{
    0%,100%{
     opacity:.12;
     filter:saturate(1.55) contrast(1.18) brightness(.92) blur(.35px);
    }
    50%{
     opacity:.42;
     filter:saturate(2.10) contrast(1.32) brightness(1.12) blur(1.05px);
    }
   }

   @keyframes msrBlackHoleBreathe{
    0%,100%{
     opacity:.14;
     transform:scale(.99);
     filter:saturate(1.18) brightness(.94) blur(.45px)
      drop-shadow(0 0 3px rgba(108,74,255,.18));
    }
    50%{
     opacity:.38;
     transform:scale(1.035);
     filter:saturate(1.48) brightness(1.08) blur(1.25px)
      drop-shadow(0 0 7px rgba(125,82,255,.42))
      drop-shadow(0 0 11px rgba(220,82,255,.20));
    }
   }

   @media (prefers-reduced-motion: reduce){
    .tile.msrArrowGlow{
     animation:none;
     filter:
      brightness(1.30)
      saturate(1.18)
      drop-shadow(0 0 6px rgba(255,255,255,.70))
      drop-shadow(0 0 12px rgba(255,196,64,.65));
    }
    .tile.msrAsteroidGlow::before,
    .tile.msrBlackHoleGlow::before{
     animation:none;
     opacity:.22;
     transform:none;
    }
   }
  `;
  document.head.appendChild(style);
 }

 function applySpecialGlow(){
  if(!boardEl || !Array.isArray(B))return;

  boardEl.querySelectorAll(".tile.msrArrowGlow,.tile.msrAsteroidGlow,.tile.msrBlackHoleGlow").forEach(el=>{
   el.classList.remove("msrArrowGlow","msrArrowGlowH","msrArrowGlowV","msrAsteroidGlow","msrBlackHoleGlow");
   el.style.removeProperty("--msr-glow-delay");
  });

  for(let r=0;r<ROWS;r++){
   for(let c=0;c<COLS;c++){
    const tile=B[r]?.[c];
    if(!tile?.special)continue;

    const el=boardEl.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
    if(!el)continue;

    if(tile.special==="lineH" || tile.special==="lineV"){
     el.classList.add("msrArrowGlow");
     el.classList.add(tile.special==="lineH" ? "msrArrowGlowH" : "msrArrowGlowV");
    }else if(tile.special==="bomb"){
     el.classList.add("msrAsteroidGlow");
    }else if(tile.special==="flower"){
     el.classList.add("msrBlackHoleGlow");
    }else{
     continue;
    }
    el.style.setProperty("--msr-glow-delay",`${-((r*COLS+c)%7)*.19}s`);
   }
  }
 }

 let queued=false;
 function scheduleSpecialGlow(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
   queued=false;
   applySpecialGlow();
  });
 }

 if(boardEl){
  const observer=new MutationObserver(scheduleSpecialGlow);
  observer.observe(boardEl,{childList:true});
 }

 window.__refreshArrowSpecialGlow=applySpecialGlow;
 window.__refreshSpecialBlockGlow=applySpecialGlow;
 scheduleSpecialGlow();
})();

newBoard();
gameRunning=false;
updateTimer();
updateChain();
syncToggles();
updateMissionUI();
window.__monpatchGameReady=true;
