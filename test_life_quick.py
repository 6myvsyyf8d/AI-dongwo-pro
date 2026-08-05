"""验证 #life 四层模型"""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={'width': 430, 'height': 900})
    pg.goto('http://localhost:12345/#login')
    pg.wait_for_timeout(2000)
    pg.evaluate('''()=>{var ds=window.DataStore;ds.init();var u=ds.getAllUsers().find(function(x){return x.id==='u_sample_parent';});
        if(u){ds.setCurrentUser(u);if(window.AppState){window.AppState.currentUser=u;window.AppState.currentRole=u.role;}}}''')
    pg.goto('http://localhost:12345/#life')
    pg.wait_for_timeout(1000)
    
    r = pg.evaluate('''()=>{
        var l1=document.querySelectorAll('.comm-l1-item').length;
        var l3=document.querySelectorAll('.comm-l3-item').length;
        var l4=document.querySelectorAll('.comm-l4-group').length;
        var tabs=document.querySelectorAll('.comm-time-tab').length;
        return {l1:l1,l3:l3,l4:l4,tabs:tabs};
    }''')
    print(f"#life: L1={r['l1']}条 L3={r['l3']}条 L4={r['l4']}组 Tabs={r['tabs']} ✅" if r['l1']>1 else f"❌ #life 数据不足: {r}")
    pg.screenshot(path='/tmp/life_test.png', full_page=False)
    print("截图: /tmp/life_test.png")
    b.close()
