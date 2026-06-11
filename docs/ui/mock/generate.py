from pathlib import Path
from html import escape
ROOT=Path('/mnt/data/viewloom-redesign-mock')

NAV=[('Portal','/index.html'),('Twitch data','/twitch/index.html'),('Kick data','/kick/index.html'),('About','/about/index.html'),('Support','/support/index.html')]
FEATURES=[('Heatmap','heatmap'),('Day Flow','day-flow'),('Battle Lines','battle-lines'),('History','history'),('Status','status')]

def rel(depth): return '../'*depth

def header(depth,current=''):
    base=rel(depth)
    links=''.join(f'<a href="{base}{href.lstrip("/")}"'+(' aria-current="page"' if label==current else '')+f'>{label}</a>' for label,href in NAV)
    return f'''<header class="masthead"><div class="masthead__inner">
<a class="brand" href="{base}index.html"><span class="brand-mark">VL</span><span>ViewLoom<small>Live data observatory</small></span></a>
<nav class="global-nav">{links}</nav><div class="status-inline"><span class="dot"></span>Collectors healthy · 5m cadence</div>
<button class="mobile-menu mobile-only" data-mobile-menu aria-label="Open navigation">Menu</button>
</div></header>'''

def footer(depth):
    b=rel(depth)
    return f'''<footer class="footer"><div>ViewLoom · Independent, unofficial observation of public live-stream data.</div><nav><a href="{b}about/index.html">Method & limits</a><a href="{b}support/index.html">Support</a><a href="https://github.com/badjoke-lab/viewloom">GitHub</a></nav></footer>'''

def feature_tabs(depth,provider,active):
    b=rel(depth)
    items=[]
    for label,slug in FEATURES:
        href=f'{b}{provider}/{slug}/index.html'
        items.append(f'<a class="'+('active' if slug==active else '')+f'" href="{href}">{label}</a>')
    return '<nav class="feature-tabs">'+''.join(items)+'</nav>'

def data_strip(provider='Twitch',observed='287',updated='1m ago',coverage='Top 300',source='Real'):
    return f'''<div class="data-strip"><div class="data-strip__title">{provider} observation</div>
<div class="data-strip__cell"><small>Updated</small>{updated}</div><div class="data-strip__cell"><small>Observed</small>{observed} streams</div>
<div class="data-strip__cell"><small>Coverage</small>{coverage}</div><div class="data-strip__cell"><small>Source</small>{source}</div></div>'''

def page_head(kicker,title,lede,facts):
    fact_html=''.join(f'<div class="fact"><small>{escape(k)}</small><strong>{escape(v)}</strong></div>' for k,v in facts)
    return f'''<section class="page-head"><div><div class="kicker">{kicker}</div><h1>{title}</h1><p class="lede">{lede}</p></div><div class="head-facts">{fact_html}</div></section>'''

def write(path,html):
    p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(html,encoding='utf-8')

def doc(depth,title,body,current=''):
    b=rel(depth)
    provider = 'twitch' if current == 'Twitch data' else 'kick' if current == 'Kick data' else 'portal'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{title} — ViewLoom redesign mock</title><link rel="stylesheet" href="{b}assets/site.css"></head><body data-provider="{provider}"><div class="site-frame">{header(depth,current)}{body}{footer(depth)}</div><script src="{b}assets/site.js"></script></body></html>'''

def portal():
    body='''<main class="page">
