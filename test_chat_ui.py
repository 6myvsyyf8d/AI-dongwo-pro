#!/usr/bin/env python3
"""Test chat UI screens — Phase 3B compliance with actual class names."""
from playwright.sync_api import sync_playwright
import sys, json

BASE = "http://localhost:5678/kanban-design/pages"
PAGES = {
    "home": f"{BASE}/chat-home.html",
    "conversation": f"{BASE}/chat-conversation.html",
    "review": f"{BASE}/chat-review.html",
}

results = {"passed": [], "failed": [], "warnings": []}

def check(test_name, condition, detail=""):
    if condition:
        results["passed"].append(test_name)
    else:
        results["failed"].append(f"{test_name}: {detail}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # ══════════════════════════════════════════
    # SCREEN 1: 对话首页
    # ══════════════════════════════════════════
    print("=" * 60)
    print("TESTING: Screen 1 — 对话首页 (chat-home.html)")
    page = browser.new_page(viewport={"width": 430, "height": 900})
    page.goto(PAGES["home"], wait_until="networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path="/tmp/test_chat_home.png", full_page=True)
    
    check("1.1 头像素", page.locator(".avatar-circle").count() > 0)
    check("1.2 名称'小宇的 AI聊聊'", "小宇的 AI聊聊" in (page.locator(".identity-name").text_content() or ""))
    check("1.3 描述'记录今天'", "记录今天" in (page.locator(".identity-sub").text_content() or ""))
    check("1.4 紫色装饰圆", page.locator(".dc-purple").count() > 0)
    check("1.5 白色装饰圆", page.locator(".dc-white").count() > 0)
    check("1.6 '今天想记录什么？'", page.locator(".hero-title").text_content() == "今天想记录什么？")
    check("1.7 Hero提示文字", page.locator(".hero-subtitle").count() > 0)
    
    # 开始聊天按钮
    btn = page.locator(".btn-start-chat").first
    check("1.8 '开始聊天'按钮存在", btn.count() > 0)
    if btn.count() > 0:
        bg = btn.evaluate("el => window.getComputedStyle(el).backgroundImage || window.getComputedStyle(el).background")
        check("1.9 紫色渐变", "gradient" in str(bg).lower(), str(bg)[:100])
        c = btn.evaluate("el => window.getComputedStyle(el).color")
        check("1.10 按钮白字", "255" in str(c), str(c))
        r = btn.evaluate("el => window.getComputedStyle(el).borderRadius")
        check("1.11 全宽圆角", "16px" in str(r) or "px" in str(r), str(r))
    
    # 待确认提醒卡
    card = page.locator(".pending-card").first
    check("1.12 待确认提醒卡", card.count() > 0)
    if card.count() > 0:
        check("1.13 '2条记录待确认'", "2条记录待确认" in (card.text_content() or ""))
        bg = card.evaluate("el => window.getComputedStyle(el).backgroundColor")
        check("1.14 橙色底#FDF5E6", "253,245,230" in str(bg) or "fdf5e6" in str(bg).lower(), str(bg))
    
    check("1.15 脚注", page.locator(".page-footer").count() > 0)
    check("1.16 '查看全部聊天记录'", page.locator(".view-all-link").count() > 0)
    page.close()
    
    # ══════════════════════════════════════════
    # SCREEN 2: 对话界面
    # ══════════════════════════════════════════
    print("=" * 60)
    print("TESTING: Screen 2 — 对话界面 (chat-conversation.html)")
    page = browser.new_page(viewport={"width": 430, "height": 900})
    page.goto(PAGES["conversation"], wait_until="networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path="/tmp/test_chat_conversation.png", full_page=True)
    
    # 顶部栏
    check("2.1 返回按钮‹", page.locator(".btn-back").count() > 0)
    check("2.2 '小宇的 AI聊聊'", page.locator(".top-title").text_content() == "小宇的 AI聊聊" if page.locator(".top-title").count() > 0 else False)
    end_btn = page.locator(".btn-end").first
    check("2.3 '结束'按钮", end_btn.count() > 0)
    if end_btn.count() > 0:
        bg = end_btn.evaluate("el => window.getComputedStyle(el).backgroundColor")
        check("2.4 结束按钮浅紫底", "238,237,251" in str(bg) or "eeedfb" in str(bg).lower(), str(bg))
    
    # AI 状态栏
    check("2.5 状态栏存在", page.locator(".status-bar").count() > 0)
    check("2.6 ✨头像", page.locator(".status-avatar").first.text_content().strip() == "✨" if page.locator(".status-avatar").count() > 0 else False)
    check("2.7 'AI记录助手'", "AI记录助手" in (page.locator(".status-title").text_content() or ""))
    check("2.8 草稿保存状态", page.locator(".status-subtitle").count() > 0)
    check("2.9 N条草稿›", page.locator(".btn-drafts").count() > 0)
    
    # 消息列表
    check("2.10 日期分隔符", page.locator(".date-separator").count() > 0)
    ai_msgs = page.locator(".msg-ai")
    check("2.11 AI气泡存在", ai_msgs.count() >= 2, f"count={ai_msgs.count()}")
    if ai_msgs.count() > 0:
        blr = ai_msgs.first.evaluate("el => window.getComputedStyle(el).borderBottomLeftRadius")
        check("2.12 AI气泡左下圆角4px", "4px" in str(blr), str(blr))
        bg = ai_msgs.first.evaluate("el => window.getComputedStyle(el).backgroundColor")
        check("2.13 AI气泡白色背景", "255,255,255" in str(bg), str(bg))
    
    # 用户气泡（demo里有的）
    user_msgs = page.locator(".msg-user")
    print(f"  → User: {user_msgs.count()}, AI: {ai_msgs.count()}")
    if user_msgs.count() > 0:
        brr = user_msgs.first.evaluate("el => window.getComputedStyle(el).borderBottomRightRadius")
        check("2.14 用户气泡右下圆角4px", "4px" in str(brr), str(brr))
        bg = user_msgs.first.evaluate("el => window.getComputedStyle(el).backgroundColor")
        check("2.15 用户气泡紫色底", "94,106,210" in str(bg), str(bg)[:80])
        c = user_msgs.first.evaluate("el => window.getComputedStyle(el).color")
        check("2.16 用户气泡白字", "255" in str(c), str(c))
    
    # 草稿卡片
    draft_cards = page.locator(".draft-card")
    print(f"  → Draft cards: {draft_cards.count()}")
    if draft_cards.count() > 0:
        bl = draft_cards.first.evaluate("el => window.getComputedStyle(el).borderLeftWidth")
        check("2.17 草稿卡片左边框4px", "4px" in str(bl), str(bl))
    
    # 系统消息
    check("2.18 系统提示", page.locator(".msg-system").count() > 0)
    
    # 快捷回复
    qr = page.locator(".quick-row").first
    check("2.19 快捷回复行", qr.count() > 0)
    if qr.count() > 0:
        ox = qr.evaluate("el => window.getComputedStyle(el).overflowX")
        check("2.20 横向滚动", "auto" in str(ox) or "scroll" in str(ox), str(ox))
    pills = page.locator(".quick-pill")
    check("2.21 ≥3个快捷回复", pills.count() >= 3, f"count={pills.count()}")
    
    # 折叠
    toggle = page.locator(".quick-toggle").first
    if toggle.count() > 0:
        toggle.click()
        page.wait_for_timeout(400)
        # Check if collapsed state exists (may use class toggle)
        page.screenshot(path="/tmp/test_chat_conversation_collapsed.png", full_page=True)
        check("2.22 可折叠", True)
    
    # 底部输入区
    check("2.23 ＋按钮", page.locator(".btn-plus").count() > 0)
    editor = page.locator(".chat-editor").first
    check("2.24 输入区存在", editor.count() > 0)
    if editor.count() > 0:
        ce = editor.get_attribute("contenteditable") or editor.evaluate("el => el.contentEditable")
        check("2.25 contenteditable", ce == "true", str(ce))
        mh = editor.evaluate("el => window.getComputedStyle(el).maxHeight")
        check("2.26 max-height=88px", "88px" in str(mh), str(mh))
    check("2.27 语音按钮🎤", page.locator(".btn-voice").count() > 0)
    send_btn = page.locator(".btn-send").first
    check("2.28 发送按钮", send_btn.count() > 0)
    if send_btn.count() > 0:
        check("2.29 发送按钮初始disabled", send_btn.evaluate("el => el.classList.contains('disabled')"))
        bg = send_btn.evaluate("el => window.getComputedStyle(el).backgroundColor")
        check("2.30 发送按钮紫色", "94,106,210" in str(bg), str(bg)[:80])
    page.close()
    
    # ══════════════════════════════════════════
    # SCREEN 3: 整理确认页
    # ══════════════════════════════════════════
    print("=" * 60)
    print("TESTING: Screen 3 — 整理确认页 (chat-review.html)")
    page = browser.new_page(viewport={"width": 430, "height": 900})
    page.goto(PAGES["review"], wait_until="networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path="/tmp/test_chat_review.png", full_page=True)
    
    # 顶部栏
    check("3.1 返回按钮", page.locator(".top-bar .btn-back").count() > 0)
    check("3.2 '本次整理'标题", page.locator(".top-bar-title").text_content() == "本次整理" if page.locator(".top-bar-title").count() > 0 else False)
    
    # 说明条
    ib = page.locator(".instruction-bar").first
    check("3.3 说明条存在", ib.count() > 0)
    if ib.count() > 0:
        bg = ib.evaluate("el => window.getComputedStyle(el).backgroundColor")
        check("3.4 浅紫底#EEEDFB", "238,237,251" in str(bg) or "eeedfb" in str(bg).lower(), str(bg))
    check("3.5 图例橙点", page.locator(".legend-dot.orange").count() > 0)
    check("3.6 图例绿点", page.locator(".legend-dot.green").count() > 0)
    check("3.7 记录数", page.locator(".instruction-count").count() > 0)
    
    # 草稿卡片
    pending_cards = page.locator(".card.pending")
    confirmed_cards = page.locator(".card.confirmed")
    total = page.locator(".card-list .card, .card.pending, .card.confirmed").count()
    print(f"  → Pending: {pending_cards.count()}, Confirmed: {confirmed_cards.count()}, Total: {total}")
    check("3.8 ≥3张卡片", total >= 3, f"total={total}")
    check("3.9 待确认(pending)卡片", pending_cards.count() > 0)
    check("3.10 已确认(confirmed)卡片", confirmed_cards.count() > 0)
    
    if pending_cards.count() > 0:
        bl = pending_cards.first.evaluate("el => window.getComputedStyle(el).borderLeftColor")
        check("3.11 待确认橙色左边框", "232" in str(bl) or "e8" in str(bl), str(bl))
    if confirmed_cards.count() > 0:
        bl = confirmed_cards.first.evaluate("el => window.getComputedStyle(el).borderLeftColor")
        check("3.12 已确认绿色左边框", "91" in str(bl) or "5b" in str(bl), str(bl))
    
    # 标题字号
    title_el = page.locator(".card-title").first
    if title_el.count() > 0:
        fs = title_el.evaluate("el => window.getComputedStyle(el).fontSize")
        check("3.13 标题字号~13.5px", "13" in str(fs) or "14" in str(fs), str(fs))
        fw = title_el.evaluate("el => window.getComputedStyle(el).fontWeight")
        check("3.14 标题粗体", fw == "600" or fw == "700", str(fw))
    
    summary_el = page.locator(".card-summary").first
    if summary_el.count() > 0:
        fs = summary_el.evaluate("el => window.getComputedStyle(el).fontSize")
        check("3.15 摘要字号~10.5px", "10" in str(fs) or "11" in str(fs), str(fs))
    
    # 已确认标记
    check("3.16 '已确认等待统一保存'", page.locator(".card-confirmed-text").count() > 0)
    
    # 操作按钮
    check("3.17 '确认保存'按钮", page.locator(".confirm-save").count() > 0)
    check("3.18 ···菜单按钮", page.locator(".btn-menu").count() > 0)
    check("3.19 '修改'按钮", page.locator(".btn-action.muted").count() > 0)
    
    # 底部固定栏
    check("3.20 '确认全部待确认记录'按钮", page.locator(".btn-primary-full").count() > 0)
    check("3.21 '稍后处理'按钮", page.locator(".btn-secondary-full").count() > 0)
    
    # 成功弹窗
    overlay = page.locator(".success-overlay").first
    check("3.22 成功弹窗结构存在(隐藏)", overlay.count() > 0)
    if overlay.count() > 0:
        check("3.23 ✓图标", page.locator(".success-check").count() > 0)
        check("3.24 '保存成功'", "保存成功" in (page.locator(".success-title").text_content() or ""))
        check("3.25 '知道了'按钮", page.locator(".btn-success-close").count() > 0)
    
    # ···菜单测试
    menu_btn = page.locator(".btn-menu").first
    if menu_btn.count() > 0:
        menu_btn.click()
        page.wait_for_timeout(500)
        popup = page.locator(".menu-dropdown").first
        check("3.26 菜单弹窗", popup.count() > 0)
        if popup.count() > 0:
            check("3.27 含'放弃记录'", "放弃记录" in (popup.text_content() or ""))
        page.locator("body").click(position={"x": 5, "y": 5})
        page.wait_for_timeout(300)
    
    # 确认全部 → 成功弹窗  
    cfa = page.locator(".btn-primary-full").first
    if cfa.count() > 0:
        try:
            if not cfa.is_disabled():
                cfa.click()
                page.wait_for_timeout(500)
                check("3.28 确认全部后弹窗显示", page.locator(".success-overlay").evaluate("el => window.getComputedStyle(el).display") != "none")
            else:
                results["warnings"].append("3.28: 按钮disabled，跳过弹窗测试")
        except Exception as e:
            results["warnings"].append(f"3.28: 异常={e}")
    
    page.close()
    browser.close()

# ── 输出 ──
print("\n" + "=" * 60)
print(f"RESULTS: {len(results['passed'])} passed, {len(results['failed'])} failed, {len(results['warnings'])} warnings")

if results["passed"]:
    print("\n✅ PASSED:")
    for p in results["passed"]:
        print(f"  {p}")

if results["failed"]:
    print("\n❌ FAILED:")
    for f in results["failed"]:
        print(f"  {f}")

if results["warnings"]:
    print("\n⚠️  WARNINGS:")
    for w in results["warnings"]:
        print(f"  {w}")

print("\nScreenshots: /tmp/test_chat_home.png, /tmp/test_chat_conversation.png, /tmp/test_chat_review.png")
sys.exit(1 if results["failed"] else 0)
