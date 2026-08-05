"""补 390px 截图"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:12345'
DIR = '/tmp/comm_screenshots'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 390, 'height': 850})

    # Login
    page.goto(f'{BASE}/#login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.evaluate('''() => {
        var ds = window.DataStore; ds.init();
        var u = ds.getAllUsers().find(function(x){return x.id==='u_sample_parent';});
        if (u) { ds.setCurrentUser(u); if(window.AppState){window.AppState.currentUser=u;window.AppState.currentRole=u.role;} }
    }''')

    # 1. 沟通说明书·390px·L1顶部
    page.goto(f'{BASE}/#communication')
    page.wait_for_timeout(1000)
    page.screenshot(path=f'{DIR}/comm_390px_l1.png', full_page=False)
    print('comm_390px_l1.png — 390px L1 摘要顶部')

    # 2. 沟通说明书·390px·全页
    page.screenshot(path=f'{DIR}/comm_390px_full.png', full_page=True)
    print('comm_390px_full.png — 390px 完整页面')

    # 3. 档案总览·390px
    page.goto(f'{BASE}/#archive')
    page.wait_for_timeout(600)
    page.screenshot(path=f'{DIR}/archive_390px.png', full_page=False)
    print('archive_390px.png — 390px 档案总览')

    # 4. 主题档案·390px
    page.goto(f'{BASE}/#archive-topics')
    page.wait_for_timeout(600)
    page.screenshot(path=f'{DIR}/topics_390px.png', full_page=False)
    print('topics_390px.png — 390px 主题档案')

    browser.close()
    print('✅ 390px 截图已补充')
