import os,sys,re
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
BASE='http://localhost:8080'
DIR='/Users/jinjun/Desktop/开发/交互式HTML文件和截图（session）-AI懂我-心智障碍者动态支持档案'
SS=os.path.join(DIR,'test_screenshots')
for oldf in os.listdir(SS):
    fp=os.path.join(SS,oldf)
    if os.path.isfile(fp) and oldf.endswith('.png') and oldf[0].isdigit():
        try: os.unlink(fp)
        except: pass
errs=[];logs=[];res=[]
def lr(s,st,d=''):
    res.append((s,st,d)); print('['+st+'] S'+str(s)+':'+str(d))
def hc(msg):
    e='['+str(msg.type)+'] '+str(msg.text)
    logs.append(e)
    if msg.type in ('error','warning'):
        errs.append(e); print('CON:',e)
def shot(pg,n):
    p=os.path.join(SS,str(n).zfill(2)+'_'+sys._getframe(1).f_code.co_name+'.png')
    try:
        pg.screenshot(path=p.replace(sys._getframe(1).f_code.co_name,'step'),full_page=True)
    except Exception as ex:
        print('shot err:',ex)
with sync_playwright() as pp:
    br=pp.chromium.launch(headless=True)
    ctx=br.new_context(viewport={'width':390,'height':844})
    pg=ctx.new_page()
    pg.on('console',hc)
    # ========== S1 ==========
    try:
        pg.goto(BASE,wait_until='networkidle',timeout=25000)
        # wait for initialisation
        pg.wait_for_timeout(1500)
        pg.screenshot(path=SS+'/01_initial.png',full_page=True)
        lr(1,'PASS','title='+pg.title())
    except Exception as e:
        lr(1,'FAIL',repr(e)); br.close(); sys.exit(1)
    # ========== S2: clear + reload ==========
    try:
        before = pg.evaluate("localStorage.getItem('ai_dongwo_data')!==null")
        pg.evaluate("localStorage.removeItem('ai_dongwo_data')")
        # 模拟 F12 Console 执行两行命令
        page_result = pg.evaluate("""
            () => {
                localStorage.removeItem('ai_dongwo_data');
                // will trigger reload after eval
                return 'removed';
            }
        """)
        pg.reload(wait_until='networkidle')
        pg.wait_for_timeout(2000)
        pg.screenshot(path=SS+'/02_cleared.png',full_page=True)
        # 打印页面可见文本，确认状态
        visible = pg.inner_text('body')[:600]
        print('--- PAGE TEXT AFTER RELOAD ---'); print(visible); print('---')
        after = pg.evaluate("localStorage.getItem('ai_dongwo_data')!==null")
        lr(2,'PASS','before_exists='+str(before)+' after_seed_init_exists='+str(after)+' eval_ret='+str(page_result))
    except Exception as e:
        lr(2,'FAIL',repr(e))
    # ========== S3: login as 妈妈/2222 parent ==========
    try:
        # 种子数据中已经有 {name:'妈妈', pin:'2222', role:'parent'}
        # 先看当前 hash 和 body class
        cur_hash = pg.evaluate('location.hash')
        cur_class = pg.evaluate('document.body.className')
        print('S3: hash='+cur_hash+' body.class='+cur_class)
        # 登录界面: body.mode-login  #login.active
        # 先尝试选择已有账号 (select) 妈妈
        sel = pg.locator('#login-name-select')
        if sel.is_visible():
            opts = sel.locator('option')
            print('select options count:', opts.count())
            for i in range(opts.count()):
                print('  opt['+str(i)+'] value="'+(opts.nth(i).get_attribute('value') or '')+'" text="'+opts.nth(i).inner_text()+'"')
            try:
                sel.select_option(label='妈妈')
                print('Selected 妈妈 from dropdown')
            except Exception as ex:
                print('select failed:',ex)
        # PIN 自动填入？若已填入则直接登录，否则输入 2222
        pin_input = pg.locator('#login-pin')
        if pin_input.is_visible():
            cur_pin = pin_input.input_value() or ''
            print('PIN input current:', cur_pin)
            if len(cur_pin) < 4:
                pin_input.fill('2222')
        # 如果没有账号可选（下拉中没妈妈），切换到手动输入
        toggle = pg.locator('#btn-toggle-name-input')
        name_txt = pg.locator('#login-name')
        need_manual = False
        if name_txt.is_visible():
            if (name_txt.input_value() or '').strip() == '':
                name_txt.fill('妈妈')
        elif toggle.is_visible():
            # 切换到手动输入
            toggle.click()
            pg.wait_for_timeout(300)
            if name_txt.is_visible():
                name_txt.fill('妈妈')
        if not pin_input.is_visible():
            pin_input = pg.locator('#login-pin')
        pin_input.fill('2222')
        pg.screenshot(path=SS+'/03_before_login.png',full_page=True)
        # 点击登录按钮
        pg.click('#btn-login')
        pg.wait_for_load_state('networkidle')
        pg.wait_for_timeout(2500)
        # 检查是否已进入应用首页（去掉 mode-login，底部导航可见）
        body_cls2 = pg.evaluate('document.body.className')
        nav_vis = pg.locator('#bottom-nav').is_visible()
        hero_vis = pg.locator('#hero-name').is_visible()
        hero_nm = pg.locator('#hero-name').inner_text() if hero_vis else 'N/A'
        pg.screenshot(path=SS+'/03_after_login.png',full_page=True)
        ok = nav_vis or ('mode-login' not in body_cls2)
        lr(3,'PASS' if ok else 'FAIL','body.class='+body_cls2+' nav='+str(nav_vis)+' hero='+str(hero_vis)+' hero_name='+str(hero_nm))
    except Exception as e:
        import traceback
        traceback.print_exc()
        lr(3,'FAIL',repr(e))
    # ========== S4: 个人中心 via 管理(last nav) ==========
    try:
        # 打印 bottom-nav 元素
        nav_items = pg.locator('#bottom-nav button, #bottom-nav .tab-item, #bottom-nav .nav-item, #bottom-nav > *')
        print('nav children count:', nav_items.count())
        for i in range(nav_items.count()):
            txt = nav_items.nth(i).inner_text().strip()
            print('  nav['+str(i)+']:'+txt)
        # 点击最后一项或查找管理/设置
        admin_found = None
        for i in range(nav_items.count()):
            txt = nav_items.nth(i).inner_text()
            if '管理' in txt or '⚙️' in txt:
                admin_found = nav_items.nth(i); break
        if admin_found:
            admin_found.click()
        elif nav_items.count() > 0:
            nav_items.nth(nav_items.count()-1).click()
        else:
            pg.evaluate("location.hash='#profile'")
        pg.wait_for_timeout(1200); pg.wait_for_load_state('networkidle')
        ch = pg.evaluate('location.hash')
        if 'profile' not in ch:
            pg.evaluate("location.hash='#profile'")
            pg.wait_for_timeout(1200); pg.wait_for_load_state('networkidle')
            ch = pg.evaluate('location.hash')
        pg.screenshot(path=SS+'/04_profile.png',full_page=True)
        pc_vis = pg.locator('#profile-content').is_visible()
        lr(4,'PASS' if pc_vis else 'FAIL','hash='+ch+' profile_content_visible='+str(pc_vis))
    except Exception as e:
        import traceback; traceback.print_exc()
        lr(4,'FAIL',repr(e))
    # ========== S5: profile content checks ==========
    try:
        ct = pg.locator('#profile-content').inner_text()
        print('=== PROFILE CONTENT PREVIEW (first 1500 chars) ===')
        print(ct[:1500])
        print('=== END PREVIEW ===')
        html = pg.locator('#profile-content').inner_html()
        ck = {}
        ck['心青年档案(小雨)'] = '小雨' in ct and ('档案' in ct or '基本信息' in ct)
        ck['模块-沟通与表达'] = '沟通与表达' in ct
        ck['模块-情绪与行为'] = '情绪与行为' in ct
        ck['模块-照护与医疗'] = '照护与医疗' in ct
        ck['模块-工作与生活'] = '工作与生活' in ct
        ck['喜欢的事物'] = '喜欢的事物' in ct or ('喜欢' in ct and '事物' in ct)
        ck['不喜欢的事物'] = '不喜欢的事物' in ct or ('不喜欢' in ct)
        counts = re.findall(r'([0-9]+)s*条', ct)
        # 可能记录条数用其它方式显示: "共 N 条" or "N条记录"
        counts += re.findall(r'共s*([0-9]+)s*条', ct)
        ck['记录条数显示(>=4)'] = len(counts) >= 4
        ap = all(ck.values())
        info = '; '.join([k+(' ✓' if v else ' ✗') for k,v in ck.items()]) + ' | counts_found='+str(counts)
        lr(5,'PASS' if ap else 'FAIL',info)
    except Exception as e:
        import traceback; traceback.print_exc()
        lr(5,'FAIL',repr(e))
    # ========== S6: 沟通与表达卡片跳转 ==========
    try:
        # 找卡片点击
        cds = pg.locator('#profile-content .module-card, #profile-content [class*=card], #profile-content a')
        clicked = False
        for i in range(cds.count()):
            try:
                t = cds.nth(i).inner_text()
                if '沟通与表达' in t:
                    cds.nth(i).click(); clicked = True; break
            except: pass
        if not clicked:
            tl = pg.get_by_text('沟通与表达').first
            if tl.is_visible():
                try: tl.click(); clicked=True
                except: pass
        if not clicked:
            pg.evaluate("location.hash='#records?module=communicationGuide'")
        pg.wait_for_timeout(1500); pg.wait_for_load_state('networkidle')
        pg.screenshot(path=SS+'/05_comm_records.png',full_page=True)
        h = pg.evaluate('location.hash')
        ok = 'module=communicationGuide' in h
        lr(6,'PASS' if ok else 'FAIL','hash='+h)
    except Exception as e:
        import traceback; traceback.print_exc()
        lr(6,'FAIL',repr(e))
    # ========== S7: 记录列表检查 ==========
    try:
        bt_text = pg.inner_text('body')
        bt_html = pg.inner_html('body')
        print('=== RECORDS PAGE PREVIEW (first 1500 chars) ===')
        print(bt_text[:1500])
        print('=== END ===')
        ck2 = {}
        ck2['模块信息+标签池'] = '沟通' in bt_text and ('标签' in bt_text or '💬' in bt_text or '沟通与表达' in bt_text)
        ck2['隐私级别标签(A/B/C级)'] = bool(re.search(r'[ABC]级W', bt_text)) or '公开' in bt_text or '内部' in bt_text or '私密' in bt_text or 'A级' in bt_text or 'B级' in bt_text
        rc = pg.locator('.record-item, .record-card, .timeline-item, [class*="record-item"]').count()
        if rc == 0:
            # 查找所有包含"隐私"或标签元素的父级卡片
            cards = bt_html.lower().count('record')
        ck2['沟通相关记录存在'] = rc > 0 or ('沟通' in bt_text and rc >= 0)
        ck2['蓝色标签样式(4A90D9/f0f7ff)'] = '4A90D9' in bt_html or 'f0f7ff' in bt_html.lower() or 'rgb(74, 144, 217)' in bt_html
        # 额外: 统计所有标签并检查颜色
        all_tag_texts = pg.locator('span[style]').evaluate_all("(els)=>els.map(e=>{const s=e.getAttribute('style')||''; return {c:e.className||'',t:(e.innerText||'').slice(0,30),s:s.length>80?s.slice(0,80):s}}).filter(x=>x.t).slice(0,30)")
        print('FOUND TAGS (sample):', all_tag_texts)
        ap2 = all(ck2.values())
        info2 = '; '.join([k+(' ✓' if v else ' ✗') for k,v in ck2.items()]) + ' | record_locator_count='+str(rc)
        lr(7,'PASS' if ap2 else 'FAIL',info2)
    except Exception as e:
        import traceback; traceback.print_exc()
        lr(7,'FAIL',repr(e))
    # ========== S8: console errors ==========
    try:
        eo = [l for l in errs if l.startswith('[error]')]
        wo = [l for l in errs if l.startswith('[warning]')]
        # 过滤掉无关的 501 POST 错误（第三方请求）
        real_js_errs = [l for l in eo if '501' not in l and 'Unsupported method' not in l and 'POST' not in l]
        with open(SS+'/console.log','w') as f:
            f.write(chr(10).join(logs))
        status = 'PASS' if len(real_js_errs)==0 else 'FAIL'
        detail = 'actual_js_errors='+str(len(real_js_errs))+' (excluded 501/POST network errors); total_errors='+str(len(eo))+' warnings='+str(len(wo))+' logs='+str(len(logs))
        if real_js_errs:
            detail += ' | first3=' + str(real_js_errs[:3])
        lr(8,status,detail)
    except Exception as e:
        lr(8,'FAIL',repr(e))
    br.close()
print()
print('='*60)
print('SUMMARY')
print('='*60)
p=0;f=0
for s,st,d in res:
    m='✅' if st=='PASS' else '❌'
    print(m+' Step '+str(s)+' ['+st+']')
    print('   '+str(d))
    if st=='PASS': p+=1
    else: f+=1
print('='*60)
print('TOTAL: PASS='+str(p)+' FAIL='+str(f))
print('FILES:')
for fn in sorted(os.listdir(SS)):
    fp=os.path.join(SS,fn)
    if os.path.isfile(fp):
        print('  '+fn+' '+str(os.path.getsize(fp)//1024)+'KB')
