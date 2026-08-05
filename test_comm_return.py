"""验证沟通四层模型 — 原路返回状态恢复"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:12345'
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 430, 'height': 900})
    page.on('pageerror', lambda e: errors.append(str(e)))

    # Login
    page.goto(f'{BASE}/#login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.evaluate('''() => {
        var DataStore = window.DataStore;
        DataStore.init();
        var u = DataStore.getAllUsers().find(function(x){return x.id==='u_sample_parent';});
        if (u) { DataStore.setCurrentUser(u); }
    }''')

    # Navigate to communication
    page.goto(f'{BASE}/#communication')
    page.wait_for_timeout(1000)

    # 1. Switch L2 to "30天" 
    tabs = page.locator('.comm-time-tab')
    assert tabs.count() == 4, f'L2 tabs 数量不对: {tabs.count()}'
    tabs.nth(1).click()  # 30天
    page.wait_for_timeout(300)
    active = page.locator('.comm-time-tab.active').inner_text()
    print(f'1. L2 切换到: {active}')
    assert '30天' in active

    # 2. Collapse L4 first group
    headers = page.locator('.comm-l4-group-header')
    if headers.count() > 0:
        headers.first.click()
        page.wait_for_timeout(200)
        toggle = page.locator('.comm-l4-toggle').first.inner_text()
        print(f'2. L4 折叠后 toggle: {toggle}')

    # 3. Click "查看依据"
    evidence = page.locator('.comm-view-evidence').first
    evidence.click()
    page.wait_for_timeout(500)
    overlay = page.locator('.comm-record-overlay')
    assert overlay.count() > 0, 'FAIL: 弹层未出现'
    print('3. 查看依据弹层已打开')

    # 4. Close drawer
    page.locator('.comm-record-overlay button').click()
    page.wait_for_timeout(300)
    overlay2 = page.locator('.comm-record-overlay')
    assert overlay2.count() == 0, 'FAIL: 弹层未关闭'
    print('4. 弹层已关闭')

    # 5. Verify L2 state preserved (30天 still active)
    active2 = page.locator('.comm-time-tab.active').inner_text()
    print(f'5. L2 恢复状态: {active2}')
    assert '30天' in active2, f'FAIL: L2 状态丢失，当前{active2}'

    # 6. Navigate to #archive-topics, then back to #communication
    page.goto(f'{BASE}/#archive-topics')
    page.wait_for_timeout(500)
    page.goto(f'{BASE}/#communication')
    page.wait_for_timeout(1000)

    # Verify page rendered
    l1_items = page.locator('.comm-l1-item')
    l3_items = page.locator('.comm-l3-item')
    l4_groups = page.locator('.comm-l4-group')
    print(f'6. 离开再返回: L1={l1_items.count()}条 L3={l3_items.count()}条 L4={l4_groups.count()}组')
    assert l1_items.count() > 0, 'FAIL: L1 未渲染'
    assert l3_items.count() > 0, 'FAIL: L3 未渲染'

    # 7. Direct refresh #communication
    page.goto(f'{BASE}/#communication')
    page.wait_for_timeout(1000)
    l1_items2 = page.locator('.comm-l1-item')
    print(f'7. 直接刷新 #communication: L1={l1_items2.count()}条')
    assert l1_items2.count() > 0, 'FAIL: 刷新后 L1 未渲染'

    if errors:
        print(f'\n⚠️ JS错误: {errors}')
        exit(1)
    else:
        print('\n✅ 全部通过：返回状态恢复 + 刷新路由')

    browser.close()
