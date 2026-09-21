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
   Meteor StrikeR / special arrow visibility patch
   2026-09-22
   - lineH / lineV only
   - visual-only patch; game logic is untouched
   - remove this whole block to revert
   ========================================================= */
(function installArrowSpecialGlow(){
 const styleId="meteorStrikeRArrowGlowStyle";
 if(!document.getElementById(styleId)){
  const style=document.createElement("style");
  style.id=styleId;
  style.textContent=`
   .tile.msrArrowGlow{
    position:relative;
    z-index:3;
    animation:msrArrowPulse .72s ease-in-out infinite;
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
      brightness(1.08)
      saturate(1.10)
      drop-shadow(0 0 3px rgba(255,255,255,.35))
      drop-shadow(0 0 6px rgba(255,208,90,.30));
    }
    50%{
     filter:
      brightness(1.50)
      saturate(1.28)
      drop-shadow(0 0 6px rgba(255,255,255,.90))
      drop-shadow(0 0 13px rgba(255,196,64,.82))
      drop-shadow(0 0 20px rgba(255,116,48,.45));
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
   }
  `;
  document.head.appendChild(style);
 }

 function applyArrowGlow(){
  if(!boardEl || !Array.isArray(B))return;

  boardEl.querySelectorAll(".tile.msrArrowGlow").forEach(el=>{
   el.classList.remove("msrArrowGlow","msrArrowGlowH","msrArrowGlowV");
  });

  for(let r=0;r<ROWS;r++){
   for(let c=0;c<COLS;c++){
    const tile=B[r]?.[c];
    if(!tile || (tile.special!=="lineH" && tile.special!=="lineV"))continue;

    const el=boardEl.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
    if(!el)continue;

    el.classList.add("msrArrowGlow");
    el.classList.add(tile.special==="lineH" ? "msrArrowGlowH" : "msrArrowGlowV");
   }
  }
 }

 let queued=false;
 function scheduleArrowGlow(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
   queued=false;
   applyArrowGlow();
  });
 }

 if(boardEl){
  const observer=new MutationObserver(scheduleArrowGlow);
  observer.observe(boardEl,{
   childList:true,
   subtree:true,
   attributes:true,
   attributeFilter:["class","data-r","data-c"]
  });
 }

 window.__refreshArrowSpecialGlow=applyArrowGlow;
 scheduleArrowGlow();
})();

newBoard();
gameRunning=false;
updateTimer();
updateChain();
syncToggles();
updateMissionUI();
window.__monpatchGameReady=true;
