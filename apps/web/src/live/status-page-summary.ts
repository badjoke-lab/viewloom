import{absoluteTime,cadence,escapeHtml,field,label,plain,relativeTime,type StatusPayload}from'./status-page-model'
import{setStatusHtml}from'./status-page-setup'

export function renderStatusSummary(payload:StatusPayload,state:string,last:unknown,observed:unknown):void{
 const snapshot=field(payload.latestSnapshot,'bucketMinute')??field(payload.latestSnapshot,'collectedAt')
 const coverage=field(payload.coverage,'state')??field(payload.coverage,'mode')??payload.coverageMode??'unknown'
 setStatusHtml('[data-status-summary]',[
  card('Current state',label(state),stateNote(state)),
  card('Last success',relativeTime(last),absoluteTime(last)),
  card('Latest snapshot',relativeTime(snapshot),absoluteTime(snapshot)),
  card('Coverage',label(coverage),`${plain(observed)} observed`),
  card('Source mode',label(payload.sourceMode??payload.source),'Reported by the provider status API.'),
 ].join(''))
}
export function renderStatusBoard(payload:StatusPayload):void{
 const cells=document.querySelectorAll<HTMLElement>('.status-board strong')
 const values=[label(field(payload.collector,'state')??payload.state),relativeTime(field(payload.latestSnapshot,'bucketMinute')??field(payload.latestSnapshot,'collectedAt')),cadence(payload),label(field(payload.coverage,'mode')??field(payload.coverage,'state')??payload.coverageMode),plain(payload.storage?.database??payload.storage?.binding)]
 cells.forEach((cell,index)=>cell.textContent=values[index]??'—')
}
export function renderStatusDetails(payload:StatusPayload):void{
 const collector=[['Collector state',label(field(payload.collector,'state')??payload.state)],['Last attempt',time(field(payload.collector,'lastAttemptAt'))],['Last success',time(field(payload.collector,'lastSuccessAt'))],['Last failure',time(field(payload.collector,'lastFailureAt'))],['Run cadence',cadence(payload)],['Last error',plain(field(payload.collector,'lastErrorMessage')??field(payload.collector,'reason')??payload.error?.message)]]
 const coverage=[['Snapshot',time(field(payload.latestSnapshot,'bucketMinute')??field(payload.latestSnapshot,'collectedAt'))],['Observed streams',plain(field(payload.latestSnapshot,'observedCount')??field(payload.latestSnapshot,'streamCount'))],['Total viewers',plain(field(payload.latestSnapshot,'totalViewers'))],['Coverage mode',label(field(payload.coverage,'mode')??payload.coverageMode)],['More available',plain(field(payload.latestSnapshot,'hasMore')??field(payload.coverage,'hasMore'))],['Storage',plain(payload.storage?.database??payload.storage?.binding)]]
 setStatusHtml('[data-status-collector]',rows(collector));setStatusHtml('[data-status-coverage]',rows(coverage))
}
function card(title:string,value:string,note:string):string{return`<article class="status-summary-card"><small>${escapeHtml(title)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`}
function rows(items:string[][]):string{return items.map(([key,value])=>`<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
function time(value:unknown):string{return value?`${relativeTime(value)} · ${absoluteTime(value)}`:'—'}
function stateNote(state:string):string{if(state==='fresh')return'Recent real data is available.';if(state==='partial')return'Real data is available within a bounded observed window.';if(state==='empty')return'The real pipeline returned no qualifying streams; this is not demo.';if(state.includes('stale'))return'Real data exists, but its freshness threshold was exceeded.';if(state==='demo')return'Fixture or fallback data; not live production observation.';return'The status API returned this operational state.'}
