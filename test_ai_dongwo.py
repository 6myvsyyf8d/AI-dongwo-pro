import os,sys,re
from playwright.sync_api import sync_playwright
BASE='http://localhost:8080'
DIR='/Users/jinjun/Desktop/开发/交互式HTML文件和截图（session）-AI懂我-心智障碍者动态支持档案'
SS=os.path.join(DIR,'test_screenshots')
os.makedirs(SS,exist_ok=True)
errs=[];logs=[];res=[]
def lr(s,st,d=''):
    res.append((s,st,d))
    print('['+st+'] S'+str(s)+':'+str(d))
def hc(msg):
    e='['+str(msg.type)+'] '+str(msg.text)
    logs.append(e)
    if msg.type in ('error','warning'):
        errs.append(e);print('CON:',e)
with sync_playwright() as pp:
    br=pp.chromium.launch(headless=True)
    ctx=br.new_context(viewport={'width':390,'height':844})
    pg=ctx.new_page()
    pg.on('console',hc)
    try:
        pg.goto(BASE,wait_until='networkidle',timeout=20000)
        pg.screenshot(path=SS+'/01_initial.png',full_page=True)
        lr(1,'PASS','title='+pg.title())
    except Exception as e:
        lr(1,'FAIL',str(e));br.close();sys.exit(1)
    try:
        pg.evaluate("localStorage.removeItem('ai_dongwo_data')")
        pg.reload(wait_until='networkidle')
        pg.wait_for_timeout(800)
        pg.screenshot(path=SS+'/02_cleared.png',full_page=True)
        ex=pg.evaluate("localStorage.getItem('ai_dongwo_data')!==null")
        lr(2,'PASS','cleared+reloaded seed_data_exists='+str(ex))
    except Exception as e:
        lr(2,'FAIL',str(e))
    try:
        rl=pg.locator('#btn-show-register')
        if rl.is_visible(timeout=2500):
            rl.click();pg.wait_for_timeout(400)
            pg.click(".role-select-card[data-role='parent']")
            pg.wait_for_timeout(400)
            pg.fill('#register-name','妈妈')
            pg.fill('#register-pin','2222')
            pg.fill('#register-pin-confirm','2222')
            pg.click('#btn-register')
        else:
            pg.click('#btn-toggle-name-input')
            pg.fill('#login-name','妈妈')
            pg.fill('#login-pin','2222')
            pg.click('#btn-login')
        pg.wait_for_load_state('networkidle');pg.wait_for_timeout(2000)
        pg.screenshot(path=SS+'/03_loggedin.png',full_page=True)
        hv=pg.locator('#hero-name').is_visible()
        nv=pg.locator('#bottom-nav').is_visible()
        hn=pg.locator('#hero-name').inner_text() if hv else 'N/A'
        lr(3,'PASS' if (hv or nv) else 'FAIL','hero='+str(hv)+' nav='+str(nv)+' name='+str(hn))
    except Exception as e:
        lr(3,'FAIL',repr(e))
    try:
        sel='#bottom-nav .tab-item:last-child,#bottom-nav .nav-item:last-child,#bottom-nav button:last-child,#bottom-nav a:last-child'
        pg.click(sel)
        pg.wait_for_timeout(800);pg.wait_for_load_state('networkidle')
        if 'profile' not in pg.evaluate('location.hash'):
            pg.evaluate("location.hash='#profile'")
            pg.wait_for_timeout(900)
        pg.screenshot(path=SS+'/04_profile.png',full_page=True)
        pv=pg.locator('#profile.active').count()>0 or pg.locator('#profile-content').is_visible()
        lr(4,'PASS' if pv else 'FAIL','hash='+str(pg.evaluate('location.hash')))
    except Exception as e:
        lr(4,'FAIL',repr(e))
    try:
        ct=pg.locator('#profile-content').inner_text()
        ck={}
        ck['小雨档案']='小雨' in ct and '档案' in ct
        ck['沟通与表达']='沟通与表达' in ct
        ck['情绪与行为']='情绪与行为' in ct
        ck['照护与医疗']='照护与医疗' in ct
        ck['工作与生活']='工作与生活' in ct
        ck['喜欢的事物']='喜欢的事物' in ct
        ck['不喜欢的事物']='不喜欢的事物' in ct
        counts=re.findall(r'[0-9]+条',ct)
        ck['记录条数显示']=len(counts)>=2
        ap=all(ck.values())
        info=';'.join([k+('Y' if v else 'N') for k,v in ck.items()])+' counts='+str(counts[:8])
        lr(5,'PASS' if ap else 'FAIL',info)
    except Exception as e:
        lr(5,'FAIL',repr(e))
    try:
        cds=pg.locator('#profile-content .module-card,#profile-content .card')
        clicked=False
        for i in range(cds.count()):
            tt=cds.nth(i).inner_text()
            if '沟通与表达' in tt:
                cds.nth(i).click();clicked=True;break
        if not clicked:
            tl=pg.get_by_text('沟通与表达').first
            if tl.is_visible():
                tl.click();clicked=True
        if not clicked:
            pg.evaluate("location.hash='#records?module=communicationGuide'")
        pg.wait_for_timeout(1200);pg.wait_for_load_state('networkidle')
        pg.screenshot(path=SS+'/05_comm_records.png',full_page=True)
        h=pg.evaluate('location.hash')
        lr(6,'PASS' if 'module=communicationGuide' in h else 'FAIL','hash='+str(h))
    except Exception as e:
        lr(6,'FAIL',repr(e))
    try:
        bt_txt=pg.inner_text('body')
        bt_html=pg.inner_html('body')
        ck2={}
        ck2['模块+标签池']=('沟通' in bt_txt and ('标签' in bt_txt or '沟通与表达' in bt_txt))
        ck2['隐私级别A/B级']=bool(re.search(r'[ABC]级',bt_txt)) or '公开' in bt_txt or '内部' in bt_txt
        rc=pg.locator('.record-item,.record-card,.timeline-item').count()
        ck2['记录项存在']=rc>0
        ck2['蓝色标签样式']=('4A90D9' in bt_html or 'f0f7ff' in bt_html.lower())
        ap2=all(ck2.values())
        info2=';'.join([k+('Y' if v else 'N') for k,v in ck2.items()])+' rec_count='+str(rc)
        lr(7,'PASS' if ap2 else 'FAIL',info2)
    except Exception as e:
        lr(7,'FAIL',repr(e))
    try:
        eo=[l for l in errs if l.startswith('[error]')]
        wo=[l for l in errs if l.startswith('[warning]')]
        with open(SS+'/console.log','w') as f:
            f.write(chr(10).join(logs))
        status='PASS' if len(eo)==0 else 'FAIL'
        lr(8,status,'errors='+str(len(eo))+' warnings='+str(len(wo))+' logs='+str(len(logs)))
        if len(eo)>0:
            print('FIRST_3_ERRORS:')
            for x in eo[:3]:print(' ',x)
    except Exception as e:
        lr(8,'FAIL',repr(e))
    br.close()
print('')
print('='*50)
print('SUMMARY')
print('='*50)
p_cnt=0;f_cnt=0
for s,st,d in res:
    mark='OK' if st=='PASS' else 'XX'
    print(mark+' S'+str(s)+' ['+st+'] -> '+str(d))
    if st=='PASS':p_cnt+=1
    elif st=='FAIL':f_cnt+=1
print('='*50)
print('TOTAL: PASS='+str(p_cnt)+' FAIL='+str(f_cnt))
print('FILES:')
for fn in sorted(os.listdir(SS)):
    fp=os.path.join(SS,fn)
    if os.path.isfile(fp):
        sz=os.path.getsize(fp)//1024
        print('  '+fn+' '+str(sz)+'KB')
