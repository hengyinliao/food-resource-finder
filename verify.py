"""Optional QA: pip install playwright pypdf; python verify.py.
Uses installed Microsoft Edge, or set CHROMIUM_PATH. No app dependencies.
Geolocation is mocked: the suite never requests the tester's real location.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from pypdf import PdfReader

root = Path(__file__).resolve().parent
output = root / 'qa-output'
output.mkdir(exist_ok=True)
browser_path = os.environ.get('CHROMIUM_PATH', r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')

def pdf_text(name):
    reader = PdfReader(output / name)
    assert all(float(p.mediabox.width) == 612 and float(p.mediabox.height) == 792 for p in reader.pages)
    return '\n'.join(p.extract_text() for p in reader.pages)

def begin(page, need='meal', audience='everyone'):
    page.goto((root / 'index.html').as_uri())
    page.locator('#begin').click()
    page.locator(f'input[value="{need}"]').check()
    page.locator('#next').click()
    page.locator(f'input[value="{audience}"]').check()
    page.locator('#next').click()

def no_overflow(page):
    if not page.evaluate('document.documentElement.scrollWidth <= innerWidth'):
        page.screenshot(path=str(output/'overflow.png'),full_page=True)
        offenders = page.evaluate('''Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,id:e.id}))''')
        raise AssertionError((page.viewport_size,offenders))

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=browser_path, headless=True)
    page = browser.new_page(viewport={'width':1360,'height':1050})
    errors = []
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.goto((root / 'tests.html').as_uri())
    assert page.locator('.fail').count() == 0, page.locator('.fail').all_text_contents()
    assert page.locator('.pass').count() == 25
    print('PASS: 25 matching, sample-data, and approximate-area checks')

    page.goto((root / 'index.html').as_uri())
    assert page.title() == 'Food Resource Finder — Prototype'
    assert page.locator('input').count() == 4  # Settings only; no home questionnaire.
    assert page.locator('#accessibility-panel').is_hidden()
    page.locator('#how-button').click()
    assert page.locator('#how-content').is_visible()
    page.locator('#about-title').click()
    assert 'Hengyin Liao' in page.locator('#about-content').inner_text()
    page.locator('#about-title').click()
    page.locator('#how-button').click()
    page.screenshot(path=str(output / 'revised-home.png'),full_page=True)

    # Immediate settings, local-only persistence, keyboard operation, Escape focus.
    page.locator('#accessibility-button').focus()
    page.keyboard.press('Enter')
    assert page.locator('#accessibility-panel').is_visible()
    original = page.locator('html').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)')
    for key in ['largeText','highContrast','simplified','reduceMotion']:
        page.locator(f'#setting-{key}').check()
        assert key in page.locator('html').get_attribute('class')
    larger = page.locator('html').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)')
    assert larger / original >= 1.25
    assert page.locator('.welcome-art').is_hidden()
    page.keyboard.press('Escape')
    assert page.locator('#accessibility-panel').is_hidden()
    assert page.locator('#accessibility-button').evaluate('(el)=>el===document.activeElement')
    page.reload()
    assert 'largeText' in page.locator('html').get_attribute('class')
    assert set(page.evaluate('Object.keys(localStorage)')) == {'food-finder-accessibility-v1'}
    page.locator('#accessibility-button').click()
    for key in ['largeText','highContrast','simplified','reduceMotion']:
        page.locator(f'#setting-{key}').uncheck()
    page.locator('#close-settings').click()
    print('PASS: settings apply immediately, persist locally, and support keyboard dismissal')

    page.locator('#begin').click()
    assert page.locator('#next').is_disabled()
    page.locator('input[value="meal"]').focus()
    page.keyboard.press('Space')
    assert page.locator('input[value="meal"]').is_checked()
    page.screenshot(path=str(output / 'revised-questionnaire.png'),full_page=True)
    page.locator('#next').click()
    assert page.locator('h1').evaluate('(el)=>el===document.activeElement')
    page.locator('input[value="everyone"]').check()
    page.locator('#next').click()
    page.locator('#choose-area').click()
    page.locator('#neighbourhood').select_option('Kitsilano')
    page.locator('[data-language="zh"]').click()
    assert page.locator('#neighbourhood').input_value() == 'Kitsilano'
    assert page.locator('html').get_attribute('lang') == 'zh-Hans'
    page.locator('#neighbourhood').select_option('any')
    page.locator('#next').click()
    page.locator('[data-language="en"]').click()
    page.locator('input[value="stepFree"]').check()
    page.locator('input[value="washroom"]').check()
    assert not page.locator('input[value="none"]').is_checked()
    page.locator('input[value="information"]').check()
    assert not page.locator('input[value="stepFree"]').is_checked()
    page.locator('input[value="seating"]').check()
    assert not page.locator('input[value="information"]').is_checked()
    page.locator('#back').click()
    page.locator('#next').click()
    assert page.locator('input[value="seating"]').is_checked()
    page.locator('input[value="none"]').check()
    page.locator('#next').click()
    assert page.locator('.resource-card').count() == 3
    assert '4 matching resources' in page.locator('#results-count').inner_text()
    assert page.locator('#details-1').is_hidden()
    page.locator('[data-details="1"]').click()
    assert page.locator('#details-1').is_visible()
    page.locator('[data-details="1"]').click()
    page.locator('[data-directions="1"]').click()
    assert 'fictional address' in page.locator('#directions-1').inner_text()
    page.screenshot(path=str(output / 'revised-results.png'),full_page=True)
    print('PASS: questionnaire, back/forward state, exclusive no-preference, language, card disclosures')

    # Printing must include contact details even when their screen disclosure is closed.
    page.evaluate('() => {window.printCalls=0;window.print=()=>window.printCalls++;}')
    page.locator('#print').click()
    assert page.evaluate('window.printCalls') == 1
    page.pdf(path=str(output / 'selected-results.pdf'),prefer_css_page_size=True)
    text = pdf_text('selected-results.pdf')
    for expected in ['Food Resources for You','Updated: September 2026','All pilot areas','Everyone','Language:','English','604-555-0101','Step-free','not verified','Hengyin Liao','should not be used to access real services']:
        assert expected in text, expected
    for excluded in ['Marpole Daily Table','Print these results','Start again','View details','Directions','Would a map help']:
        assert excluded not in text, excluded
    page.locator('#more').click()
    assert page.locator('.resource-card').count() == 4
    assert page.locator('#resource-12').evaluate('(el)=>el===document.activeElement')
    page.pdf(path=str(output / 'all-matching-results.pdf'),prefer_css_page_size=True)
    assert 'Marpole Daily Table' in pdf_text('all-matching-results.pdf')
    page.locator('[data-language="zh"]').click()
    page.locator('[data-details="1"]').click()
    assert '热午餐' in page.locator('#details-1').inner_text()
    assert page.locator('#resource-1').inner_text() == 'Neighbourhood Table'
    page.pdf(path=str(output / 'chinese-results.pdf'),prefer_css_page_size=True)
    assert 'Hengyin Liao' in pdf_text('chinese-results.pdf')
    print('PASS: Letter PDFs include hidden contact details, chosen criteria, language, access information and credit')

    begin(page,'garden')
    page.locator('#next').click()
    page.locator('#next').click()
    assert 'Accessibility information not yet available' in page.locator('.resource-card').first.inner_text()
    begin(page,'youth','senior')
    page.locator('#next').click(); page.locator('#next').click()
    assert page.locator('.resource-card').count() == 0
    assert page.locator('#print').is_disabled()
    page.locator('#empty-edit').click()
    assert page.locator('input[value="youth"]').is_checked()
    page.locator('#restart').click()
    page.locator('#begin').click()
    assert page.locator('#next').is_disabled()

    # Permission is requested only after the explanation and an explicit click.
    begin(page)
    page.evaluate('''() => {
      window.geoCalls=0;
      navigator.geolocation.getCurrentPosition=(success,error,options)=>{
        window.geoCalls++; window.geoSuccess=success; window.geoError=error;
        window.geoOptions=options;
      };
    }''')
    page.locator('#help-area').click()
    assert page.evaluate('window.geoCalls') == 0
    assert 'Your location will not be saved' in page.locator('.location-help').inner_text()
    page.locator('#use-location').click()
    assert page.evaluate('window.geoCalls') == 1
    page.evaluate('geoSuccess({coords:{latitude:49.267,longitude:-123.165,accuracy:100}})')
    assert 'You may be near Kitsilano' in page.locator('.area-suggestion').inner_text()
    assert page.locator('.current-area strong').inner_text() == 'All pilot areas'
    page.locator('#confirm-area').click()
    assert page.locator('#neighbourhood').input_value() == 'Kitsilano'
    page.locator('#help-area').click(); page.locator('#use-location').click()
    page.evaluate('geoError({code:1})')
    assert 'wasn’t allowed' in page.locator('.location-status').inner_text()
    page.locator('#use-location').click()
    page.evaluate('geoSuccess({coords:{latitude:50,longitude:-120,accuracy:100}})')
    assert 'couldn’t suggest' in page.locator('.location-status').inner_text()
    page.locator('#use-location').click()
    page.evaluate('geoError({code:3})')
    assert 'couldn’t find' in page.locator('.location-status').inner_text()
    page.locator('#use-location').click()
    page.locator('#choose-area').click()
    page.locator('#neighbourhood').select_option('Dunbar')
    page.evaluate('geoSuccess({coords:{latitude:49.267,longitude:-123.165,accuracy:100}})')
    assert page.locator('#neighbourhood').input_value() == 'Dunbar'
    assert 'latitude' not in page.evaluate('JSON.stringify(localStorage)')
    print('PASS: unknown access, empty results, reset, optional location permission, denial, timeout, outside-area and stale responses')

    # Mobile/reflow, all settings combined, both languages, every screen.
    for width in [375,320]:
        page.set_viewport_size({'width':width,'height':812})
        for lang in ['en','zh']:
            begin(page,'groceries','family')
            page.locator('[data-language="'+lang+'"]').click()
            page.locator('#accessibility-button').click()
            for key in ['largeText','highContrast','simplified','reduceMotion']:
                page.locator(f'#setting-{key}').check()
            no_overflow(page)
            page.locator('#close-settings').click()
            no_overflow(page)
            page.locator('#next').click(); no_overflow(page)
            page.locator('#next').click(); no_overflow(page)
            page.locator('[data-details="2"]').click(); no_overflow(page)
            page.screenshot(path=str(output / f'revised-mobile-{width}-{lang}-accessible.png'),full_page=True)
            page.locator('#restart').click(); no_overflow(page)
            page.locator('#begin').click(); no_overflow(page)
            page.locator('input[value="meal"]').check()
            page.locator('#next').click(); no_overflow(page)
    print('PASS: all settings combined in English/Chinese at 375px and 320px, including expanded details')

    # Restricted storage must never block basic interaction or accessibility settings.
    restricted = browser.new_page()
    restricted.add_init_script('''Object.defineProperty(window,'localStorage',{get(){throw new Error('Unavailable')}});''')
    restricted.goto((root/'index.html').as_uri())
    restricted.locator('#accessibility-button').click()
    restricted.locator('#setting-largeText').check()
    assert 'could not save' in restricted.locator('#settings-note').inner_text()
    restricted.locator('#close-settings').click()
    restricted.locator('#begin').click()
    assert restricted.locator('#next').is_disabled()
    restricted.close()
    assert not errors, errors
    print('PASS: storage-denied fallback; no browser JavaScript errors')
    browser.close()
print('QA artifacts saved in qa-output/')