<div class="breadcrumb">ViewLoom / Portal mock</div>
<section class="page-head"><div><div class="kicker">Live-stream data, separated by platform</div><h1>Observe the field.<br>Then follow the movement.</h1><p class="lede">A restrained observation interface for Twitch and Kick. No mixed totals, no simulated completeness, no marketing dashboard.</p></div><div class="head-facts"><div class="fact"><small>Cadence</small><strong>5 minutes</strong></div><div class="fact"><small>History</small><strong>180 days</strong></div><div class="fact"><small>Twitch set</small><strong>Top 300</strong></div><div class="fact"><small>Kick set</small><strong>Top 100</strong></div></div></section>
<div class="portal-grid">
<section class="portal-panel portal-panel--twitch"><div><div class="kicker">Twitch data</div><h2>Twitch</h2><p>Read the current field, the shape of a day, live rivalries, and observed history from the Twitch collector.</p></div><div><div class="portal-panel__stats"><div><small>Live now</small><strong>287</strong></div><div><small>Largest</small><strong>118.4K</strong></div><div><small>Updated</small><strong>1m ago</strong></div></div><p><a class="button" href="twitch/index.html">Open Twitch data</a></p></div></section>
<section class="portal-panel portal-panel--kick"><div><div class="kicker">Kick data</div><h2>Kick</h2><p>The same reading grammar, a separate collector, and provider-specific coverage notes.</p></div><div><div class="portal-panel__stats"><div><small>Live now</small><strong>83</strong></div><div><small>Largest</small><strong>42.7K</strong></div><div><small>Updated</small><strong>3m ago</strong></div></div><p><a class="button" href="kick/index.html">Open Kick data</a></p></div></section>
</div>
<div class="rule-title"><h2>Current observations</h2><span>Across both independent data views</span></div>
<div class="signal-list"><div class="signal"><time>12:40 UTC</time><strong>Twitch daily audience reached its current peak.</strong><span>1.86M observed</span></div><div class="signal"><time>12:25 UTC</time><strong>Kick’s leading pair changed positions twice in 30 minutes.</strong><span>Battle Lines</span></div><div class="signal"><time>11:55 UTC</time><strong>Both collectors reported complete scheduled runs.</strong><span>Status</span></div></div>
</main>'''
    write(Path('index.html'),doc(0,'Portal',body,'Portal'))

def provider_home(provider):
    twitch=provider=='twitch'; name='Twitch' if twitch else 'Kick'; depth=1
    accent='twitch' if twitch else 'kick'; observed='287' if twitch else '83'; biggest='118.4K' if twitch else '42.7K'; peak='1.86M' if twitch else '394K'
    body=f'''<main class="page"><div class="breadcrumb">ViewLoom / {name} data</div>
{page_head(f'{name.upper()} DATA',f'{name}, observed as a moving field.',f'Current live scale, daily audience terrain, rivalry movement, and historical trends. Each view answers a different question.', [('Live now',observed),('Largest stream',biggest),('Today peak',peak),('Updated','1m ago' if twitch else '3m ago')])}
{data_strip(name,observed,'1m ago' if twitch else '3m ago','Top 300' if twitch else 'Top 100')}
<div class="provider-overview"><section><div class="rule-title"><h2>Now</h2><span>Latest observed snapshot</span></div><div class="surface surface--dark"><div class="surface__head"><strong>Current field summary</strong><small>12:40 UTC</small></div><div class="surface__body"><svg viewBox="0 0 900 290" role="img" aria-label="Current field summary"><rect width="900" height="290" fill="#07101d"/><path d="M0 235 C90 210 110 205 190 190 S320 165 410 178 S540 135 630 145 S760 80 900 100" fill="none" stroke="#eef4ff" stroke-width="2"/><path d="M0 250 C100 244 180 235 250 230 S380 214 450 219 S570 188 650 197 S790 150 900 168" fill="none" stroke="{'#905aff' if twitch else '#22d378'}" stroke-width="5"/><text x="24" y="38" fill="#9fb0ca" font-family="monospace" font-size="12">OBSERVED LIVE AUDIENCE · LAST 90 MIN</text><text x="24" y="75" fill="#eef4ff" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="34">{peak}</text></svg></div></div></section>
<aside><div class="rule-title"><h2>What changed</h2><span>Latest signals</span></div><div class="signal-list"><div class="signal"><time>12:35</time><strong>New daily high</strong><span>+6.8%</span></div><div class="signal"><time>12:20</time><strong>Top pair narrowed</strong><span>4.2K gap</span></div><div class="signal"><time>11:55</time><strong>Fastest rise</strong><span>+18%</span></div><div class="signal"><time>11:40</time><strong>Collector complete</strong><span>{observed} live</span></div></div></aside></div>
<div class="rule-title"><h2>Read the data</h2><span>Four separate views</span></div>
<div class="feature-directory">
<a class="feature-item" href="heatmap/index.html"><span class="num">01 / NOW</span><h3>Heatmap</h3><p>Who is large, rising, or fading in the latest snapshot.</p></a>
<a class="feature-item" href="day-flow/index.html"><span class="num">02 / TODAY</span><h3>Day Flow</h3><p>How audience ownership and total volume moved through the day.</p></a>
<a class="feature-item" href="battle-lines/index.html"><span class="num">03 / RIVALRY</span><h3>Battle Lines</h3><p>Where two streams closed the gap, reversed, or broke away.</p></a>
<a class="feature-item" href="history/index.html"><span class="num">04 / TRENDS</span><h3>History</h3><p>What changed across the last 7 or 30 observed days.</p></a>
</div></main>'''
    write(Path(provider)/'index.html',doc(depth,f'{name} data',body,f'{name} data'))

def heatmap(provider):
    name='Twitch' if provider=='twitch' else 'Kick'; depth=2; obs='287' if provider=='twitch' else '83'
    tiles=[
('LumenArc','118.4K','+8.1%','a','grid-column:span 4;grid-row:span 4'),('northstar','91.2K','-2.4%','b','grid-column:span 3;grid-row:span 4'),('MikaLive','72.5K','+14.9%','a','grid-column:span 3;grid-row:span 3'),('Rook','49.8K','+0.6%','c','grid-column:span 2;grid-row:span 3'),('Hexa','36.1K','-5.2%','b','grid-column:span 3;grid-row:span 2'),('Vera','31.4K','+3.1%','a','grid-column:span 2;grid-row:span 2'),('Lowline','27.8K','0.0%','c','grid-column:span 2;grid-row:span 2'),('Kei','24.2K','+7.0%','a','grid-column:span 2;grid-row:span 2'),('Otter','19.9K','-1.3%','b','grid-column:span 1;grid-row:span 2'),('Nightbay','17.4K','+2.2%','d','grid-column:span 2;grid-row:span 2'),('Clarity','15.1K','+0.4%','c','grid-column:span 1;grid-row:span 2'),('Pax','12.7K','-4.8%','b','grid-column:span 2;grid-row:span 1'),('Mint','11.2K','+9.1%','a','grid-column:span 2;grid-row:span 1'),('Aster','9.8K','+1.8%','e','grid-column:span 1;grid-row:span 1'),('Nori','8.6K','-0.7%','c','grid-column:span 1;grid-row:span 1'),('Vale','7.2K','+4.0%','a','grid-column:span 1;grid-row:span 1')]
    tiles_html=''.join(f'<div class="tile {c}" style="{style}" data-name="{n}" data-viewers="{v}" data-momentum="{m}"><strong>{n}</strong><div><span>{v}</span><small>{m}</small></div></div>' for n,v,m,c,style in tiles)
    body=f'''<main class="page page--full"><div class="breadcrumb">ViewLoom / {name} data / Heatmap</div>{feature_tabs(depth,provider,'heatmap')}
{page_head(f'{name.upper()} DATA · NOW','Heatmap','Current viewer scale is area. Momentum is color. Select a tile to inspect one live stream without leaving the field.', [('Observed',f'{obs} live'),('View','Top 50'),('Cadence','5 minutes'),('State','Fresh')])}
{data_strip(name,obs,'1m ago' if provider=='twitch' else '3m ago','Top 300' if provider=='twitch' else 'Top 100')}
<div class="toolbar"><span class="toolbar-label">Field</span><div class="control-group" data-toggle-group><button class="active">Top 50</button><button>Top 20</button><button>Top 100</button></div><span class="toolbar-label">Camera</span><div class="control-group"><button data-zoom="out">−</button><button data-zoom="reset">Fit</button><button data-zoom="in">＋</button></div><button class="button button--quiet">Refresh</button></div>
<div class="layout-split"><section class="heatmap-wrap" aria-label="Heatmap mock"><div class="heatmap-grid">{tiles_html}</div></section><aside class="surface inspector"><div class="surface__head"><strong>Selected stream</strong><small>Live</small></div><div class="surface__body"><div class="kicker">{name} data</div><h2 data-selected-name>LumenArc</h2><div class="inspector__row"><div><small>Current viewers</small><strong data-selected-viewers>118.4K</strong></div><span class="up">Rank 1</span></div><div class="inspector__row"><div><small>Momentum · 15m</small><strong data-selected-momentum>+8.1%</strong></div><span class="up">Rising</span></div><div class="inspector__row"><div><small>Observed since</small><strong>09:10 UTC</strong></div><span>3h 30m</span></div><div class="inspector__row"><div><small>Latest peak</small><strong>121.2K</strong></div><span>12:35</span></div><p><a class="button" href="../battle-lines/index.html">Open in Battle Lines</a></p><p><a class="text-link" href="../history/index.html">Review observed history</a></p></div></aside></div>
<div class="notice" style="margin-top:14px">Observed public live data. Small tiles may be hidden by label thresholds; area remains proportional to the current observed viewer count.</div></main>'''
    write(Path(provider)/'heatmap/index.html',doc(depth,f'{name} Heatmap',body,f'{name} data'))

def dayflow_svg(provider):
    colors=['#223d50','#385d4e','#80653a','#744740','#514a72','#8a7f68']
    paths=["M0 420 C100 390 160 370 240 345 S400 300 520 315 S690 240 820 270 S980 205 1200 230 L1200 520 L0 520 Z",
"M0 380 C110 360 170 310 270 325 S440 270 560 285 S760 210 890 235 S1040 170 1200 190 L1200 230 C980 205 820 270 690 240 S520 315 400 300 S240 345 0 420 Z",
"M0 330 C120 310 180 280 300 295 S470 230 600 250 S760 170 920 200 S1080 145 1200 155 L1200 190 C1040 170 890 235 760 210 S560 285 440 270 S270 325 0 380 Z",
"M0 260 C100 250 210 220 320 245 S510 180 640 205 S810 135 950 160 S1080 110 1200 120 L1200 155 C1080 145 920 200 760 170 S600 250 470 230 S300 295 0 330 Z",
"M0 190 C130 180 240 150 360 175 S530 125 680 145 S870 95 1010 115 S1120 80 1200 90 L1200 120 C1080 110 950 160 810 135 S640 205 510 180 S320 245 0 260 Z"]
    grid=''.join(f'<line x1="{x}" y1="30" x2="{x}" y2="520"/>' for x in range(0,1201,100))+''.join(f'<line x1="0" y1="{y}" x2="1200" y2="{y}"/>' for y in range(70,521,75))
    area=''.join(f'<path d="{p}" fill="{colors[i]}" opacity="{.86-i*.05}"/>' for i,p in enumerate(paths))
    labels=''.join(f'<text class="chart-axis" x="{x}" y="545">{h:02d}:00</text>' for x,h in zip(range(0,1201,150),range(0,24,3)))
    return f'<svg viewBox="0 0 1200 570"><g class="chart-grid">{grid}</g>{area}<line x1="785" y1="30" x2="785" y2="520" stroke="#eef4ff" stroke-width="2"/><text x="795" y="52" class="chart-axis">15:42 selected</text>{labels}</svg>'

def dayflow(provider):
    name='Twitch' if provider=='twitch' else 'Kick'; depth=2; obs='287' if provider=='twitch' else '83'
    rows=[('LumenArc','48.2K','26.1%'),('northstar','41.8K','22.6%'),('MikaLive','29.5K','16.0%'),('Rook','18.2K','9.9%'),('Others','46.9K','25.4%')]
    rowhtml=''.join(f'<div class="focus-row"><span class="rank">{i}</span><strong>{n}</strong><div class="bar"><i style="width:{min(100,float(v[:-1]))}%"></i></div><span>{v}</span></div>' for i,(n,v,s) in enumerate(rows,1))
    body=f'''<main class="page page--full"><div class="breadcrumb">ViewLoom / {name} data / Day Flow</div>{feature_tabs(depth,provider,'day-flow')}
{page_head(f'{name.upper()} DATA · TODAY','Day Flow','A day is shown as terrain: total height is observed audience volume, each band is one stream’s share of that volume.', [('Date','Today'),('Metric','Volume'),('Scope','Full'),('Bucket','5 minutes')])}
{data_strip(name,obs,'1m ago' if provider=='twitch' else '3m ago','Top 300' if provider=='twitch' else 'Top 100')}
<div class="toolbar"><span class="toolbar-label">Date</span><div class="control-group" data-toggle-group><button class="active">Today</button><button>Yesterday</button><button>2026-06-08</button></div><span class="toolbar-label">Metric</span><div class="control-group" data-toggle-group><button class="active">Volume</button><button>Share</button></div><span class="toolbar-label">Scope</span><div class="control-group" data-toggle-group><button class="active">Full</button><button>Top Focus</button></div><span class="toolbar-label">Top</span><div class="control-group"><button>10</button><button class="active">20</button><button>50</button></div></div>
<div class="layout-split"><section><div class="dayflow-stage">{dayflow_svg(provider)}</div><input aria-label="Selected time" type="range" min="0" max="1440" value="942" style="width:100%;margin:12px 0"></section><aside class="surface inspector"><div class="surface__head"><strong>15:42 UTC</strong><small>Time focus</small></div><div class="surface__body"><div class="focus-table">{rowhtml}</div><div class="inspector__row"><div><small>Total observed</small><strong>184.6K</strong></div><span>+7.2% / 1h</span></div><div class="inspector__row"><div><small>Leader gap</small><strong>6.4K</strong></div><span>Narrowing</span></div><p><a class="button" href="../battle-lines/index.html">Compare top two</a></p></div></aside></div>
<div class="notice" style="margin-top:14px">Full includes the observed remainder as Others. Top Focus removes Others from the chart scale but does not erase it from coverage totals.</div></main>'''
    write(Path(provider)/'day-flow/index.html',doc(depth,f'{name} Day Flow',body,f'{name} data'))

def battle_svg(provider):
    grid=''.join(f'<line x1="{x}" y1="30" x2="{x}" y2="500"/>' for x in range(80,1160,120))+''.join(f'<line x1="80" y1="{y}" x2="1160" y2="{y}"/>' for y in range(70,501,70))
    return f'''<svg viewBox="0 0 1220 560"><g class="chart-grid">{grid}</g>
