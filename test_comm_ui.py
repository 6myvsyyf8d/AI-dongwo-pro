"""沟通四层模型截图"""
from playwright.sync_api import sync_playwright
import os

BASE = 'http://localhost:12345'
DIR = '/tmp/comm_screenshots'
os.makedirs(DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 430, 'height': 900})
    page.on('pageerror', lambda e: print(f'JS ERROR: {e}'))

    # Login
    page.goto(f'{BASE}/#login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.evaluate('''() => {
        var DataStore = window.DataStore;
        DataStore.init();
        var u = DataStore.getAllUsers().find(function(x){return x.id==='u_sample_parent';});
        if (u) {
            DataStore.setCurrentUser(u);
            if (window.AppState) { window.AppState.currentUser=u; window.AppState.currentRole=u.role; }
        }
    }''')
    page.wait_for_timeout(500)

    # Screenshot 1: Communication page full
    page.goto(f'{BASE}/#communication')
    page.wait_for_timeout(1000)
    page.screenshot(path=f'{DIR}/comm_l1_top.png', full_page=False)
    print('comm_l1_top.png — L1 摘要 + L2 变化顶部')

    # Scroll to L2, check time tabs
    page.evaluate('() => { document.querySelector(".comm-layer-l2")?.scrollIntoView(); }')
    page.wait_for_timeout(300)
    page.screenshot(path=f'{DIR}/comm_l2_tabs.png', full_page=False)
    print('comm_l2_tabs.png — L2 时间范围选择器')

    # Click "30天" tab
    tabs = page.locator('.comm-time-tab')
    if tabs.count() > 1:
        tabs.nth(1).click()
        page.wait_for_timeout(300)
    page.screenshot(path=f'{DIR}/comm_l2_30d.png', full_page=False)
    print('comm_l2_30d.png — L2 30天视图')

    # Scroll to L3
    page.evaluate('() => { document.querySelector(".comm-layer-l3")?.scrollIntoView(); }')
    page.wait_for_timeout(300)
    page.screenshot(path=f'{DIR}/comm_l3_events.png', full_page=False)
    print('comm_l3_events.png — L3 关键事件')

    # Scroll to L4, check grouping
    page.evaluate('() => { document.querySelector(".comm-layer-l4")?.scrollIntoView(); }')
    page.wait_for_timeout(300)
    page.screenshot(path=f'{DIR}/comm_l4_records.png', full_page=False)
    print('comm_l4_records.png — L4 全部记录')

    # Click "查看依据"
    evidence_links = page.locator('.comm-view-evidence')
    if evidence_links.count() > 0:
        evidence_links.first.click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{DIR}/comm_evidence_drawer.png', full_page=False)
        print('comm_evidence_drawer.png — 查看依据抽屉')
    
    # Full page
    page.screenshot(path=f'{DIR}/comm_full_430px.png', full_page=True)
    print('comm_full_430px.png — 完整页面 430px')

    # Check L4 collapse
    headers = page.locator('.comm-l4-group-header')
    if headers.count() > 0:
        # Close overlay first if open
        page.evaluate('() => { var o = document.querySelector(".comm-record-overlay"); if(o) o.remove(); }')
        page.wait_for_timeout(200)
        headers.first.click()
        page.wait_for_timeout(300)
        page.screenshot(path=f'{DIR}/comm_l4_collapsed.png', full_page=False)
        print('comm_l4_collapsed.png — L4 折叠')

    browser.close()
    print(f'\n截图已保存: {DIR}')
