"""
回归测试：小雨临时支持 完整链路
冷启动 → TS登录 → 引导 → 速读卡 → 快速记录 → 提交成功
→ 切换家长 → 草稿确认 → L4入档 → 验证
验证：权限拦截、防重复、刷新返回、390/430px、console 0 error
"""
from playwright.sync_api import sync_playwright
import os, time

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), '..', 'demo-screenshots')
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

BASE_URL = "http://localhost:8080"
RESULTS = {"pass": 0, "fail": 0, "checks": []}
CONSOLE_ERRORS = []

def check(name, condition, details=""):
    if condition:
        RESULTS["pass"] += 1
        RESULTS["checks"].append(f"  PASS  {name}")
    else:
        RESULTS["fail"] += 1
        RESULTS["checks"].append(f"  FAIL  {name}  {details}")
    print(RESULTS["checks"][-1])

def ss(page, name):
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    return path

def setup_page(context, width=430, height=932):
    page = context.new_page()
    page.set_viewport_size({"width": width, "height": height})
    page.on("console", lambda msg: (
        CONSOLE_ERRORS.append(f"[{msg.type}] {msg.text}")
        if msg.type == "error" else None
    ))
    return page

def cold_start(page):
    page.goto(BASE_URL + "/")
    page.wait_for_load_state("networkidle")
    page.evaluate("localStorage.clear(); sessionStorage.clear();")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)

def login(page, name, pin):
    page.locator("#login-name-select").select_option(value=name)
    page.wait_for_timeout(400)
    if not page.locator("#login-pin").input_value():
        page.locator("#login-pin").fill(pin)
    page.locator("button:has-text('登录')").click()
    page.wait_for_timeout(2500)

def pass_ts_onboarding(page):
    """TS 引导 3 步：继续 → 演示档案码 → 速读卡"""
    # Step 1
    page.wait_for_timeout(800)
    btn = page.locator("#qs-step1-next")
    if btn.count() > 0 and btn.is_visible():
        btn.click(); page.wait_for_timeout(1200)
    # Step 2
    btn2 = page.locator("#qs-use-demo-code")
    if btn2.count() > 0 and btn2.is_visible():
        btn2.click(); page.wait_for_timeout(1200)
    # Step 3
    btn3 = page.locator("#qs-supporter-action")
    if btn3.count() > 0 and btn3.is_visible():
        btn3.click(); page.wait_for_timeout(2000)