<path d="M80 430 C170 390 210 410 300 350 S450 330 520 270 S680 260 740 210 S900 195 980 130 S1080 110 1160 90" fill="none" stroke="#7dd3fc" stroke-width="5"/>
<path d="M80 360 C170 370 240 340 320 320 S460 250 540 285 S680 230 760 235 S900 170 980 175 S1080 150 1160 140" fill="none" stroke="#f472b6" stroke-width="5"/>
<path d="M80 470 C250 440 380 430 520 405 S760 385 920 350 S1060 330 1160 315" fill="none" stroke="#8d877b" stroke-width="2" opacity=".65"/>
<rect x="650" y="190" width="95" height="90" fill="#fbbf24" opacity=".13"/><line x1="702" y1="30" x2="702" y2="500" stroke="#eef4ff" stroke-width="2"/>
<circle cx="702" cy="236" r="7" fill="#7dd3fc"/><circle cx="702" cy="236" r="3" fill="#eef4ff"/><circle cx="702" cy="236" r="7" fill="#f472b6" opacity=".65"/>
<text class="chart-axis" x="715" y="52">15:35 reversal</text><text class="chart-axis" x="1060" y="80">LumenArc 118.4K</text><text class="chart-axis" x="1060" y="130">northstar 111.8K</text>
<text class="chart-axis" x="80" y="535">00:00</text><text class="chart-axis" x="350" y="535">06:00</text><text class="chart-axis" x="620" y="535">12:00</text><text class="chart-axis" x="890" y="535">18:00</text><text class="chart-axis" x="1120" y="535">Now</text></svg>'''

def battle(provider):
    name='Twitch' if provider=='twitch' else 'Kick'; depth=2; obs='287' if provider=='twitch' else '83'
    body=f'''<main class="page page--full"><div class="breadcrumb">ViewLoom / {name} data / Battle Lines</div>{feature_tabs(depth,provider,'battle-lines')}
{page_head(f'{name.upper()} DATA · RIVALRY','Battle Lines','A focused comparison of the closest observed streams: current gap, reversal points, and how pressure changed through the day.', [('Mode','Recommended'),('Metric','Viewers'),('Primary pair','2 streams'),('Context','3 lines')])}
{data_strip(name,obs,'1m ago' if provider=='twitch' else '3m ago','Top 300' if provider=='twitch' else 'Top 100')}
<div class="toolbar"><span class="toolbar-label">Battle</span><div class="control-group"><button class="active">Recommended</button><button>Custom</button><button>＋ Add rival</button></div><span class="toolbar-label">Metric</span><div class="control-group"><button class="active">Viewers</button><button>Indexed</button></div><span class="toolbar-label">Bucket</span><div class="control-group"><button>1m</button><button class="active">5m</button><button>10m</button></div><button class="button button--quiet">Copy URL</button></div>
<div class="battle-summary"><div class="competitor"><small class="kicker">Leader</small><strong>LumenArc</strong><span>118.4K · +8.1%</span></div><div class="battle-vs">6.6K GAP<br>2 REVERSALS</div><div class="competitor"><small class="kicker">Challenger</small><strong>northstar</strong><span>111.8K · +12.6%</span></div></div>
<div class="layout-split"><section class="battle-stage">{battle_svg(provider)}</section><aside class="surface inspector"><div class="surface__head"><strong>15:35 UTC</strong><small>Time inspector</small></div><div class="surface__body"><div class="inspector__row"><div><small>LumenArc</small><strong>96.2K</strong></div><span class="up">+3.4K / 15m</span></div><div class="inspector__row"><div><small>northstar</small><strong>96.5K</strong></div><span class="up">+5.1K / 15m</span></div><div class="inspector__row"><div><small>Gap</small><strong>0.3K</strong></div><span>Reversal</span></div><div class="inspector__row"><div><small>Next context line</small><strong>MikaLive</strong></div><span>72.5K</span></div><p><button class="button">Jump to live</button></p></div></aside></div>
<div class="rule-title"><h2>Battle events</h2><span>Selected pair only</span></div><div class="event-feed"><div class="event"><time>15:35</time><div><strong>northstar passed LumenArc</strong><br><span>Gap moved from −1.8K to +0.3K.</span></div></div><div class="event"><time>14:20</time><div><strong>LumenArc reclaimed the lead</strong><br><span>Largest 15-minute rise of the pair.</span></div></div><div class="event"><time>12:55</time><div><strong>Battle entered close range</strong><br><span>Gap fell below 5% of the leader.</span></div></div></div></main>'''
    write(Path(provider)/'battle-lines/index.html',doc(depth,f'{name} Battle Lines',body,f'{name} data'))

def history_svg(provider):
    bars=[180,235,205,280,255,340,310,380,420,395,455,520,470,560]
    rects=''.join(f'<rect x="{65+i*78}" y="{500-h}" width="44" height="{h}" fill="{("#5b36b5" if provider=="twitch" else "#2f8a4f")}" opacity="{.55+i*.025}"/>' for i,h in enumerate(bars))
    line=' '.join(f'{87+i*78},{470-h*.72}' for i,h in enumerate(bars))
    grid=''.join(f'<line x1="40" y1="{y}" x2="1170" y2="{y}"/>' for y in range(80,501,70))
    return f'<svg viewBox="0 0 1210 560"><g class="chart-grid">{grid}</g>{rects}<polyline points="{line}" fill="none" stroke="#7dd3fc" stroke-width="3"/><text class="chart-axis" x="65" y="535">May 27</text><text class="chart-axis" x="535" y="535">Jun 02</text><text class="chart-axis" x="1050" y="535">Jun 09</text></svg>'

def history(provider):
    name='Twitch' if provider=='twitch' else 'Kick'; depth=2; obs='287' if provider=='twitch' else '83'; color='#905aff' if provider=='twitch' else '#22d378'
    body=f'''<main class="page page--full"><div class="breadcrumb">ViewLoom / {name} data / History</div>{feature_tabs(depth,provider,'history')}
{page_head(f'{name.upper()} DATA · TRENDS','History & Trends','Observed daily movement across the selected period. Use the chart to choose a day, then open its Day Flow or Battle Lines.', [('Period','Last 30 days'),('Metric','Viewer-minutes'),('Coverage','29 / 30 good'),('Retention','180 days')])}
{data_strip(name,obs,'Daily rollup','30-day period','Real + rollup')}
<div class="toolbar"><span class="toolbar-label">Period</span><div class="control-group"><button>7 days</button><button class="active">30 days</button><button>Custom</button></div><span class="toolbar-label">Metric</span><div class="control-group"><button class="active">Viewer-minutes</button><button>Peak viewers</button></div><button class="button button--quiet" data-copy="This week on {name}: LumenArc led observed viewer-minutes, northstar recorded the largest rise, and June 8 produced the highest audience peak. Coverage: 7/7 days good.">Copy summary</button></div>
<div class="period-summary"><div class="lead-stat"><small>Total observed</small><strong>42.8M</strong><span>viewer-minutes in selected period</span></div><div><small>Peak day</small><strong>Jun 08</strong><span>2.14M viewer-minutes</span></div><div><small>Top streamer</small><strong>LumenArc</strong><span>5.8M viewer-minutes</span></div><div><small>Biggest rise</small><strong>northstar</strong><span class="up">+38.6%</span></div><div><small>Coverage</small><strong>Good</strong><span>29 complete days</span></div></div>
<div class="history-columns"><section class="history-stage">{history_svg(provider)}</section><aside class="surface inspector"><div class="surface__head"><strong>June 08</strong><small>Selected day</small></div><div class="surface__body"><div class="inspector__row"><div><small>Viewer-minutes</small><strong>2.14M</strong></div><span class="up">+12.4%</span></div><div class="inspector__row"><div><small>Peak viewers</small><strong>1.92M</strong></div><span>20:35 UTC</span></div><div class="inspector__row"><div><small>Top streamer</small><strong>LumenArc</strong></div><span>128.6K</span></div><div class="inspector__row"><div><small>Battle events</small><strong>18</strong></div><span>3 major</span></div><p><a class="button" href="../day-flow/index.html">Open Day Flow</a></p><p><a class="text-link" href="../battle-lines/index.html">Open Battle Lines</a></p></div></aside></div>
<div class="rule-title"><h2>Top streamers</h2><span>Viewer-minutes · 30 days</span></div><table class="metric-ledger"><thead><tr><th>Rank</th><th>Streamer</th><th class="num">Viewer-minutes</th><th class="num">Peak</th><th class="num">Observed</th><th class="num">Change</th></tr></thead><tbody>
<tr><td class="rank">01</td><td><strong>LumenArc</strong></td><td class="num">5.8M</td><td class="num">128.6K</td><td class="num">86h</td><td class="num up">+8.4%</td></tr><tr><td class="rank">02</td><td><strong>northstar</strong></td><td class="num">5.2M</td><td class="num">118.2K</td><td class="num">91h</td><td class="num up">+38.6%</td></tr><tr><td class="rank">03</td><td><strong>MikaLive</strong></td><td class="num">4.1M</td><td class="num">96.4K</td><td class="num">73h</td><td class="num down">−4.1%</td></tr><tr><td class="rank">04</td><td><strong>Rook</strong></td><td class="num">3.6M</td><td class="num">74.9K</td><td class="num">79h</td><td class="num up">+5.7%</td></tr></tbody></table>
<div class="rule-title"><h2>Daily archive</h2><span>Open a day directly</span></div><div class="daily-archive">{''.join(f'<article class="day-card"><time>JUN {d:02d}</time><strong>{1.55+d*.06:.2f}M</strong><span>viewer-minutes</span><p>Peak: {1.2+d*.05:.2f}M · Coverage good</p><a class="text-link" href="../day-flow/index.html">Open day</a></article>' for d in [7,8,9])}</div></main>'''
    write(Path(provider)/'history/index.html',doc(depth,f'{name} History',body,f'{name} data'))

def status(provider):
    name='Twitch' if provider=='twitch' else 'Kick'; depth=2; obs='287' if provider=='twitch' else '83'; cadence='Every 5 minutes'
    body=f'''<main class="page"><div class="breadcrumb">ViewLoom / {name} data / Status</div>{feature_tabs(depth,provider,'status')}
{page_head(f'{name.upper()} DATA · STATUS',f'{name} data status','Collector health, latest snapshot, observed coverage, and the current state of each public feature.', [('Overall','Fresh'),('Last success','1m ago' if provider=='twitch' else '3m ago'),('Observed',obs),('Source','Real')])}
<div class="status-board"><div class="status-cell"><small>Collector</small><strong>Healthy</strong></div><div class="status-cell"><small>Latest snapshot</small><strong>12:40 UTC</strong></div><div class="status-cell"><small>Cadence</small><strong>5 minutes</strong></div><div class="status-cell"><small>Coverage</small><strong>{'Top 300' if provider=='twitch' else 'Top 100'}</strong></div><div class="status-cell"><small>Database</small><strong>Connected</strong></div></div>
<div class="rule-title"><h2>Feature data</h2><span>Public surfaces</span></div><table class="metric-ledger"><thead><tr><th>Feature</th><th>Role</th><th>State</th><th>Updated</th><th>Source</th><th>Known limitation</th></tr></thead><tbody><tr><td><a class="text-link" href="../heatmap/index.html">Heatmap</a></td><td>Now</td><td class="up">Fresh</td><td>1m ago</td><td>Real snapshot</td><td>Activity may be unavailable</td></tr><tr><td><a class="text-link" href="../day-flow/index.html">Day Flow</a></td><td>Today</td><td class="up">Fresh</td><td>1m ago</td><td>Minute snapshots</td><td>Observed window only</td></tr><tr><td><a class="text-link" href="../battle-lines/index.html">Battle Lines</a></td><td>Rivalry</td><td class="up">Fresh</td><td>1m ago</td><td>Derived pairs</td><td>Viewer-delta events</td></tr><tr><td><a class="text-link" href="../history/index.html">History</a></td><td>Trends</td><td class="up">Fresh</td><td>Daily</td><td>Daily rollups</td><td>180-day retention</td></tr></tbody></table>
<div class="rule-title"><h2>Pipeline</h2><span>How data reaches the pages</span></div><div class="pipeline"><div class="pipeline-step"><b>01</b><strong>Provider API</strong><p>Public live listing</p></div><div class="pipeline-step"><b>02</b><strong>Collector</strong><p>{cadence}</p></div><div class="pipeline-step"><b>03</b><strong>Minute snapshots</strong><p>D1 hot storage</p></div><div class="pipeline-step"><b>04</b><strong>Daily rollups</strong><p>History-ready totals</p></div><div class="pipeline-step"><b>05</b><strong>Feature APIs</strong><p>Page-shaped payloads</p></div></div>
<div class="rule-title"><h2>State definitions</h2><span>What labels mean</span></div><div class="notice">Fresh means the most recent scheduled collection succeeded. Partial means the observed limit or provider response did not cover the full available field. Empty means the real pipeline returned no qualifying streams; it does not mean demo data.</div></main>'''
    write(Path(provider)/'status/index.html',doc(depth,f'{name} Status',body,f'{name} data'))

def about():
    body='''<main class="page"><div class="breadcrumb">ViewLoom / About</div>'''+page_head('ABOUT THE OBSERVATORY','A narrow tool, built around four questions.','ViewLoom does not claim complete platform coverage. It records an observed field, marks limitations, and gives each kind of movement its own view.', [('Now','Heatmap'),('Today','Day Flow'),('Rivalry','Battle Lines'),('Trends','History')])+'''<article class="prose"><h2>Why the views stay separate</h2><p>A current snapshot and a thirty-day trend do not answer the same question. ViewLoom keeps them apart so scale, share, rivalry, and history are not collapsed into one generic dashboard.</p><h2>What the numbers mean</h2><p>Viewer counts are public observed values collected on a schedule. Viewer-minutes are derived from repeated snapshots and sample intervals. They are not official platform analytics and should not be read as exact creator revenue or unique viewers.</p><h2>Coverage and missing data</h2><p>Each provider has its own observed set, collection behavior, and limitations. A fresh empty result is different from a collector failure. Partial, stale, demo, and missing states are shown explicitly.</p><h2>Independence</h2><p>ViewLoom is an independent, unofficial project. It is not affiliated with, endorsed by, or operated by Twitch or Kick.</p></article></main>'''
    write(Path('about/index.html'),doc(1,'About',body,'About'))

def support():
    body='''<main class="page"><div class="breadcrumb">ViewLoom / Support</div>'''+page_head('SUPPORT VIEWLOOM','Keep the observation running.','Support helps maintain collection, storage, status checks, and public access to ViewLoom. It does not purchase rankings or influence what appears in the data.', [('Access','Public'),('Payment','One-time'),('Editorial influence','None'),('Refunds','See policy')])+'''<div class="support-options"><section class="support-option"><div class="kicker">One-time support</div><h2>Support the project</h2><p>Contribute through the official ViewLoom payment page. No account is created and no product tier is unlocked.</p><p><a class="button" href="https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03">Open secure payment</a></p></section><section class="support-option"><div class="kicker">What support maintains</div><h2>Collection and public access</h2><p>Scheduled data collection, Cloudflare storage, status monitoring, documentation, and continued work on the public interface.</p><table class="metric-ledger"><tr><td>Data collection</td><td class="num">Ongoing</td></tr><tr><td>Public site</td><td class="num">No paywall</td></tr><tr><td>Ranking influence</td><td class="num">None</td></tr></table></section></div><div class="rule-title"><h2>Policies</h2><span>Before supporting</span></div><div class="prose"><p>Support is voluntary and does not purchase a service contract, creator listing, ranking placement, data correction, or preferential coverage. Payment and refund handling follow the policy presented on the live support page.</p></div></main>'''
    write(Path('support/index.html'),doc(1,'Support',body,'Support'))

def readme():
    txt='''# ViewLoom redesign HTML mock\n\nStatic replacement-level mock for all current public page types.\n\n## Included pages\n- Portal\n- About\n- Support\n- Twitch: Home, Heatmap, Day Flow, Battle Lines, History, Status\n- Kick: Home, Heatmap, Day Flow, Battle Lines, History, Status\n\n## Design direction\n- Dense observation surface rather than a SaaS card dashboard\n- ViewLoom dark navy palette with restrained Portal/Twitch/Kick accents\n- Charts and tables before explanation\n- Few cards, few pills, no neon glassmorphism\n- Page-specific information architecture\n- Responsive layouts and working mock interactions\n\n## Important\nThe displayed values are mock data. The HTML/CSS structure is intended as a direct visual and structural replacement candidate; real API bindings would replace the static values.\n\nOpen `index.html` to review all routes.\n'''
    write(Path('README.md'),txt)

portal();about();support()
for p in ['twitch','kick']:
    provider_home(p);heatmap(p);dayflow(p);battle(p);history(p);status(p)
readme()
