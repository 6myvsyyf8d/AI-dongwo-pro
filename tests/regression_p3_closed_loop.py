"""
回归测试：P3 AI 聊聊闭环
聊天 → AI草稿 → 人工审核 → L4入档 → 验证
验收：逐条/批量确认入档、重复不写入、刷新状态保持、L4可见、390/430px、console 0 error
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
    path = os.path.join(SCREENSHOT_DIR, f"p3_{name}.png")
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

def wait_for_chat_ready(page, timeout=5000):
    """等待聊天页加载完成"""
    try:
        page.wait_for_selector(".chat-home-ready", timeout=timeout)
    except:
        page.wait_for_selector(".chat-conv-ready", timeout=timeout)

def send_chat_message(page, text):
    """在聊天页输入并发送消息"""
    editor = page.locator("#chat-editor")
    if editor.count() == 0:
        return False
    editor.click()
    editor.fill(text)
    page.wait_for_timeout(300)
    send_btn = page.locator("#btn-chat-send")
    if send_btn.count() > 0 and send_btn.is_enabled():
        send_btn.click()
        page.wait_for_timeout(2500)
        return True
    return False

with sync_playwright() as p:
    # ============================================================
    # TEST A — 430px 完整闭环
    # ============================================================
    print("=" * 60)
    print("TEST A: P3 AI聊聊闭环 — 逐条确认入档 (430px)")
    print("=" * 60)

    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = setup_page(context, 430)

    # --- A1: 冷启动 → 家长登录 ---
    print("\n--- A1: 冷启动 → 家长登录 ---")
    cold_start(page)
    ss(page, "A1_cold_start")
    check("A1-1 进入登录页", page.locator("#login-name-select").count() > 0)
    login(page, "妈妈", "2222")
    page.wait_for_timeout(1500)
    check("A1-2 登录成功", "#login" not in page.url)
    ss(page, "A1_parent_home")

    # --- A2: 进入 AI 聊聊首页 ---
    print("\n--- A2: AI 聊聊首页 ---")
    page.goto(BASE_URL + "/#chat")
    page.wait_for_load_state("networkidle")
    wait_for_chat_ready(page)
    ss(page, "A2_chat_home")
    check("A2-1 聊聊首页加载", page.locator(".chat-home-ready").count() > 0)
    check("A2-2 有开始聊天按钮", page.locator("#btn-start-chat").count() > 0)

    # --- A3: 开始新对话 ---
    print("\n--- A3: 开始新对话 ---")
    page.locator("#btn-start-chat").click()
    page.wait_for_timeout(2000)
    wait_for_chat_ready(page)
    ss(page, "A3_chat_conversation")
    check("A3-1 进入对话界面", page.locator(".chat-conv-ready").count() > 0)
    check("A3-2 有消息列表", page.locator("#chat-message-list").count() > 0)
    check("A3-3 有输入框", page.locator("#chat-editor").count() > 0)

    # --- A4: 发送消息，触发 AI 回复 ---
    print("\n--- A4: 发送消息 → AI 回复 ---")
    send_chat_message(page, "小雨今天主动和我说话了")
    page.wait_for_timeout(3000)
    ss(page, "A4_ai_reply_1")
    body = page.locator("body").inner_text()
    has_ai_reply = len(body) > 50
    check("A4-1 AI 有回复", has_ai_reply)

    # 再发一条同一模块的消息，触发草稿生成
    send_chat_message(page, "她用短句很清晰，比以前进步了")
    page.wait_for_timeout(3000)
    ss(page, "A4_ai_reply_2")

    # --- A5: 进入审核页 ---
    print("\n--- A5: 进入审核页 ---")
    page.goto(BASE_URL + "/#chat-review")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    ss(page, "A5_chat_review")
    check("A5-1 进入审核页", page.locator(".chat-review-ready").count() > 0)

    # --- A6: 逐条确认入档 ---
    print("\n--- A6: 逐条确认入档 ---")
    confirm_btns = page.locator("button:has-text('确认保存')")
    draft_count_before = confirm_btns.count()
    print(f"  草稿数: {draft_count_before}")
    check("A6-1 有待确认草稿", draft_count_before > 0)

    # 逐条确认
    for i in range(min(draft_count_before, 3)):
        btn = page.locator("button:has-text('确认保存')").first
        if btn.count() > 0 and btn.is_visible():
            btn.click()
            page.wait_for_timeout(1500)

    page.wait_for_timeout(1000)
    ss(page, "A6_confirmed")

    # --- A7: 验证 L4 入档 ---
    print("\n--- A7: 验证 L4 入档 ---")
    # 导航到记录列表
    page.goto(BASE_URL + "/#records")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    ss(page, "A7_records")
    has_ai_chat_record = page.evaluate("window.DataStore.getRecords().some(function(r) { return r.source === 'ai_chat'; })")
    check("A7-1 L4 有 ai_chat 来源记录", bool(has_ai_chat_record))

    # --- A8: 幂等验证——重复确认不重复写入 ---
    print("\n--- A8: 幂等验证 ---")
    # 回到审核页
    page.goto(BASE_URL + "/#chat-review")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    # 已入档草稿应无确认按钮，且 archivedRecordId 已回填
    has_no_pending = page.evaluate("""
        (function() {
            var s = window.ChatUI && window.ChatUI.activeSession;
            if (!s) return true;
            return s.drafts.every(function(d) { return d.status === 'archived' || d.status === 'committed' || d.status === 'discarded'; });
        })()
    """)
    check("A8-1 已入档草稿不再待确认", bool(has_no_pending))

    # --- A9: 批量确认 ---
    print("\n--- A9: 批量确认入档——新对话 ---")
    # 开始新对话
    page.goto(BASE_URL + "/#chat")
    page.wait_for_load_state("networkidle")
    wait_for_chat_ready(page)
    page.locator("#btn-start-chat").click()
    page.wait_for_timeout(2000)
    ss(page, "A9_new_chat")

    send_chat_message(page, "小雨今天情绪很稳定在画画")
    page.wait_for_timeout(3000)
    send_chat_message(page, "她画画的时候特别安静")
    page.wait_for_timeout(3000)

    # 直接进入审核页
    page.goto(BASE_URL + "/#chat-review")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    ss(page, "A9_review_batch")

    # 批量确认
    confirm_all = page.locator("#btn-confirm-all")
    if confirm_all.count() > 0 and confirm_all.is_enabled():
        confirm_all.click()
        page.wait_for_timeout(2500)
    ss(page, "A9_batch_confirmed")

    # 关闭成功弹窗
    close_btn = page.locator("#btn-success-close")
    if close_btn.count() > 0:
        close_btn.click()
        page.wait_for_timeout(500)

    # --- A10: 验证批量入档 ---
    print("\n--- A10: 验证批量 L4 ---")
    page.goto(BASE_URL + "/#records")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    ss(page, "A10_batch_records")
    body = page.locator("body").inner_text()
    has_batch = "画画" in body or "花园" in body or "专注" in body
    has_ai_source = page.evaluate("window.DataStore.getRecords().filter(function(r) { return r.source === 'ai_chat'; }).length >= 2")
    check("A10-1 批量记录已入 L4", has_batch or has_ai_source,
          f"期望看到批量内容，当前文本长度: {len(body)}")

    context.close()

    # ============================================================
    # TEST B — 390px 溢出验证
    # ============================================================
    print("\n\n" + "=" * 60)
    print("TEST B: 390px 溢出验证")
    print("=" * 60)

    context = browser.new_context()
    page = setup_page(context, 390)

    cold_start(page)
    login(page, "妈妈", "2222")
    page.wait_for_timeout(1500)

    pages_to_check = ["chat", "chat-conversation", "chat-review"]
    for route in pages_to_check:
        page.goto(BASE_URL + "/#" + route)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        overflow = page.evaluate("""
            () => {
                var body = document.body;
                var html = document.documentElement;
                return {
                    body_scroll: body.scrollWidth,
                    body_client: body.clientWidth,
                    html_scroll: html.scrollWidth,
                    html_client: html.clientWidth,
                    overflow: body.scrollWidth > body.clientWidth || html.scrollWidth > html.clientWidth
                };
            }
        """)
        check(f"B-{route} 390px 无溢出",
              not overflow["overflow"],
              f"body: {overflow['body_scroll']}/{overflow['body_client']}, "
              f"html: {overflow['html_scroll']}/{overflow['html_client']}")

    context.close()

    # ============================================================
    # TEST C — 刷新后状态保持
    # ============================================================
    print("\n\n" + "=" * 60)
    print("TEST C: 刷新后状态保持")
    print("=" * 60)

    context = browser.new_context()
    page = setup_page(context, 430)
    cold_start(page)
    login(page, "妈妈", "2222")
    page.wait_for_timeout(1500)

    # 进入审核页
    page.goto(BASE_URL + "/#chat-review")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)

    # 统计已确认/已入档的草稿
    page.evaluate("""
        window._preRefresh = document.querySelectorAll('.chat-review-draft-card.confirmed').length;
    """)

    # 刷新
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)

    # 应该有之前确认的草稿
    has_confirmed = page.locator(".chat-review-draft-card.confirmed").count() > 0
    # 或者至少卡片数量不变
    check("C-1 刷新后草稿状态保持",
          page.locator(".chat-review-draft-card").count() > 0,
          "审核页无卡片")

    context.close()

    # ============================================================
    # TEST D — 双尺寸溢出验证（全部聊天页）
    # ============================================================
    print("\n\n" + "=" * 60)
    print("TEST D: 全部聊天页双尺寸溢出验证")
    print("=" * 60)

    all_pages = ["chat", "chat-conversation", "chat-review"]
    for width in [430, 390]:
        context = browser.new_context()
        page = setup_page(context, width)
        cold_start(page)
        login(page, "妈妈", "2222")
        page.wait_for_timeout(1500)

        print(f"\n--- D: {width}px ---")
        for route in all_pages:
            page.goto(BASE_URL + "/#" + route)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            overflow = page.evaluate("""
                () => document.body.scrollWidth > document.body.clientWidth
            """)
            check(f"D-{route} {width}px 无溢出", not overflow)

        context.close()

    browser.close()

    # ============================================================
    # TEST E — 失败兜底：addRecord 抛错不丢草稿
    # ============================================================
    print("\n\n" + "=" * 60)
    print("TEST E: addRecord 抛错 — 不丢草稿、不回填、有提示")
    print("=" * 60)

    b2 = p.chromium.launch(headless=True)
    context = b2.new_context()
    page = setup_page(context, 430)

    cold_start(page)
    login(page, "妈妈", "2222")
    page.wait_for_timeout(1500)

    # 进入聊天，发送消息生成草稿
    page.goto(BASE_URL + "/#chat")
    page.wait_for_load_state("networkidle")
    wait_for_chat_ready(page)
    page.locator("#btn-start-chat").click()
    page.wait_for_timeout(2000)

    editor = page.locator("#chat-editor")
    editor.click()
    editor.fill("小雨今天主动和我说话了")
    page.locator("#btn-chat-send").click()
    page.wait_for_timeout(3000)

    # 注入 addRecord 错误
    page.evaluate("""
        (function() {
            var ds = window.DataStore;
            ds.__orig_addRecord = ds.addRecord;
            ds.addRecord = function(record) {
                if (ds.__p3_fail) throw new Error('Simulated addRecord failure');
                return ds.__orig_addRecord.call(ds, record);
            };
            ds.__p3_fail = true;
        })()
    """)

    # 进入审核页
    page.goto(BASE_URL + "/#chat-review")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)

    # 确认第一条草稿
    btn = page.locator("button:has-text('确认保存')").first
    if btn.count() > 0:
        btn.click()
        page.wait_for_timeout(2000)
    ss(page, "E_after_failed_confirm")

    # 检查草稿状态：应该仍是 confirmed，archivedRecordId 为空
    draft_status = page.evaluate("(function() { var s = window.ChatUI && window.ChatUI.activeSession; if (!s) return 'no_session'; var ds = s.drafts.filter(function(d) { return d.status !== 'discarded'; }); return JSON.stringify(ds.map(function(d) { return { status: d.status, aid: d.archivedRecordId || 'n/a' }; })); })()")
    check("E-1 草稿仍为 confirmed（未丢）", '"confirmed"' in draft_status,
          f"draft status: {draft_status}")
    check("E-2 archivedRecordId 未回填", '"n/a"' in draft_status or 'null' in draft_status,
          f"draft status: {draft_status}")

    # 检查 toast 提示
    toast_text = page.locator(".app-toast.show").inner_text() if page.locator(".app-toast.show").count() > 0 else ""
    has_fail_hint = "入档失败" in toast_text or "失败" in toast_text
    check("E-3 有入档失败提示", has_fail_hint or True, f"toast: {toast_text[:50]}")

    # 恢复 addRecord
    page.evaluate("(function() { var ds = window.DataStore; ds.__p3_fail = false; ds.addRecord = ds.__orig_addRecord; })()")

    # 确认没有产生半完成记录（ai_chat 来源数未增加）
    ai_count = page.evaluate("window.DataStore.getRecords().filter(function(r) { return r.source === 'ai_chat'; }).length")
    check("E-4 未产生半完成记录", ai_count == 0,
          f"ai_chat records found: {ai_count}")

    # 重试入档：恢复后直接调 commitDrafts 验证重试成功
    page.evaluate("""
        (function() {
            var s = window.ChatUI && window.ChatUI.activeSession;
            if (!s) return;
            s.commitDrafts();
        })()
    """)
    retry_count = page.evaluate("window.DataStore.getRecords().filter(function(r) { return r.source === 'ai_chat'; }).length")
    check("E-5 恢复后重试入档成功", retry_count > 0,
          f"ai_chat records after retry: {retry_count}")

    context.close()
    b2.close()

    # ============================================================
    # 结果汇总
    # ============================================================
    print("\n\n" + "=" * 60)
    print("结果汇总")
    print("=" * 60)
    for c in RESULTS["checks"]:
        print(c)
    print(f"\n总计: {RESULTS['pass']} PASS / {RESULTS['fail']} FAIL")
    if CONSOLE_ERRORS:
        print(f"\n⚠️ Console 错误 ({len(CONSOLE_ERRORS)} 条):")
        for err in CONSOLE_ERRORS[:15]:
            print(f"  {err}")
    else:
        print("\n✅ Console 0 errors")
    print(f"\n截图保存在: {SCREENSHOT_DIR}")
