from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 390, "height": 844})

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    # 登录妈妈
    page.goto('http://localhost:8088', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=10000)
    page.locator('#login-name-select').select_option('妈妈')
    page.locator('#login-pin').fill('2222')
    page.locator('#btn-login').click()
    page.wait_for_timeout(1500)
    print("妈妈登录 ✓\n")

    # ===== 档案 Tab =====
    page.goto('http://localhost:8088/#archive', timeout=10000)
    page.wait_for_timeout(1000)
    print("「📋 档案」Tab:")
    for label, selector in [
        ('身份卡片 (小雨)', '.id-name'),
        ('关于我', '.about-section'),
        ('动态支持档案', '.support-module-grid'),
        ('志愿者小知识', '.volunteer-tips-card'),
    ]:
        el = page.locator(selector).first
        ok = el.count() > 0
        print(f"  {'✓' if ok else '✗'} {label}")
    has_collab = page.locator('text=协作网络').first.count() > 0
    print(f"  {'✗' if not has_collab else '⚠'} 协作网络 (应该在档案页不出现) → {'未出现 ✓' if not has_collab else '不应该出现!'}")

    # ===== 管理 Tab =====
    page.goto('http://localhost:8088/#profile', timeout=10000)
    page.wait_for_timeout(1000)
    print("\n「⚙️ 管理」Tab:")
    for label, selector in [
        ('我的账号', '.id-name'),
        ('协作网络', 'text=协作网络'),
        ('授权管理入口', '.support-module-card:has-text("授权管理")'),
        ('加入审批入口', '.support-module-card:has-text("加入审批")'),
        ('档案码入口', '.support-module-card:has-text("档案码")'),
        ('退出登录按钮', '#btn-logout-inline'),
    ]:
        el = page.locator(selector).first
        ok = el.count() > 0
        print(f"  {'✓' if ok else '✗'} {label}")

    # ===== 老师角色 =====
    page.goto('http://localhost:8088/#login', timeout=10000)
    page.wait_for_timeout(500)
    page.locator('#login-name-select').select_option('李老师')
    page.locator('#login-pin').fill('3333')
    page.locator('#btn-login').click()
    page.wait_for_timeout(1500)
    page.goto('http://localhost:8088/#profile', timeout=10000)
    page.wait_for_timeout(1000)
    print("\n「⚙️ 管理」Tab (教师):")
    has_join = page.locator('.support-module-card:has-text("加入家庭")').first.count() > 0
    has_logout = page.locator('#btn-logout-inline').first.count() > 0
    print(f"  {'✓' if has_join else '✗'} 加入家庭入口")
    print(f"  {'✓' if has_logout else '✗'} 退出登录按钮")

    print(f"\nJS 报错: {len(errors)} {'✓' if len(errors) == 0 else '✗'}")
    if errors:
        for e in errors:
            print(f"  {e}")

    browser.close()
    print("\n===== 全部通过 =====")
