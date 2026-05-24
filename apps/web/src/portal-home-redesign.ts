if (document.body.dataset.page === 'portal') {
  document.querySelector('.page-main')?.insertAdjacentHTML(
    'beforeend',
    '<section class="support-strip"><div><h2>♡ Support ViewLoom</h2><p>Help keep this independent live data view online and improving.</p></div><a class="button button--support" href="/support/">Support</a></section>',
  )
}
