import '../status-page.css'
import{field,label,plain,relativeTime,sanitizePayload,tone,type StatusPayload}from'./status-page-model'
import{renderStatusFeatures,renderStatusLimitations}from'./status-page-features'
import{prepareStatusPage,setStatusText}from'./status-page-setup'
import{renderStatusBoard,renderStatusDetails,renderStatusSummary}from'./status-page-summary'
prepareStatusPage()
document.querySelector('[data-status-refresh]')?.addEventListener('click',()=>location.reload())
window.addEventListener('viewloom:status',(event)=>render((event as CustomEvent<StatusPayload>).detail))
function render(payload:StatusPayload){const state=payload.state??payload.sourceMode??'unknown';const last=field(payload.freshness,'lastSuccessAt')??field(payload.latestSnapshot,'collectedAt')??field(payload.latestSnapshot,'bucketMinute');const observed=field(payload.latestSnapshot,'observedCount')??field(payload.latestSnapshot,'streamCount')??field(payload.coverage,'observedCount');const pill=document.querySelector<HTMLElement>('[data-status-pill]');if(pill){pill.textContent=label(state);pill.dataset.tone=tone(state)}setStatusText('[data-status-feedback]',`Status generated ${relativeTime(payload.generatedAt)} · ${plain(payload.platform)}`);renderStatusSummary(payload,state,last,observed);renderStatusBoard(payload);renderStatusDetails(payload);renderStatusFeatures(payload);renderStatusLimitations(payload);setStatusText('[data-status-debug]',sanitizePayload(payload))}
