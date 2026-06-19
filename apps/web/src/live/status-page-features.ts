import{escapeHtml,field,label,relativeTime,tone,type StatusFeature,type StatusPayload}from'./status-page-model'
import{setStatusHtml}from'./status-page-setup'

export function renderStatusFeatures(payload:StatusPayload):void{
 const list=Array.isArray(payload.features)?payload.features:[]
 if(!list.length){setStatusHtml('[data-status-features]','<tr><td colspan="6">No feature status rows are available.</td></tr>');setStatusHtml('[data-status-feature-cards]','<div class="notice">No feature status rows are available.</div>');return}
 setStatusHtml('[data-status-features]',list.map(tableRow).join(''))
 setStatusHtml('[data-status-feature-cards]',list.map(card).join(''))
}
export function renderStatusLimitations(payload:StatusPayload):void{
 const coverage=field(payload.coverage,'notes')
 const notes=[...(Array.isArray(coverage)?coverage:[]),...(payload.limitations??[]),...(payload.notes??[])].map(String)
 if(payload.error?.message)notes.unshift(payload.error.message)
 const unique=[...new Set(notes)]
 setStatusHtml('[data-status-limitations]',(unique.length?unique:['No additional limitations were returned.']).map(item=>`<li data-tone="${noteTone(item)}">${escapeHtml(item)}</li>`).join(''))
}
function tableRow(feature:StatusFeature):string{return`<tr><td><a class="text-link" href="${escapeHtml(feature.pagePath??'#')}">${escapeHtml(feature.label??'Feature')}</a></td><td>${escapeHtml(label(feature.role))}</td><td class="${stateClass(feature.state)}">${escapeHtml(label(feature.state))}</td><td>${escapeHtml(relativeTime(feature.lastUpdatedAt))}</td><td>${escapeHtml(label(feature.source))}</td><td>${escapeHtml(feature.knownGap??'—')}</td></tr>`}
function card(feature:StatusFeature):string{return`<article class="status-feature-card"><div class="status-feature-card__head"><a class="text-link" href="${escapeHtml(feature.pagePath??'#')}">${escapeHtml(feature.label??'Feature')}</a><strong class="${stateClass(feature.state)}">${escapeHtml(label(feature.state))}</strong></div><p>${escapeHtml(feature.knownGap??'—')}</p><small>${escapeHtml(relativeTime(feature.lastUpdatedAt))} · ${escapeHtml(label(feature.source))}</small></article>`}
function stateClass(value:unknown):string{return tone(value)==='good'?'up':tone(value)==='bad'?'down':'flat'}
function noteTone(note:string):string{const value=note.toLowerCase();if(value.includes('error')||value.includes('unavailable'))return'bad';if(value.includes('bounded')||value.includes('partial')||value.includes('fixture')||value.includes('not provider-wide'))return'warn';return'flat'}
