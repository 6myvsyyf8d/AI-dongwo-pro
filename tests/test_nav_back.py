"""
导航返回回归测试：三个核心场景
================================
  场景1: 连续应用内返回 (A→B→C→D → D→C→B→A)
  场景2: 浏览器后退键交替
  场景3: 二级页刷新后返回（sessionStorage 持久化）

运行: python3 tests/test_nav_back.py
依赖: Playwright, 本地服务器 http://localhost:3000
"""
from playwright.sync_api import sync_playwright
import sys, time

BASE = "http://localhost:3000"
PASS, FAIL = "✓", "✗"
results = []

def check(msg, condition):
    status = PASS if condition else FAIL
    results.append((status, msg))
    print(f"  {status} {msg}")

def new_context(browser):
    ctx = browser.new_context(viewport={'width': 430, 'height': 932})
    page = ctx.new_page()
    page.goto(BASE)
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    return ctx, page

def login(page):
    try:
        page.select_option('#login-name-select', value='妈妈')
        time.sleep(0.5)
        page.locator('#login-pin').fill('2222')
        time.sleep(0.3)
        page.locator('#btn-login').click()
        time.sleep(2)
        page.wait_for_load_state('networkidle')
        time.sleep(0.5)
        return 'mode-app' in (page.locator('body').get_attribute('class') or '')
    except:
        return False

def H(page):
    return page.evaluate("window.location.hash.replace('#', '')")

def nav_stack(page):
    return page.evaluate("JSON.parse(sessionStorage.getItem('ai_dongwo_nav_history') || '[]')")

def topbar_back_visible(page):
    return page.evaluate("document.getElementById('topbar-back').style.display") != 'none'

def click_nav(page, route):
    page.locator(f'.nav-tab[data-route="{route}"]').click()
    time.sleep(0.8)
    page.wait_for_load_state('networkidle')
    time.sleep(0.3)

def click_back(page):
    if topbar_back_visible(page):
        page.locator('#topbar-back').click()
    time.sleep(0.8)
    page.wait_for_load_state('networkidle')
    time.sleep(0.3)

def click_subnav(page, h):
    page.locator(f'.sub-nav-tab[data-hash="{h}"]').first.click()
    time.sleep(0.8)
    page.wait_for_load_state('networkidle')
    time.sleep(0.3)

def go_hash(page, h):
    page.evaluate(f"window.location.hash = '{h}'")
    time.sleep(0.8)
    page.wait_for_load_state('networkidle')
    time.sleep(0.3)

def browser_back(page):
    page.go_back()
    time.sleep(0.8)
    page.wait_for_load_state('networkidle')
    time.sleep(0.3)

def browser_forward(page):
    page.go_forward()
    time.sleep(0.8)
    page.wait_for_load_state('networkidle')
    time.sleep(0.3)


# ====== 场景1: 连续应用内返回 ======
def test_scenario_1(browser):
    """home → archive → timeline → records → 返回×3"""
    print("\n📋 场景1: 连续应用内返回")
    ctx, page = new_context(browser)
    check("S1 登录", login(page))
    check("起点 home", H(page) == 'home')

    click_nav(page, 'archive')
    check("home→archive", H(page) == 'archive')
    print(f"    栈: {nav_stack(page)}")

    click_subnav(page, 'timeline')
    check("archive→timeline", H(page) == 'timeline')
    print(f"    栈: {nav_stack(page)}")

    go_hash(page, 'records')
    check("timeline→records", H(page) == 'records')
    print(f"    栈: {nav_stack(page)}")

    click_back(page)
    check("返回1: records→timeline", H(page) == 'timeline')
    print(f"    栈: {nav_stack(page)}")

    click_back(page)
    check("返回2: timeline→archive", H(page) == 'archive')
    print(f"    栈: {nav_stack(page)}")

    check("archive 返回按钮隐藏", not topbar_back_visible(page))
    print(f"    栈: {nav_stack(page)}")

    ctx.close()


# ====== 场景2: 浏览器后退键交替 ======
def test_scenario_2(browser):
    """home→archive→timeline → 后退→archive → charts → 后退×2"""
    print("\n📋 场景2: 浏览器后退键交替")
    ctx, page = new_context(browser)
    check("S2 登录", login(page))
    check("起点 home", H(page) == 'home')

    click_nav(page, 'archive')
    check("home→archive", H(page) == 'archive')
    click_subnav(page, 'timeline')
    check("archive→timeline", H(page) == 'timeline')

    browser_back(page)
    check("后退→archive", H(page) == 'archive')

    click_nav(page, 'charts')
    check("archive→charts", H(page) == 'charts')

    browser_back(page)
    check("后退→archive", H(page) == 'archive')
    browser_back(page)
    check("后退→home", H(page) == 'home')

    ctx.close()


# ====== 场景3: 二级页刷新后返回 ======
def test_scenario_3(browser):
    """home→archive→timeline → 刷新 → 返回→archive"""
    print("\n📋 场景3: 二级页刷新后返回")
    ctx, page = new_context(browser)
    check("S3 登录", login(page))
    check("起点 home", H(page) == 'home')

    click_nav(page, 'archive')
    check("home→archive", H(page) == 'archive')
    click_subnav(page, 'timeline')
    check("archive→timeline", H(page) == 'timeline')
    print(f"    刷新前栈: {nav_stack(page)}")

    page.reload()
    time.sleep(2)
    page.wait_for_load_state('networkidle')
    time.sleep(0.5)
    check("刷新后在 timeline", H(page) == 'timeline')
    print(f"    刷新后栈: {nav_stack(page)}")
    check("导航栈持久化", nav_stack(page) == ['home', 'archive'])

    click_back(page)
    check("返回→archive", H(page) == 'archive')
    print(f"    返回后栈: {nav_stack(page)}")

    ctx.close()


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)

        test_scenario_1(browser)
        test_scenario_2(browser)
        test_scenario_3(browser)

        browser.close()

    print("\n" + "=" * 50)
    print("导航返回 测试汇总")
    print("=" * 50)
    passed = sum(1 for s, _ in results if s == PASS)
    failed = sum(1 for s, _ in results if s == FAIL)
    for s, m in results:
        print(f"  {s} {m}")
    print(f"\n通过: {passed}  失败: {failed}  总计: {len(results)}")

    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
