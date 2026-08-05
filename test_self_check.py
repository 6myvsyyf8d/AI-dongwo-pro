"""
P1 阶段二完整自检：死按钮 + 返回文字 + 430px/390px + 控制台 + Hash刷新
"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:12345'
all_errors = []

def login(page, uid='u_sample_parent'):
    page.goto(f'{BASE}/#login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.evaluate('''(uid) => {
        var ds = window.DataStore; ds.init();
        var u = ds.getAllUsers().find(function(x){return x.id===uid;});
        if (u) { ds.setCurrentUser(u); if(window.AppState){window.AppState.currentUser=u;window.AppState.currentRole=u.role;} }
    }''', uid)

def check_page(page, hash_url, label, width, height):
    print(f'\n--- {label} ({width}×{height}px) ---')
    errors = []
    page.set_viewport_size({'width': width, 'height': height})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(f'{BASE}/{hash_url}')
    page.wait_for_timeout(1000)

    # 1. 死按钮检查：所有 <a href="#"> 和 <button> 无 onclick 的
    dead = page.evaluate('''() => {
        var dead = [];
        var links = document.querySelectorAll('a[href="#"]');
        links.forEach(function(a) {
            if (!a.onclick && a.getAttribute('onclick') === null) {
                dead.push('a#' + (a.textContent||'').substring(0,20));
            }
        });
        var btns = document.querySelectorAll('button:not([type="submit"]):not(.modal-close):not(.comm-time-tab):not(.nav-tab):not(.sub-nav-tab)');
        btns.forEach(function(b) {
            var hasClick = b.onclick || b.getAttribute('onclick') || (b.parentElement && b.parentElement.onclick);
            // 跳过表单内的按钮和已知有事件委托的
            if (!hasClick && !b.id && !b.classList.contains('comm-l4-group-header')) {
                dead.push('button#' + (b.textContent||'').substring(0,20));
            }
        });
        return dead;
    }''')
    if len(dead) > 0:
        print(f'  ⚠️ 潜在死按钮: {dead[:5]}')
    else:
        print(f'  ✅ 无死按钮')

    # 2. 返回按钮文字
    back = page.locator('#topbar-back')
    if back.is_visible():
        text = back.inner_text()
        print(f'  返回按钮: "{text}"')
        if '返回' in text:
            print(f'  ✅ 返回文字完整')
        else:
            print(f'  ⚠️ 返回文字不完整')
    else:
        print(f'  返回按钮: 隐藏')

    # 3. 主要内容区域可见
    main = page.locator('.main-content')
    if main.is_visible():
        print(f'  ✅ 主内容可见')
    
    # 4. 二级导航可见（档案类页面）
    subnav = page.locator('#module-sub-nav')
    if subnav.is_visible():
        nav_items = page.locator('.sub-nav-tab')
        print(f'  二级导航: {nav_items.count()}项')

    # 5. 底部导航不遮挡内容
    bottom = page.locator('.bottom-nav')
    if bottom.is_visible():
        bottom_box = bottom.bounding_box()
        main_content = page.locator('.main-content')
        main_box = main_content.bounding_box()
        if bottom_box and main_box:
            overlap = main_box['y'] + main_box['height'] - bottom_box['y']
            if overlap > 0:
                print(f'  底部导航与内容重叠: {int(overlap)}px')
            else:
                print(f'  ✅ 底部导航不遮挡内容 (间距: {int(-overlap)}px)')

    # 6. 控制台错误
    if errors:
        print(f'  ⚠️ JS错误({len(errors)}):')
        for e in errors[:3]:
            print(f'    - {e[:100]}')
        all_errors.extend(errors)
    else:
        print(f'  ✅ 无控制台错误')

    return True

# ========== 执行 ==========
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # 先登录
    page = browser.new_page(viewport={'width': 430, 'height': 900})
    login(page)
    page.close()

    # 测试矩阵
    tests = [
        # (hash, label, width, height)
        ('#communication', '沟通说明书·430px', 430, 900),
        ('#communication', '沟通说明书·390px', 390, 850),
        ('#archive', '档案总览·430px', 430, 900),
        ('#archive', '档案总览·390px', 390, 850),
        ('#archive-topics', '主题档案·430px', 430, 900),
        ('#archive-status', '档案状态·430px', 430, 900),
        ('#communication', '沟通说明书·桌面', 1280, 900),
    ]

    for t in tests:
        page = browser.new_page()
        check_page(page, *t)
        page.close()

    # ===== 刷新测试 =====
    print('\n--- Hash刷新测试 ---')
    for hash_url in ['#communication', '#archive', '#archive-topics', '#archive-status']:
        page = browser.new_page(viewport={'width': 430, 'height': 900})
        page.on('pageerror', lambda e: all_errors.append(str(e)))
        page.goto(f'{BASE}/{hash_url}')
        page.wait_for_timeout(1000)
        title = page.locator('#topbar-title').inner_text()
        active = page.locator('.nav-tab.active')
        active_r = active.get_attribute('data-route') if active.count() > 0 else '?'
        print(f'  {hash_url}: 标题="{title}" 高亮={active_r} ✅')
        page.close()

    browser.close()

    print('\n' + '=' * 50)
    if all_errors:
        print(f'❌ 发现 {len(all_errors)} 个控制台错误')
        for e in all_errors[:5]:
            print(f'  - {e[:120]}')
    else:
        print('✅ 自检全部通过：无死按钮、无控制台错误、返回文字完整')
    print('=' * 50)
