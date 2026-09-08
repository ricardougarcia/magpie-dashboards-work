export const BOARD_POSITION = "portfolio-board-position";

// Runs before the Board paints, including a full document return on browsers
// without BFCache. Only restores framing for the Project the visitor just left.
export const boardRestorationScript = `(function(){try{
  var from=sessionStorage.getItem('portfolio-return');
  sessionStorage.removeItem('portfolio-return');
  var saved=JSON.parse(sessionStorage.getItem('${BOARD_POSITION}')||'null');
  if(!from||!saved||saved.project!==from||!Number.isFinite(saved.y))return;
  var restore=function(){window.scrollTo({top:saved.y,behavior:'instant'});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else restore();
}catch(e){}})();`;