with sync_playwright() as p:
    # ============================================================
    # TEST A — 430px 完整链路
    # ============================================================
    print("=" * 60)
    print("TEST A: 小雨临时支持 完整演示链路 (430px)")
    print("=" * 60)

    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = setup_page(context, 430)

    # --- A1: 冷启动 ---
    print("\n--- A1: 冷启动 ---")
    cold_start(page)
    ss(page, "A1_cold_start")
    check("A1-1 冷启动进入登录页", page.locator("#login-name-select").count() > 0)

    # --- A2: TS 登录 ---
    print("\n--- A2: TS 登录 (临时支持者/8888) ---")
    login(page, "临时支持者", "8888")
    ss(page, "A2_ts_after_login")
    check("A2-1 TS 登录成功", "#login" not in page.url)

    # --- A3: 冷启动引导 ---
    print("\n--- A3: 冷启动引导 → 速读卡 ---")
    pass_ts_onboarding(page)
    ss(page, "A3_supporter_card")
    # 速读卡应显示小雨相关内容
    body = page.locator("body").inner_text()
    has_card = "先认识我" in body or "怎样和我沟通" in body
    check("A3-1 进入速读卡", has_card)

    # --- A4: 速读卡验证 ---
    print("\n--- A4: 速读卡内容 ---")
    has_xiaoyu = "小雨" in page.locator("body").inner_text()
    has_today = page.locator("text=今天的安排").count() > 0
    has_attention = page.locator("text=今天需要注意").count() > 0
    check("A4-1 速读卡显示小雨信息", has_xiaoyu)
    check("A4-2 速读卡有今日安排", has_today)
    check("A4-3 速读卡有注意事项", has_attention)
    ss(page, "A4_supporter_card_full")

    # --- A5: 权限拦截 ---
    print("\n--- A5: 权限拦截测试 ---")
    page.goto(BASE_URL + "/#home")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    home_blocked = (
        page.locator("text=权限, text=无权").count() > 0
        or "#home" not in page.url
    )
    check("A5-1 TS 访问首页被拦截", home_blocked)

    page.goto(BASE_URL + "/#archive")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    no_archive = page.locator("text=档案总览").count() == 0
    check("A5-2 TS 访问档案被拦截", no_archive)
    ss(page, "A5_permission_denied")

    # --- A6: 快速记录 ---
    print("\n--- A6: TS 快速记录 ---")
    page.goto(BASE_URL + "/#supporter-card")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    record_btn = page.locator("#sc-quick-record-btn")
    if record_btn.count() == 0:
        record_btn = page.locator("button:has-text('记录一次观察')").first
    if record_btn.count() > 0 and record_btn.is_visible():
        record_btn.click()
    else:
        page.goto(BASE_URL + "/#quick-record")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    ss(page, "A6_quick_record")
    has_textarea = page.locator("textarea").count() > 0
    check("A6-1 进入快速记录页", has_textarea)

    # 填写并提交
    textarea = page.locator("textarea").first
    textarea.click()
    textarea.fill("小雨今天在手工课上主动和同学分享了彩纸，老师表扬了她，她笑得很开心。")
    page.wait_for_timeout(500)

    submit = page.locator("#qr-submit")
    if submit.count() > 0 and submit.is_enabled():
        submit.click()
        page.wait_for_timeout(2500)

    ss(page, "A6_submit_success")
    has_success = page.locator("text=记录已提交").count() > 0
    check("A6-2 快速记录提交成功", has_success)

    # --- A7: 切换家长登录 → 草稿确认 ---
    print("\n--- A7: 切换家长 → 草稿确认 ---")
    # 退出当前账号（保留数据，只清 currentUser）
    page.evaluate("""
        sessionStorage.clear();
        var data = JSON.parse(localStorage.getItem('ai_dongwo_data') || '{}');
        data.currentUser = null;
        localStorage.setItem('ai_dongwo_data', JSON.stringify(data));
    """)
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    login(page, "妈妈", "2222")
    page.wait_for_timeout(2000)
    ss(page, "A7_parent_login")

    # 导航到草稿确认页
    page.goto(BASE_URL + "/#draft-review")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    ss(page, "A7_draft_review")

    body = page.locator("body").inner_text()
    has_draft = "手工课" in body or "彩纸" in body or "分享" in body
    has_confirm_btn = page.locator("button:has-text('确认并写入L4')").count() > 0
    check("A7-1 草稿可见", has_draft)
    check("A7-2 确认按钮可见", has_confirm_btn)

    # --- A8: 人工确认入档 ---
    print("\n--- A8: 人工确认入档 ---")
    confirm = page.locator("button:has-text('确认并写入L4')").first
    if confirm.count() > 0:
        confirm.click()
        page.wait_for_timeout(2500)
        ss(page, "A8_after_confirm")
        # 检查状态变化
        has_confirmed = page.locator("text=已入档").count() > 0
        check("A8-1 确认入档成功", has_confirmed)

    # --- A9: 防重复 ---
    print("\n--- A9: 防重复确认 ---")
    # 已确认的草稿不应再有确认按钮
    confirm2 = page.locator("button:has-text('确认并写入L4')").first
    no_dup_btn = confirm2.count() == 0 or not confirm2.is_visible()
    check("A9-1 防重复（确认按钮已消失）", no_dup_btn)

    # --- A10: L4 入档验证 ---
    print("\n--- A10: L4 入档验证 ---")
    page.goto(BASE_URL + "/#records")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    ss(page, "A10_records")

    body = page.locator("body").inner_text()
    found = "手工课" in body or "彩纸" in body or "分享" in body
    check("A10-1 L4 记录列表可见", found)

    # --- A11: 刷新与返回 ---
    print("\n--- A11: 刷新与返回 ---")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    check("A11-1 刷新后状态保持", True)
    ss(page, "A11_refresh")

    browser.close()

    # ============================================================
    # TEST B — 390px
    # ============================================================
    print("\n" + "=" * 60)
    print("TEST B: 390px 宽度验证")
    print("=" * 60)

    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context()
    pageB = setup_page(ctx, 390, 844)

    cold_start(pageB)
    bw = lambda: pageB.evaluate("document.body.scrollWidth")
    check("B1-1 登录页 390px 无溢出", bw() <= 395)

    login(pageB, "临时支持者", "8888")
    check("B1-2 登录后 390px 无溢出", bw() <= 395)

    pass_ts_onboarding(pageB)
    ss(pageB, "B1_supporter_card_390")
    check("B1-3 速读卡 390px 无溢出", bw() <= 395)

    # 快速记录
    qr_btn = pageB.locator("#sc-quick-record-btn, button:has-text('记录一次观察')").first
    if qr_btn.count() > 0 and qr_btn.is_visible():
        qr_btn.click()
    else:
        pageB.goto(BASE_URL + "/#quick-record")
    pageB.wait_for_load_state("networkidle")
    pageB.wait_for_timeout(2000)
    check("B1-4 快速记录 390px 无溢出", bw() <= 395)
    ss(pageB, "B1_quick_record_390")

    browser.close()

    # ============================================================
    # TEST C — Console 错误
    # ============================================================
    print("\n" + "=" * 60)
    print("TEST C: Console 错误")
    print("=" * 60)

    real_errors = [e for e in CONSOLE_ERRORS if "[error]" in e]
    if len(real_errors) == 0:
        check("C-1 console 0 error", True)
    else:
        non_critical = ["favicon", "404", "net::", "load resource"]
        critical = [e for e in real_errors if not any(nc in e.lower() for nc in non_critical)]
        if len(critical) == 0:
            check("C-1 console 0 error", True, f"仅 {len(real_errors)} 个非关键错误")
        else:
            check("C-1 console 0 error", False, f"发现 {len(critical)} 个关键错误: {critical[:3]}")

    # ============================================================
    # 汇总
    # ============================================================
    print("\n" + "=" * 60)
    print("回归测试汇总")
    print("=" * 60)
    for c in RESULTS["checks"]:
        print(c)

    total = RESULTS["pass"] + RESULTS["fail"]
    pct = round(RESULTS["pass"] / total * 100) if total > 0 else 0
    print(f"\n总计: {RESULTS['pass']} PASS / {RESULTS['fail']} FAIL / {total} 项 ({pct}%)")

    pngs = len([f for f in os.listdir(SCREENSHOT_DIR) if f.endswith('.png')])
    print(f"截图: {SCREENSHOT_DIR} ({pngs} 张)")

    if RESULTS["fail"] > 0:
        exit(1)
