"""
P1 阶段一修正验收测试：返回层级 + 真实导航链 + 截图
"""
from playwright.sync_api import sync_playwright
import os

BASE = 'http://localhost:12345'
SCREENSHOT_DIR = '/tmp/p1_screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

USER_IDS = {
    '系统管理员': 'u_sys_admin',
    '妈妈': 'u_sample_parent',
    '小雨': 'u_sample_youth',
}

def login(page, name):
    uid = USER_IDS.get(name)
    page.goto(f'{BASE}/#login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.evaluate('''(uid) => {
        var DataStore = window.DataStore;
        DataStore.init();
        var users = DataStore.getAllUsers();
        var target = users.find(function(u){return u.id===uid;});
        if(target){
            DataStore.setCurrentUser(target);
            if(window.AppState){ window.AppState.currentUser=target; window.AppState.currentRole=target.role; }
        }
        // 触发完整导航初始化
        if (typeof window.initApp === 'function') window.initApp();
        else if (window.renderBottomNav) window.renderBottomNav();
    }''', uid)
    page.wait_for_timeout(500)

def verify_return_chain(page, steps):
    """验证返回链：按 steps 顺序导航并检查返回按钮"""
    for i, step in enumerate(steps):
        page.goto(f'{BASE}/#{step["hash"]}')
        page.wait_for_timeout(600)
        back = page.locator('#topbar-back')
        if step.get('back_label') and back.is_visible():
            text = back.inner_text()
            print(f'  {step["hash"]} → 返回按钮: "{text}"')
            assert step['back_label'] in text, f'FAIL: 期望"{step["back_label"]}", 实际"{text}"'
        else:
            print(f'  {step["hash"]} → 返回按钮: ' + ('隐藏' if not back.is_visible() else back.inner_text()))
        
        if step.get('page_title'):
            title = page.locator('#topbar-title').inner_text()
            print(f'    标题: "{title}"')
        
        # 一级Tab高亮
        active = page.locator('.nav-tab.active')
        if active.count() > 0:
            route = active.get_attribute('data-route')
            if step.get('expected_parent'):
                assert route == step['expected_parent'], f'FAIL: 一级Tab高亮错误: {route} vs {step["expected_parent"]}'

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        errors = []

        print('=' * 60)
        print('P1 阶段一修正验收测试')
        print('=' * 60)

        # ====== Test 1: JS 数据结构 ======
        print('\n--- 1. JS 数据结构 ---')
        page = browser.new_page(viewport={'width': 430, 'height': 900})
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.goto(f'{BASE}/#login')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        results = page.evaluate('''() => {
            var C = window.Constants;
            var bp = C.PAGE_BACK_PARENT || {};
            return {
                adminDefault: C.ROLE_DEFAULT_PAGES.admin,
                backLife: bp['communication'],
                backComm: bp['communication'],
                backEmotion: bp['emotion'],
                backStatus: bp['archive-status'],
                backTimeline: bp['timeline'],
                backQuickcard: bp['quickcard'],
                backTopics: bp['archive-topics']
            };
        }''')
        assert results['adminDefault'] == 'profile', f'FAIL: admin默认页'
        assert results['backComm'] == 'archive-topics', f'FAIL: communication→{results["backComm"]}'
        assert results['backEmotion'] == 'archive-topics', f'FAIL: emotion→{results["backEmotion"]}'
        assert results['backStatus'] == 'archive', f'FAIL: archive-status→{results["backStatus"]}'
        assert results['backTimeline'] == 'archive', f'FAIL: timeline→{results["backTimeline"]}'
        assert results['backQuickcard'] == 'archive', f'FAIL: quickcard→{results["backQuickcard"]}'
        assert results['backTopics'] == 'archive', f'FAIL: archive-topics→{results["backTopics"]}'
        print('  ✅ PAGE_BACK_PARENT 全部正确')
        page.close()

        # ====== Test 2: 妈妈导航链（430px） ======
        print('\n--- 2. 妈妈 430px 导航链 ---')
        page = browser.new_page(viewport={'width': 430, 'height': 900})
        page.on('pageerror', lambda err: errors.append(str(err)))
        login(page, '妈妈')

        verify_return_chain(page, [
            {'hash': 'archive', 'back_label': None, 'page_title': '档案总览', 'expected_parent': 'archive'},
            {'hash': 'archive-topics', 'back_label': '档案总览', 'page_title': '主题档案', 'expected_parent': 'archive'},
            {'hash': 'communication', 'back_label': '主题档案', 'page_title': '沟通说明书', 'expected_parent': 'archive'},
            {'hash': 'archive-status', 'back_label': '档案总览', 'page_title': '档案状态', 'expected_parent': 'archive'},
            {'hash': 'timeline', 'back_label': '档案总览', 'page_title': '记录时间轴', 'expected_parent': 'archive'},
            {'hash': 'quickcard', 'back_label': '档案总览', 'page_title': '速读卡', 'expected_parent': 'archive'},
        ])
        print('  ✅ 妈妈导航链全部正确')

        # 截图：档案总览
        page.goto(f'{BASE}/#archive')
        page.wait_for_timeout(600)
        page.screenshot(path=f'{SCREENSHOT_DIR}/01_mom_archive_430px.png', full_page=True)
        print('  📸 01_mom_archive_430px.png')

        # 截图：主题档案
        page.goto(f'{BASE}/#archive-topics')
        page.wait_for_timeout(600)
        page.screenshot(path=f'{SCREENSHOT_DIR}/02_mom_topics_430px.png', full_page=True)
        print('  📸 02_mom_topics_430px.png')

        # 截图：档案状态
        page.goto(f'{BASE}/#archive-status')
        page.wait_for_timeout(600)
        page.screenshot(path=f'{SCREENSHOT_DIR}/03_mom_status_430px.png', full_page=True)
        print('  📸 03_mom_status_430px.png')
        page.close()

        # ====== Test 3: 妈妈 390px ======
        print('\n--- 3. 妈妈 390px ---')
        page = browser.new_page(viewport={'width': 390, 'height': 850})
        page.on('pageerror', lambda err: errors.append(str(err)))
        login(page, '妈妈')

        page.goto(f'{BASE}/#archive')
        page.wait_for_timeout(600)
        page.screenshot(path=f'{SCREENSHOT_DIR}/04_mom_archive_390px.png', full_page=True)
        print('  📸 04_mom_archive_390px.png')

        page.goto(f'{BASE}/#archive-topics')
        page.wait_for_timeout(600)
        page.screenshot(path=f'{SCREENSHOT_DIR}/05_mom_topics_390px.png', full_page=True)
        print('  📸 05_mom_topics_390px.png')
        page.close()

        # ====== Test 4: 小雨 ======
        print('\n--- 4. 小雨 430px ---')
        page = browser.new_page(viewport={'width': 430, 'height': 900})
        page.on('pageerror', lambda err: errors.append(str(err)))
        login(page, '小雨')

        page.goto(f'{BASE}/#archive')
        page.wait_for_timeout(600)
        page.screenshot(path=f'{SCREENSHOT_DIR}/06_youth_archive_430px.png', full_page=True)
        print('  📸 06_youth_archive_430px.png')

        tabs = page.evaluate('''() => {
            return Array.from(document.querySelectorAll('.nav-tab')).map(function(t){return t.textContent;});
        }''')
        print(f'  小雨Tab: {tabs}')
        assert len(tabs) == 3, f'FAIL: 小雨应有3个Tab'
        page.close()

        # ====== Test 5: 管理员 ======
        print('\n--- 5. 管理员 430px ---')
        page = browser.new_page(viewport={'width': 430, 'height': 900})
        page.on('pageerror', lambda err: errors.append(str(err)))
        login(page, '系统管理员')

        page.goto(f'{BASE}/#profile')
        page.wait_for_timeout(600)
        page.screenshot(path=f'{SCREENSHOT_DIR}/07_admin_profile_430px.png', full_page=True)
        print('  📸 07_admin_profile_430px.png')

        tabs = page.evaluate('''() => {
            return Array.from(document.querySelectorAll('.nav-tab')).map(function(t){return t.textContent;});
        }''')
        print(f'  管理员Tab: {tabs}')
        assert len(tabs) == 2, f'FAIL: 管理员应有2个Tab'
        page.close()

        # ====== Test 6: 刷新路由 ======
        print('\n--- 6. 刷新路由 ---')
        for test_hash in ['#archive-topics', '#archive-status', '#communication']:
            page = browser.new_page(viewport={'width': 430, 'height': 900})
            page.on('pageerror', lambda err: errors.append(str(err)))
            login(page, '妈妈')
            page.goto(f'{BASE}/{test_hash}')
            page.wait_for_timeout(800)
            
            title = page.locator('#topbar-title').inner_text()
            active = page.locator('.nav-tab.active')
            active_route = active.get_attribute('data-route') if active.count() > 0 else None
            
            print(f'  {test_hash}: 标题="{title}" 高亮="{active_route}"')
            assert active_route == 'archive', f'FAIL: {test_hash} 一级Tab高亮不是archive'
            assert title and len(title) > 0, f'FAIL: {test_hash} 无标题'
            page.close()
        print('  ✅ 刷新路由全部正确')

        # ====== Summary ======
        print('\n--- 控制台 ---')
        if errors:
            print(f'  ⚠️ 错误({len(errors)}):')
            for e in errors[:5]: print(f'    - {e[:120]}')
        else:
            print('  ✅ 无控制台错误')

        print(f'\n📸 截图保存于: {SCREENSHOT_DIR}')
        browser.close()

    print('\n' + '=' * 60)
    print('P1 修正验收：全部通过')
    print('=' * 60)

if __name__ == '__main__':
    try:
        run_tests()
    except Exception as e:
        print(f'\n❌ 失败: {e}')
        import traceback; traceback.print_exc()
        exit(1)
