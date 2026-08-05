"""快速验证沟通数据"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:12345'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f'{BASE}/#login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # 清空 localStorage 触发新数据
    page.evaluate('() => { localStorage.clear(); location.reload(); }')
    page.wait_for_timeout(2000)

    stats = page.evaluate('''() => {
        var DataStore = window.DataStore;
        DataStore.init();
        var records = DataStore.getRecords();
        var commRecords = records.filter(function(r){return r.module==='communication';});
        var byType = {};
        var byRole = {};
        var byPeriod = {today:0, week:0, month:0, quarter:0, halfYear:0};
        
        var today = new Date();
        var t7 = new Date(today.getTime() - 7*86400000);
        var t30 = new Date(today.getTime() - 30*86400000);
        var t90 = new Date(today.getTime() - 90*86400000);
        var t180 = new Date(today.getTime() - 180*86400000);
        var tf = function(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
        var t7s = tf(t7), t30s = tf(t30), t90s = tf(t90), t180s = tf(t180);
        
        commRecords.forEach(function(r){
            byType[r.type] = (byType[r.type]||0)+1;
            byRole[r.authorRole] = (byRole[r.authorRole]||0)+1;
            if(r.date >= t7s) byPeriod.week++;
            else if(r.date >= t30s) byPeriod.month++;
            else if(r.date >= t90s) byPeriod.quarter++;
            else byPeriod.halfYear++;
        });
        
        return {
            total: commRecords.length,
            byType: byType,
            byRole: byRole,
            byPeriod: byPeriod,
            types: commRecords.map(function(r){return r.type+'/'+r.authorRole+'/'+r.date;}).slice(0,5)
        };
    }''')

    print(f"沟通模块总记录数: {stats['total']}")
    print(f"按类型: {stats['byType']}")
    print(f"按角色: {stats['byRole']}")
    print(f"按时间段: {stats['byPeriod']}")
    print(f"样例: {stats['types']}")

    assert stats['total'] >= 18, f"记录不足: {stats['total']}"
    assert 'strategy' in stats['byType'], "缺少策略记录"
    assert 'communication' in stats['byType'], "缺少沟通观察记录"
    assert stats['byPeriod']['week'] >= 5, f"近7天记录不足: {stats['byPeriod']['week']}"
    assert stats['byPeriod']['month'] >= 3, f"近30天记录不足"
    assert stats['byPeriod']['halfYear'] >= 1, f"长期记录不足: {stats['byPeriod']['halfYear']}"
    print("\n✅ 数据验证通过")

    browser.close()
