"""
P1阶段一验收测试：档案基础骨架
直接验证 JS 数据结构 + DOM 渲染
"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:12345'

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 430, 'height': 900})
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))

        # 导航到首页触发所有脚本加载
        page.goto(f'{BASE}/#login')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)

        print('=' * 50)
        print('P1 阶段一验收测试')
        print('=' * 50)

        # ========== 1. JS 数据结构检查 ==========
        print('\n--- JS 数据结构 ---')

        results = page.evaluate('''() => {
            var C = window.Constants;
            return {
                adminDefault: C.ROLE_DEFAULT_PAGES.admin,
                govDefault: C.ROLE_DEFAULT_PAGES.government,
                hasArchiveTopics: 'archive-topics' in C.routeMap,
                hasArchiveStatus: 'archive-status' in C.routeMap,
                parentArchiveTopics: C.PAGE_PARENT['archive-topics'],
                parentArchiveStatus: C.PAGE_PARENT['archive-status'],
                parentCharts: C.PAGE_PARENT['charts'],
                parentAnalytics: C.PAGE_PARENT['analytics'],
                navTabsAdmin: C.ROLE_NAV_TABS.admin,
                navTabsParent: C.ROLE_NAV_TABS.parent,
                navTabsYouth: C.ROLE_NAV_TABS.youth,
                navTabsGov: C.ROLE_NAV_TABS.government
            };
        }''')

        print(f'  管理员默认页: {results["adminDefault"]}')
        assert results['adminDefault'] == 'profile', f'FAIL: 管理员默认页应为profile，实际{results["adminDefault"]}'

        print(f'  政府默认页: {results["govDefault"]}')
        assert results['govDefault'] == 'analytics', f'FAIL: 政府默认页应为analytics'

        print(f'  archive-topics in routeMap: {results["hasArchiveTopics"]}')
        assert results['hasArchiveTopics'], 'FAIL: routeMap缺archive-topics'

        print(f'  archive-status in routeMap: {results["hasArchiveStatus"]}')
        assert results['hasArchiveStatus'], 'FAIL: routeMap缺archive-status'

        print(f'  PAGE_PARENT archive-topics: {results["parentArchiveTopics"]}')
        assert results['parentArchiveTopics'] == 'archive', 'FAIL: archive-topics不归属archive'

        print(f'  PAGE_PARENT archive-status: {results["parentArchiveStatus"]}')
        assert results['parentArchiveStatus'] == 'archive', 'FAIL: archive-status不归属archive'

        print(f'  PAGE_PARENT charts: {results["parentCharts"]}')
        print(f'  PAGE_PARENT analytics: {results["parentAnalytics"]}')
        assert results['parentCharts'] == 'charts', 'FAIL: charts归属异常'
        assert results['parentAnalytics'] == 'charts', 'FAIL: analytics归属异常'

        print(f'  管理员Tab: {results["navTabsAdmin"]}')
        assert 'profile' in results['navTabsAdmin'], 'FAIL: 管理员缺少管理Tab'

        print(f'  心青年Tab: {results["navTabsYouth"]}')
        assert len(results["navTabsYouth"]) == 3, 'FAIL: 心青年应有3个Tab'

        print('  ✅ JS 数据结构全部通过')

        # ========== 2. DOM 容器检查 ==========
        print('\n--- DOM 容器 ---')

        dom = page.evaluate('''() => {
            return {
                hasArchiveTopics: !!document.getElementById('archive-topics'),
                hasArchiveStatus: !!document.getElementById('archive-status'),
                hasArchiveTopicsContent: !!document.getElementById('archive-topics-content'),
                hasArchiveStatusContent: !!document.getElementById('archive-status-content'),
                hasArchive: !!document.getElementById('archive'),
                hasAllScripts: true
            };
        }''')

        assert dom['hasArchiveTopics'], 'FAIL: index.html缺#archive-topics容器'
        assert dom['hasArchiveStatus'], 'FAIL: index.html缺#archive-status容器'
        assert dom['hasArchiveTopicsContent'], 'FAIL: #archive-topics-content容器缺失'
        assert dom['hasArchiveStatusContent'], 'FAIL: #archive-status-content容器缺失'
        print('  ✅ DOM 容器全部存在')

        # ========== 3. ArchivePage 模块检查 ==========
        print('\n--- ArchivePage模块 ---')

        mod = page.evaluate('''() => {
            var ap = window.ArchivePage;
            return {
                exists: !!ap,
                hasRenderTopics: !!(ap && ap.renderArchiveTopics),
                hasRenderStatus: !!(ap && ap.renderArchiveStatus)
            };
        }''')

        assert mod['exists'], 'FAIL: window.ArchivePage不存在'
        assert mod['hasRenderTopics'], 'FAIL: renderArchiveTopics缺失'
        assert mod['hasRenderStatus'], 'FAIL: renderArchiveStatus缺失'
        print('  ✅ ArchivePage模块正常挂载')

        # ========== 4. 渲染测试：主题档案页 ==========
        print('\n--- 主题档案页渲染 ---')

        page.evaluate('''() => {
            // 渲染主题档案页
            if (window.ArchivePage && window.ArchivePage.renderArchiveTopics) {
                window.ArchivePage.renderArchiveTopics();
            }
        }''')
        page.wait_for_timeout(500)

        topic_cards = page.evaluate('''() => {
            var cards = document.querySelectorAll('.archive-topic-card');
            return cards.length;
        }''')
        print(f'  主题卡片数: {topic_cards}')
        assert topic_cards == 6, f'FAIL: 预期6个主题卡片，实际{topic_cards}'
        print('  ✅ 主题档案6个卡片渲染正确')

        # ========== 5. 渲染测试：档案状态页 ==========
        print('\n--- 档案状态页渲染 ---')

        page.evaluate('''() => {
            if (window.ArchivePage && window.ArchivePage.renderArchiveStatus) {
                window.ArchivePage.renderArchiveStatus();
            }
        }''')
        page.wait_for_timeout(500)

        # 检查四个标题存在
        sections = page.evaluate('''() => {
            var h3s = document.querySelectorAll('#archive-status-content h3');
            var texts = [];
            h3s.forEach(function(h) { texts.push(h.textContent); });
            return texts;
        }''')
        print(f'  档案状态小节: {sections}')
        assert len(sections) == 4, f'FAIL: 预期4个小节，实际{len(sections)}'
        assert any('资料缺口' in s for s in sections), 'FAIL: 缺少"资料缺口"'
        assert any('长期未更新' in s for s in sections), 'FAIL: 缺少"长期未更新"'
        assert any('信息冲突' in s for s in sections), 'FAIL: 缺少"信息冲突"'
        assert any('AI' in s for s in sections), 'FAIL: 缺少"AI待确认"'
        print('  ✅ 档案状态4个小节完整')

        # ========== 6. 档案总览重排 ==========
        print('\n--- 档案总览重排 ---')

        page.evaluate('''() => {
            if (window.ProfilePage && window.ProfilePage.renderProfile) {
                window.ProfilePage.renderProfile();
            }
        }''')
        page.wait_for_timeout(500)

        # 检查关键section标题
        profile_sections = page.evaluate('''() => {
            var titles = document.querySelectorAll('#archive-content .archive-section-title');
            var texts = [];
            titles.forEach(function(t) { texts.push(t.textContent); });
            return texts;
        }''')
        print(f'  档案总览小节: {profile_sections}')
        assert any('先认识我' in s for s in profile_sections), 'FAIL: 缺少"先认识我"'
        assert any('当前摘要' in s for s in profile_sections), 'FAIL: 缺少"当前摘要"'
        assert any('最近变化' in s for s in profile_sections), 'FAIL: 缺少"最近变化"'
        assert any('深入查看' in s for s in profile_sections), 'FAIL: 缺少"深入查看"入口'
        print('  ✅ 档案总览7节结构正确')

        # 不应有"档案完整度"百分比
        completeness = page.evaluate('''() => {
            return document.querySelector('.completeness-track') !== null;
        }''')
        assert not completeness, 'FAIL: 不应有"档案完整度"评分条'
        print('  ✅ 已移除"档案完整度"评分')

        # 检查入口卡片
        entry_cards = page.evaluate('''() => {
            return document.querySelectorAll('.archive-entry-card').length;
        }''')
        assert entry_cards == 4, f'FAIL: 预期4个入口卡片，实际{entry_cards}'
        print(f'  ✅ 档案总览入口卡片: {entry_cards}个')

        # ========== 7. 控制台错误 ==========
        print('\n--- 控制台 ---')
        if errors:
            print(f'  ⚠️ 控制台错误({len(errors)}):')
            for e in errors[:5]:
                print(f'    - {e[:120]}')
        else:
            print('  ✅ 无控制台错误')

        browser.close()

    print('\n' + '=' * 50)
    print('P1 阶段一验收测试：全部通过')
    print('=' * 50)

if __name__ == '__main__':
    try:
        run_tests()
    except Exception as e:
        print(f'\n❌ 测试失败: {e}')
        import traceback; traceback.print_exc()
        exit(1)
