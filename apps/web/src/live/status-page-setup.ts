export function prepareStatusPage():void{
 const main=document.querySelector<HTMLElement>('main');if(!main)return
 main.classList.add('status-page')
 const facts=main.querySelectorAll<HTMLElement>('.head-facts strong')
 ;['state','success','observed','source'].forEach((key,index)=>facts[index]?.setAttribute('data-status-fact',key))
 const hero=main.querySelector('.page-head>div')
 if(hero&&!main.querySelector('[data-status-refresh]'))hero.insertAdjacentHTML('beforeend','<div class="status-hero-actions"><span class="status-state-pill" data-status-pill data-tone="flat">Loading</span><button class="button button--paper" type="button" data-status-refresh>Refresh status</button></div>')
 const head=main.querySelector('.page-head')
 if(head&&!main.querySelector('[data-status-feedback]'))head.insertAdjacentHTML('afterend','<p class="status-feedback" data-status-feedback aria-live="polite">Loading status…</p><section class="status-summary-grid" data-status-summary></section>')
 const board=main.querySelector('.status-board')
 if(board&&!main.querySelector('[data-status-collector]'))board.insertAdjacentHTML('afterend','<div class="rule-title"><h2>Collector &amp; coverage</h2><span>Operational truth</span></div><section class="status-detail-grid"><article class="surface status-detail-card"><h3>Collector health</h3><dl data-status-collector></dl></article><article class="surface status-detail-card"><h3>Latest snapshot</h3><dl data-status-coverage></dl></article></section>')
 const table=main.querySelector('.metric-ledger');table?.classList.add('status-feature-table');table?.querySelector('tbody')?.setAttribute('data-status-features','')
 if(table&&!main.querySelector('[data-status-feature-cards]'))table.insertAdjacentHTML('afterend','<section class="status-feature-cards" data-status-feature-cards></section>')
 if(!main.querySelector('[data-status-limitations]'))main.insertAdjacentHTML('beforeend','<div class="rule-title"><h2>Known limitations</h2><span>Provider-specific</span></div><ul class="status-note-list" data-status-limitations></ul><details class="status-debug"><summary>Sanitized debug details</summary><pre data-status-debug>Loading…</pre></details>')
}
export function setStatusText(selector:string,value:string):void{const node=document.querySelector<HTMLElement>(selector);if(node)node.textContent=value}
export function setStatusHtml(selector:string,value:string):void{const node=document.querySelector<HTMLElement>(selector);if(node)node.innerHTML=value}
