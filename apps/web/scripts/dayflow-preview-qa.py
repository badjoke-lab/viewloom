import json
import os
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

base = os.environ['PREVIEW_BASE']
providers = ['twitch', 'kick']
report = []


def check(name, condition, detail=''):
    report.append({'name': name, 'ok': bool(condition), 'detail': str(detail)})
    if not condition:
        raise AssertionError(f'{name}: {detail}')


def get_json(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        check(f'HTTP 200 {url}', response.status == 200, response.status)
        return json.load(response)


for attempt in range(36):
    try:
        with urllib.request.urlopen(f'{base}/twitch/day-flow/', timeout=20) as response:
            html = response.read().decode('utf-8', 'replace')
            if response.status == 200 and 'data-dayflow-metric="share"' in html:
                break
    except Exception:
        pass
    time.sleep(5)
else:
    raise RuntimeError('Cloudflare branch preview did not become ready')

for provider in providers:
    endpoint = 'day-flow' if provider == 'twitch' else 'kick-day-flow'
    payload = get_json(f'{base}/api/{endpoint}?rangeMode=today&top=20&bucket=5&metric=volume')
    bands = payload.get('bands') or []
    buckets = payload.get('buckets') or []
    check(f'{provider} API source', payload.get('source') == 'api', payload.get('source'))
    check(f'{provider} API has timestamp buckets', len(buckets) > 0 and all('T' in value for value in buckets), len(buckets))
    check(f'{provider} API has observed bands', len(bands) > 1, {'state': payload.get('state'), 'bands': len(bands)})
    check(f'{provider} API includes Others', any(b.get('isOthers') or b.get('streamerId') == 'others' for b in bands))
    shares = [point.get('share') for band in bands for point in (band.get('buckets') or []) if isinstance(point.get('share'), (int, float))]
    check(f'{provider} API share remains 0..1', bool(shares) and min(shares) >= 0 and max(shares) <= 1, (min(shares or [0]), max(shares or [0])))
    viewers = [point.get('viewers', 0) for band in bands if not band.get('isOthers') for point in (band.get('buckets') or [])]
    check(f'{provider} API selected-time values are nonzero', max(viewers or [0]) > 0, max(viewers or [0]))

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for provider in providers:
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'{base}/{provider}/day-flow/', wait_until='domcontentloaded', timeout=60000)
        page.wait_for_selector('[data-dayflow-band]', timeout=30000)
        initial_count = page.locator('[data-dayflow-band]').count()
        check(f'{provider} desktop renders bands', initial_count > 1, initial_count)
        check(f'{provider} desktop renders Others', page.locator('[data-dayflow-band="others"]').count() == 1)
        check(f'{provider} desktop Time Focus nonzero', '0 viewers' not in page.locator('[data-dayflow-time-focus]').inner_text())

        page.locator('[data-dayflow-metric="share"]').click()
        page.wait_for_function("document.querySelector('.head-facts').innerText.includes('Share')")
        check(f'{provider} Share button updates URL', 'metric=share' in page.url, page.url)
        check(f'{provider} Share axis reaches 100%', '100%' in page.locator('.dayflow-axes').text_content())

        page.locator('[data-dayflow-bucket="10"]').click()
        page.wait_for_function("document.querySelector('.head-facts').innerText.includes('10 minutes')")
        check(f'{provider} 10m button updates URL', 'bucket=10' in page.url, page.url)

        page.locator('[data-dayflow-top="50"]').click()
        page.wait_for_function("location.search.includes('top=50')")
        count_50 = page.locator('[data-dayflow-band]').count()
        check(f'{provider} Top50 is not capped at 12', count_50 > 12, count_50)

        chart = page.locator('[data-dayflow-chart]')
        before_time = page.locator('[data-dayflow-time-focus] .time-focus-head strong').inner_text()
        box = chart.bounding_box()
        page.mouse.click(box['x'] + box['width'] * 0.3, box['y'] + box['height'] * 0.5)
        after_time = page.locator('[data-dayflow-time-focus] .time-focus-head strong').inner_text()
        check(f'{provider} chart click changes time', before_time != after_time, (before_time, after_time))

        selectable = page.locator('[data-dayflow-band]:not([data-dayflow-band="others"])')
        old_name = page.locator('[data-dayflow-detail] h2').inner_text()
        selectable.nth(1).click(force=True, position={'x': 4, 'y': 4})
        page.wait_for_timeout(300)
        new_name = page.locator('[data-dayflow-detail] h2').inner_text()
        check(f'{provider} band click changes streamer', old_name != new_name, (old_name, new_name))
        check(f'{provider} desktop no horizontal overflow', page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), page.evaluate('document.documentElement.scrollWidth'))
        check(f'{provider} desktop no page errors', not errors, errors)
        page.screenshot(path=f'/tmp/{provider}-desktop.png', full_page=True)
        page.close()

        context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        mobile = context.new_page()
        mobile.goto(f'{base}/{provider}/day-flow/', wait_until='domcontentloaded', timeout=60000)
        mobile.wait_for_selector('[data-dayflow-band]', timeout=30000)
        mobile.locator('[data-dayflow-metric="share"]').tap(force=True)
        mobile.wait_for_function("document.querySelector('.head-facts').innerText.includes('Share')")
        check(f'{provider} mobile Share control works', 'metric=share' in mobile.url, mobile.url)
        mobile.locator('[data-dayflow-band]:not([data-dayflow-band="others"])').nth(1).tap(force=True)
        check(f'{provider} mobile band tap works', mobile.locator('[data-dayflow-detail] h2').inner_text() != '')
        check(f'{provider} mobile no horizontal overflow', mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), mobile.evaluate('document.documentElement.scrollWidth'))
        mobile.screenshot(path=f'/tmp/{provider}-mobile.png', full_page=True)
        context.close()
    browser.close()

failed = [item for item in report if not item['ok']]
Path('/tmp/dayflow-preview-qa.json').write_text(json.dumps({'checks': len(report), 'passed': len(report) - len(failed), 'failed': len(failed), 'results': report}, indent=2))
print(json.dumps({'checks': len(report), 'passed': len(report) - len(failed), 'failed': len(failed)}, indent=2))
