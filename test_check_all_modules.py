"""快速查各主题数据量"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:12345'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f'{BASE}/#login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.evaluate('localStorage.clear(); location.reload();')
    page.wait_for_timeout(2000)

    stats = page.evaluate('''() => {
        var ds = window.DataStore; ds.init();
        var all = ds.getRecords();
        var modules = ['life','emotion','care','work','relations'];
        var result = {};
        modules.forEach(function(m){
            var recs = all.filter(function(r){return r.module===m;});
            var byType = {};
            var byRole = {};
            var dates = [];
            recs.forEach(function(r){
                byType[r.type] = (byType[r.type]||0)+1;
                byRole[r.authorRole] = (byRole[r.authorRole]||0)+1;
                dates.push(r.date);
            });
            dates.sort();
            result[m] = {total: recs.length, byType: byType, byRole: byRole, oldest: dates[0], newest: dates[dates.length-1]};
        });
        return result;
    }''')

    for mod, info in stats.items():
        print(f"\n{'─'*40}")
        print(f"📂 {mod}: {info['total']}条")
        print(f"   类型: {info['byType']}")
        print(f"   角色: {info['byRole']}")
        print(f"   时间: {info['oldest']} ~ {info['newest']}")
        if info['total'] < 8:
            print(f"   ⚠️ 数据不足（<8条），需要补充")

    browser.close()
