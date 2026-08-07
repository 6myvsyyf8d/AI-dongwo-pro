/**
 * storage.js — localStorage 封装
 * 挂载：window.DataStore
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ai_dongwo_data';
  var INSTANCE_KEY_PREFIX = 'ai_dongwo_task_instances_';
  var DATA_VERSION = 9;
  // 当前登录用户用 sessionStorage，关闭标签页即清空，新访客看到登录页
  var CURRENT_USER_KEY = 'ai_dongwo_current_user';

  // 协作网络存储键
  var GRANTS_KEY = 'ai_dongwo_grants';
  var INVITATIONS_KEY = 'ai_dongwo_invitations';
  var JOIN_REQUESTS_KEY = 'ai_dongwo_join_requests';
  var FAMILY_RELATIONS_KEY = 'ai_dongwo_family_relations';

  var C = window.Constants;
  var ROLES = C.ROLES;
  var MODULE_TAGS = C.MODULE_TAGS;
  var TYPE_TO_MODULE = C.TYPE_TO_MODULE;

  /** 生成示例用户数据 */
  function generateSampleUsers() {
    return [
      { id: 'u_sample_youth', name: '小雨', role: 'youth', pin: '1111', avatar: '🌻', createdAt: window.getTodayString() },
      { id: 'u_sample_parent', name: '妈妈', role: 'parent', pin: '2222', avatar: '👨\u200d👩\u200d👧', createdAt: window.getTodayString() },
      { id: 'u_sample_teacher', name: '李老师', role: 'teacher', pin: '3333', avatar: '📚', createdAt: window.getTodayString() },
      { id: 'u_sample_caregiver', name: '张阿姨', role: 'caregiver', pin: '4444', avatar: '🤝', createdAt: window.getTodayString() },
      { id: 'u_sample_supporter', name: '临时支持者', role: 'temp_supporter', pin: '8888', avatar: '🤲', createdAt: window.getTodayString() },
      { id: 'u_gov_admin', name: '政府管理员', role: 'government', pin: '6666', avatar: '🏛️', createdAt: window.getTodayString() },
      { id: 'u_sys_admin', name: '系统管理员', role: 'admin', pin: '9999', avatar: '🛡️', createdAt: window.getTodayString() }
    ];
  }

  /** 生成示例记录数据 */
  function generateSampleRecords() {
    var records = [];
    var authors = {
      youth: { name: '小雨', role: 'youth', id: 'u_sample_youth', avatar: '🌻' },
      parent: { name: '妈妈', role: 'parent', id: 'u_sample_parent', avatar: '👨\u200d👩\u200d👧' },
      teacher: { name: '李老师', role: 'teacher', id: 'u_sample_teacher', avatar: '📚' },
      caregiver: { name: '张阿姨', role: 'caregiver', id: 'u_sample_caregiver', avatar: '🤝' }
    };

    function dateStr(offset) {
      var d = new Date();
      d.setDate(d.getDate() + offset);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function timeStr(h, m) {
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function addRecord(type, data) {
      var moduleKey = data.module || TYPE_TO_MODULE[type] || null;
      var tags = data.tags || [];
      if (!data.tags && moduleKey && MODULE_TAGS[moduleKey]) {
        var pool = MODULE_TAGS[moduleKey];
        var t1 = pool[Math.floor(Math.random() * pool.length)];
        tags.push(t1);
        if (Math.random() > 0.4) {
          var t2 = pool[Math.floor(Math.random() * pool.length)];
          if (t2 !== t1) tags.push(t2);
        }
      }
      var privacy = data.privacy || 'B';
      records.push(Object.assign({
        id: window.generateUUID(), type: type, date: dateStr(0), time: timeStr(9, 0),
        module: moduleKey, privacy: privacy, tags: tags
      }, data));
    }

    // === 近30天心情记录 ===
    var moodData = [
      { d: 0, m: 'happy', c: '今天做曲奇很成功，特别开心！' },
      { d: -1, m: 'calm', c: '今天状态很平静，像往常一样跟着流程走。' },
      { d: -2, m: 'happy', c: '看到了一只橘猫，开心地笑了。' },
      { d: -3, m: 'anxious', c: '外面突然打雷，有点害怕，捂了一会儿耳朵。' },
      { d: -4, m: 'calm', c: '今天和平常一样，没什么特别的事。' },
      { d: -5, m: 'excited', c: '周末要去公园，从早上就开始兴奋了！' },
      { d: -6, m: 'happy', c: '学会了新的烘焙配方，成就感满满。' },
      { d: -7, m: 'calm', c: '下午电子琴练习很顺利，弹得很流畅。' },
      { d: -8, m: 'anxious', c: '今天机构来了新老师，有些不适应。' },
      { d: -9, m: 'happy', c: '收到了志愿者哥哥送的公交车模型，超级开心！' },
      { d: -10, m: 'calm', c: '今天一切正常，按时完成了所有活动。' },
      { d: -11, m: 'sad', c: '今天有点想家，下午不太想参加活动。' },
      { d: -12, m: 'happy', c: '妈妈来探望了，还带了喜欢的面包。' },
      { d: -13, m: 'excited', c: '明天有外出活动，今晚有点睡不着。' },
      { d: -14, m: 'calm', c: '今天状态不错，完成了所有任务。' },
      { d: -15, m: 'anxious', c: '午餐的菜单临时换了，有点紧张。' },
      { d: -16, m: 'happy', c: '今天在公园里看到了很多公交车，特别满足。' },
      { d: -17, m: 'calm', c: '今天很安静，画画的时候特别专注。' },
      { d: -18, m: 'happy', c: '和同学们一起做了蛋糕，分享的时候很开心。' },
      { d: -19, m: 'anxious', c: '今天下雨了，不能去户外，有点烦躁。' },
      { d: -20, m: 'calm', c: '今天在室内活动，整理了之前的画作。' },
      { d: -21, m: 'happy', c: '学会了新的电子琴曲子，弹给妈妈听。' },
      { d: -22, m: 'calm', c: '今天没什么特别的，但很安心。' },
      { d: -23, m: 'excited', c: '得知下周有烘焙比赛，开始期待了！' },
      { d: -24, m: 'happy', c: '今天做的小饼干得到了老师表扬。' },
      { d: -25, m: 'calm', c: '今天一切按部就班，很顺利。' },
      { d: -26, m: 'anxious', c: '今天机构人多，有点不适应，去安静角落待了一会儿。' },
      { d: -27, m: 'happy', c: '和志愿者小王一起去了新的公园，看到了很多猫。' },
      { d: -28, m: 'calm', c: '今天在机构完成了所有的日常活动。' },
      { d: -29, m: 'happy', c: '收到了生日礼物，是一个新的电子琴曲谱集。' }
    ];

    moodData.forEach(function(item) {
      addRecord('mood', {
        mood: item.m, content: item.c,
        author: authors.youth.name, authorRole: authors.youth.role,
        authorId: authors.youth.id, authorAvatar: authors.youth.avatar,
        date: dateStr(item.d), time: timeStr(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60))
      });
    });

    // === 情绪事件 ===
    var emotionData = [
      { d: -1, t: '焦虑', c: '下午机构突然换了活动教室，有些不安，来回踱步。提前熟悉环境后逐渐平稳。', a: 'caregiver' },
      { d: -3, t: '恐惧', c: '外面打雷声音很大，出现捂耳朵、蜷缩的反应。播放轻音乐后慢慢放松。', a: 'parent' },
      { d: -5, t: '兴奋', c: '得知周末要去公园，一整天都处于高度兴奋状态，话比平时多。', a: 'teacher' },
      { d: -8, t: '焦虑', c: '机构来了新老师，不愿意配合活动，躲在角落。后来妈妈电话安抚后好转。', a: 'caregiver' },
      { d: -11, t: '难过', c: '想念妈妈，下午情绪低落，不愿意参加集体活动。给他看了妈妈照片后好一些。', a: 'teacher' },
      { d: -15, t: '焦虑', c: '午餐菜单临时更换，反复确认新菜品成分，确认没有海鲜后才肯吃。', a: 'parent' },
      { d: -19, t: '烦躁', c: '下雨天不能户外活动，在教室内来回走动，敲打桌子。转移注意力到电子琴后平静。', a: 'teacher' },
      { d: -21, t: '开心', c: '弹新曲子给妈妈听，得到夸奖后开心地笑了，还主动要求再弹一首。', a: 'parent' },
      { d: -23, t: '兴奋', c: '得知有烘焙比赛，一晚上都在念叨要做饼干，很晚才睡着。', a: 'parent' },
      { d: -26, t: '焦虑', c: '今天机构人多嘈杂，出现捂耳朵行为。带他到安静房间待了15分钟后恢复。', a: 'caregiver' },
      { d: -27, t: '开心', c: '去新公园看到了很多流浪猫，主动走近观察，心情特别好。', a: 'caregiver' },
      { d: -29, t: '开心', c: '收到电子琴曲谱集礼物，迫不及待地翻看了每一页。', a: 'parent' }
    ];

    emotionData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('emotion', {
        emotion_type: item.t, content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(14 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60))
      });
    });

    // === 活动记录 ===
    var activityData = [
      { d: 0, t: '烘焙课表现', c: '主动帮忙分发材料，做了一个杯子蛋糕，装饰得很漂亮。', a: 'teacher' },
      { d: -2, t: '社区散步', c: '在社区里散步40分钟，对路过的公交车很感兴趣，能准确说出线路号。', a: 'caregiver' },
      { d: -5, t: '电子琴练习', c: '练习了新曲子《小星星》，手指协调性有进步，能完整弹奏。', a: 'teacher' },
      { d: -7, t: '绘画活动', c: '画了一幅公交车主题的画，用了蓝色和黄色，配色很好看。', a: 'teacher' },
      { d: -12, t: '烘焙课', c: '做了巧克力曲奇，学会了控制烤箱温度，成品不错。', a: 'teacher' },
      { d: -16, t: '公园观察', c: '在公园观察公交车进出站，能说出大部分线路的终点站。', a: 'caregiver' },
      { d: -21, t: '音乐分享', c: '给妈妈弹了新学的曲子，还尝试即兴改编了几个小节。', a: 'parent' },
      { d: -24, t: '烘焙作品', c: '独立完成了小饼干的制作，从配料到出炉全程参与。', a: 'teacher' }
    ];

    activityData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('activity', {
        title: item.t, content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(10 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60))
      });
    });

    // === 工作支持补充记录（支持需求、适应调整、困难） ===
    var workMore = [
      { d: -9, t: '支持需求', c: '新任务指令需要提前演示一遍，口头说明不够。建议用步骤卡片辅助理解。', a: 'teacher' },
      { d: -15, t: '适应调整', c: '烘焙课临时换了配方，提前说明后配合良好，比上次换教室时适应得快。', a: 'teacher' },
      { d: -20, t: '困难记录', c: '今天活动顺序临时调整，出现不安。先安排熟悉的烘焙环节后恢复，说明固定流程可应急使用。', a: 'caregiver' },
      { d: -28, t: '支持方式', c: '用步骤分解法教新任务——把"包装饼干"分解成取袋→装袋→封口三步，小雨独立完成了全部步骤。', a: 'teacher' },
      { d: -35, t: '新任务', c: '开始尝试清洁整理工作。从擦桌子开始，做了示范后小雨能独立完成2张桌子。', a: 'caregiver' },
      { d: -45, t: '支持调整建议', c: '建议在烘焙任务中加入称量环节，小雨对数字敏感，可能适合更精确的操作步骤。', a: 'teacher' }
    ];
    workMore.forEach(function(item) {
      var au = authors[item.a];
      addRecord('note', {
        title: item.t, content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        module: 'work',
        date: dateStr(item.d), time: timeStr(10 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60))
      });
    });

    // === 生活记录（12条，兴趣/活动/日常安排，跨6个月，3角色） ===
    var lifeData = [
      // 今天-7天
      { d: 0,  t: '周末安排', c: '周末去了公园，看了很多公交车进出站，还喂了鸽子。回家路上主动说"下周还来"。', a: 'parent' },
      { d: -2,  t: '烘焙兴趣', c: '今天在家尝试做了小饼干，从量面粉到装饰全程参与。最喜欢巧克力口味的，做了两盘。', a: 'parent' },
      { d: -4,  c: '每天晚饭后要看一集《托马斯小火车》，会跟着唱主题曲。看到火车进站的画面特别兴奋。', a: 'parent' },
      { d: -6,  t: '公园活动', c: '在公园散步时主动指着一个新公交站牌说"这个以前没见过"，观察力很强。', a: 'caregiver' },
      // 8-30天
      { d: -10, t: '电子琴练习', c: '最近喜欢弹《小星星》，每天自己主动坐到琴前弹两遍。弹完了会拍手给自己鼓掌。', a: 'teacher' },
      { d: -15, c: '他最近收集了好几个公交车模型，摆在床头整整齐齐的。睡前会一个个拿起来看看再放回去。', a: 'parent' },
      { d: -22, t: '烘焙课', c: '这周的烘焙课做了纸杯蛋糕，从打蛋到裱花全程参与了。特别喜欢裱花这一步。', a: 'teacher' },
      { d: -28, t: '周末安排', c: '周六去了奶奶家，在院子里帮奶奶浇花。看到蝴蝶后追着跑了一会儿，笑得很开心。', a: 'parent' },
      // 31-90天
      { d: -40, t: '假期安排', c: '五一假期带他去了动物园，最喜欢的不是狮子老虎，是园区的游览小火车。来回坐了三次。', a: 'parent' },
      { d: -55, c: '发现他喜欢把鞋子摆成整整齐齐的一排，按颜色分类。妈妈说这是他自己的"小仪式"。', a: 'caregiver' },
      { d: -75, t: '新爱好', c: '最近开始对拍照感兴趣，拿着妈妈的旧手机到处拍。最喜欢拍公交车和路边的小猫。', a: 'parent' },
      // 91-180天
      { d: -110, c: '春节时第一次主动在饭桌上祝大家"新年快乐"，说之前练了好几遍。全家人都特别惊喜。', a: 'parent' }
    ];

    lifeData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('life', {
        title: item.t || '',
        content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(10 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60))
      });
    });

    // === 照护记录 ===
    var careData = [
      { d: 0, t: '早餐情况', c: '吃了面包和牛奶，食欲不错。提醒午餐不能有海鲜。', a: 'parent' },
      { d: -4, t: '午餐观察', c: '午餐吃得比平时少，可能和上午情绪紧张有关。检查了菜品确认无海鲜。', a: 'caregiver' },
      { d: -10, t: '睡眠记录', c: '昨晚入睡晚了约20分钟，夜间没有醒，早上精神状态正常。', a: 'parent' },
      { d: -17, t: '身体检查', c: '体温正常，没有感冒症状。指甲有点长，已修剪。', a: 'caregiver' },
      { d: -22, t: '饮食记录', c: '三餐正常，下午加餐吃了水果。饮水量足够。', a: 'parent' }
    ];

    careData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('care', {
        title: item.t, content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(7 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60))
      });
    });

    // === 照护记录补充（覆盖用药、就医、过敏、作息、紧急联系人等） ===
    ['care'].forEach(function() { /* scope */ });
    var careMore = [
      { d: -8, t: '过敏确认', c: '与机构厨师确认了过敏清单，厨房已张贴海鲜禁用标识。食材采购时也会注意。', a: 'caregiver' },
      { d: -14, t: '体检结果', c: '年度体检完成，各项指标正常。医生建议保持每天户外活动不少于30分钟。', a: 'parent' },
      { d: -19, t: '用药确认', c: '社区医院复诊，确认目前无需常规用药。医生建议保持生活方式观察，半年后复查。', a: 'parent' },
      { d: -25, t: '紧急联系人', c: '更新了紧急联系人：添加李老师（机构主管，139xxxx1234），作为第二紧急联系。', a: 'parent' },
      { d: -33, t: '新食物尝试', c: '尝试了新款无麸质饼干（椰奶味），小雨表示喜欢，两小时内没有不良反应。', a: 'parent' },
      { d: -42, t: '作息跟踪', c: '连续一周晚上10点前入睡，早上8:30起床，作息规律。张阿姨记录。', a: 'caregiver' },
      { d: -55, t: '换季提醒', c: '天气转凉，已准备秋季外套。提醒机构注意室内温度，避免着凉。', a: 'parent' },
      { d: -70, t: '复查日历', c: '上次体检医生建议3个月后复查视力。已在日历标记提醒，到期前一周通知。', a: 'parent' }
    ];
    careMore.forEach(function(item) {
      var au = authors[item.a];
      addRecord('care', {
        title: item.t, content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(8 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60))
      });
    });

    // === 关系与社交记录（12条，跨6个月，3角色） ===
    var relationsData = [
      { d: -1,  t: '与李老师互动', c: '今天烘焙课上李老师示范了裱花技巧，小雨跟着做得很认真，结束后主动说"谢谢老师"。', a: 'teacher' },
      { d: -3,  t: '与同事小王', c: '小王把用过的包装纸叠好递给小雨，小雨接过来放进垃圾桶。两人的配合越来越默契了。', a: 'caregiver' },
      { d: -6,  t: '社交偏好', c: '今天机构来了访客，小雨没有主动打招呼，但在角落安静观察了一会儿。不抗拒接触，只是需要时间。', a: 'teacher' },
      { d: -10, t: '家庭互动', c: '晚饭后和爸爸一起拼模型，小雨负责找零件、爸爸负责组装，花了一个小时完成，两人都很开心。', a: 'parent' },
      { d: -14, t: '回避事件', c: '社区活动有个志愿者太热情，一见面就想拍小雨肩膀，小雨明显后退了一步。张阿姨及时拦住，解释后小雨放松了。', a: 'caregiver' },
      { d: -18, t: '信任建立', c: '新来的实习老师小陈连续三天只是远远点头打招呼，不主动靠近。今天小雨第一次回应了她的微笑。', a: 'teacher' },
      { d: -22, t: '和邻居互动', c: '楼下阿姨送来自己种的番茄，小雨接过来小声说了"谢谢"，虽然没看对方眼睛，但说了话就是进步。', a: 'parent' },
      { d: -27, t: '社交压力', c: '今天机构活动人多声音大，小雨一进门就找了靠墙的角落位置。安静了20分钟后开始参加。', a: 'caregiver' },
      { d: -32, t: '关系圈更新', c: '小王要调到其他组了，以后可能不会经常一起工作了。需要帮小雨准备这个变化。', a: 'teacher' },
      { d: -38, t: '社群融入', c: '机构烘焙小组固定有4个人，小雨现在能和其他成员共用操作台，不排斥别人离得近。', a: 'teacher' },
      { d: -50, t: '互动意愿', c: '今天小雨主动把烤好的饼干分给小王和李老师各一块，这是最近第一次主动分享食物给别人。', a: 'caregiver' },
      { d: -65, t: '边界需求', c: '机构评估：小雨对个人空间有明确需求，建议新接触的人保持一臂距离、先打招呼再互动。', a: 'teacher' }
    ];
    relationsData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('social', {
        title: item.t, content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(10 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60))
      });
    });

    // === 沟通记录（12条，跨6个月，4个角色） ===
    var commData = [
      // 今天-7天
      { d: 0,  t: '有效策略', c: '用"先...然后..."的方式讲解新任务，理解得很快。对公交车相关的比喻反应特别好。', a: 'teacher' },
      { d: -1, c: '给他两个选择时（A或B），能较快做出决定。直接问"你想做什么"时反而需要较长时间。今天在烘焙课和电子琴之间选择了烘焙。', a: 'teacher' },
      { d: -3, c: '今天尝试用图片卡片辅助沟通，对"下一步做什么"的理解明显提升。已经能主动指认"喝水""上厕所""想休息"三张卡片。', a: 'teacher' },
      { d: -5, c: '他主动跟志愿者说"谢谢"，声音不大但很清晰。平时需要提醒才说，今天是自发的。', a: 'caregiver' },
      { d: -6, t: '有效策略', c: '下雨天不能外出时，用画图的方式解释原因，比语言解释更容易接受。配合"雨停了再去"的约定，情绪平稳没有闹。', a: 'caregiver' },
      // 8-30天
      { d: -10, c: '发现用"上午做完这个，下午就可以去公园"的句式效果很好。他会更配合完成任务，还会自己重复确认"做完就可以去吗？"。', a: 'parent' },
      { d: -14, c: '新老师第一次接触时，他需要约15分钟熟悉期。建议新老师先安静在旁边观察，等他主动打招呼后再互动。', a: 'teacher' },
      { d: -22, t: '有效策略', c: '用手机录了一段妈妈的声音说明晚餐安排，他反复听了三遍。比起别人转述，直接听妈妈声音更安心。', a: 'parent' },
      { d: -28, c: '今天试着用"5分钟后要做XX"的方式提前告知，过渡很平稳。以前突然切换活动时容易闹情绪。', a: 'caregiver' },
      // 31-90天
      { d: -45, c: '心青年本人说：他最喜欢别人叫他"小雨"，不喜欢"这孩子""喂"。称呼对了之后，他回应得更快了。', a: 'youth' },
      { d: -60, c: '用步骤卡片（1-2-3）代替口述指令后，任务完成率从约50%提升到了约80%。特别是烘焙流程，现在已经可以自己看卡片独立做了。', a: 'teacher' },
      { d: -80, c: '发现他紧张时会反复搓手，这时候问他问题不会得到回答。正确做法是停下来等一两分钟，或者给他看熟悉的图片。', a: 'caregiver' },
      // 91-180天
      { d: -120, c: '第一次用公交车站牌图片做沟通工具，他对这个特别感兴趣，能指着站名牌跟我讲好久。后续可以多用公交相关素材。', a: 'parent' }
    ];

    commData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('communication', {
        title: item.t || '',
        content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60))
      });
    });

    // === 沟通策略效果记录（8条，验证哪些方法有效） ===
    var commStrategyData = [
      { d: -2,  t: '先…然后…句式', e: 5, c: '用先…然后…安排烘焙课流程，小雨完全按步骤执行，没有需要额外提醒。', a: 'teacher' },
      { d: -4,  t: '二选一问法',   e: 4, c: '二选一方式给小雨选下午活动，他很快选了公园散步。', a: 'teacher' },
      { d: -7,  t: '图片卡片',     e: 5, c: '卡片沟通今天用了4次，每次都正确指认。准备增加"想出去走走""帮忙"两张新卡片。', a: 'teacher' },
      { d: -15, t: '画图解释',     e: 4, c: '用画图解释下午活动变更，小雨看了之后点头表示理解了。', a: 'caregiver' },
      { d: -23, t: '录音传达',     e: 5, c: '妈妈录音说明睡前安排，小雨听了很安心，自己主动去刷牙了。', a: 'parent' },
      { d: -35, t: '提前告知过渡', e: 4, c: '用"5分钟后我们要去吃饭了"，小雨能接受并开始收拾东西。', a: 'caregiver' },
      { d: -50, t: '步骤卡片',     e: 5, c: '用1-2-3步骤卡片替代口述，小雨已经可以独立看卡片完成烘焙流程。从第3步开始他会自言自语"然后…"。', a: 'teacher' },
      { d: -75, t: '等待+安静陪伴',e: 4, c: '小雨紧张搓手时，安静等待1分钟后他开始说话了。比直接追问效果好很多。', a: 'caregiver' }
    ];

    commStrategyData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('strategy', {
        title: item.t, content: item.c, effectiveness: item.e,
        module: 'communication',
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(10 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60))
      });
    });

    // === 陪伴记录（已转为note类型，volunteer角色已移除） ===
    var accompData = [
      { d: -1, t: '陪伴散步', c: '陪小雨去公园散步，对公交车经过很感兴趣，能准确说出线路号。', a: 'caregiver' },
      { d: -9, t: '陪伴拼模型', c: '一起拼公交车模型，小雨很专注，能按步骤完成，还主动帮忙整理零件。', a: 'caregiver' },
      { d: -27, t: '陪伴看猫', c: '去新公园看到了很多流浪猫，小雨主动走近观察，还轻声跟猫说话。', a: 'caregiver' }
    ];

    accompData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('note', {
        title: item.t, content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(15, Math.floor(Math.random() * 60))
      });
    });

    // === 备注 ===
    var noteData = [
      { d: -1, t: '睡眠质量', c: '昨晚入睡晚了约20分钟，可能和白天情绪稍紧张有关。夜间没有醒。', a: 'parent' },
      { d: -7, t: '药物记录', c: '按时服药，没有不良反应。', a: 'parent' },
      { d: -14, t: '体检预约', c: '已预约8月15日的年度体检，需要带身份证和医保卡。', a: 'parent' },
      { d: -25, t: '天气变化', c: '近期多雨，注意室内活动安排，避免情绪因不能外出而波动。', a: 'teacher' }
    ];

    noteData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('note', {
        title: item.t, content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60))
      });
    });

    return records;
  }

  /** 生成示例任务数据（routine + adhoc 双模式） */
  function generateSampleTasks() {
    var today = window.getTodayString();
    var tasks = [];

    // ======== 规律任务 routine ========

    // 每日例行
    var dailyRoutines = [
      { id: 'task_1', title: '起床洗漱', icon: '🪥', category: 'hygiene', time: '08:30', assignee: 'youth' },
      { id: 'task_2', title: '早餐', icon: '🍞', category: 'meal', time: '09:00', assignee: 'parent' },
      { id: 'task_3', title: '机构活动', icon: '🎨', category: 'activity', time: '10:00', assignee: 'teacher' },
      { id: 'task_4', title: '午餐', icon: '🍱', category: 'meal', time: '11:30', assignee: 'caregiver' },
      { id: 'task_5', title: '午休', icon: '😴', category: 'hygiene', time: '12:30', assignee: 'youth' },
      { id: 'task_6', title: '下午活动', icon: '🧩', category: 'activity', time: '13:30', assignee: 'teacher' },
      { id: 'task_7', title: '晚餐', icon: '🍽️', category: 'meal', time: '17:30', assignee: 'parent' },
      { id: 'task_8', title: '晚间放松', icon: '📺', category: 'other', time: '18:30', assignee: 'youth' },
      { id: 'task_9', title: '洗漱准备', icon: '🚿', category: 'hygiene', time: '20:00', assignee: 'youth' },
      { id: 'task_10', title: '睡前安静时间', icon: '📖', category: 'other', time: '20:30', assignee: 'parent' },
      { id: 'task_11', title: '入睡', icon: '🌙', category: 'hygiene', time: '21:00', assignee: 'youth' },
      { id: 'task_12', title: '夜班照护', icon: '🏠', category: 'other', time: '21:30', assignee: 'parent' }
    ];

    dailyRoutines.forEach(function (t) {
      tasks.push({
        id: t.id, title: t.title, icon: t.icon, category: t.category,
        type: 'routine', pattern: 'daily', weekdays: [],
        time: t.time, dueDate: null, dueTime: null,
        assignee: t.assignee, isActive: true,
        createdAt: today, createdBy: 'parent'
      });
    });

    // 每周规律
    var weeklyRoutines = [
      { id: 'task_w1', title: '烘焙练习', icon: '🍪', category: 'activity', time: '14:00', weekdays: [1, 3, 5], assignee: 'teacher' },
      { id: 'task_w2', title: '电子琴练习', icon: '🎹', category: 'learning', time: '16:00', weekdays: [2, 4], assignee: 'teacher' },
      { id: 'task_w3', title: '社区散步', icon: '🚶', category: 'activity', time: '15:30', weekdays: [1, 3, 6], assignee: 'caregiver' },
      { id: 'task_w4', title: '感统训练', icon: '🧘', category: 'activity', time: '10:00', weekdays: [2, 4], assignee: 'teacher' },
      { id: 'task_w5', title: '支持性就业模拟', icon: '💼', category: 'learning', time: '16:00', weekdays: [1, 3, 5], assignee: 'teacher' }
    ];

    weeklyRoutines.forEach(function (t) {
      tasks.push({
        id: t.id, title: t.title, icon: t.icon, category: t.category,
        type: 'routine', pattern: 'weekly', weekdays: t.weekdays,
        time: t.time, dueDate: null, dueTime: null,
        assignee: t.assignee, isActive: true,
        createdAt: today, createdBy: 'parent'
      });
    });

    // ======== 临时任务 adhoc ========
    var adhocTasks = [
      { id: 'task_a1', title: '年度体检', icon: '🏥', category: 'other', dueDate: (function () { var d = new Date(); d.setDate(d.getDate() + 5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })(), dueTime: '09:00', assignee: 'parent' },
      { id: 'task_a2', title: 'IEP季度评估', icon: '📋', category: 'learning', dueDate: (function () { var d = new Date(); d.setDate(d.getDate() + 3); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })(), dueTime: '10:00', assignee: 'teacher' },
      { id: 'task_a3', title: '购买新画材', icon: '🎨', category: 'other', dueDate: (function () { var d = new Date(); d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })(), dueTime: '14:00', assignee: 'parent' },
      { id: 'task_a4', title: '预约牙科检查', icon: '🦷', category: 'other', dueDate: (function () { var d = new Date(); d.setDate(d.getDate() + 7); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })(), dueTime: null, assignee: 'parent' }
    ];

    adhocTasks.forEach(function (t) {
      tasks.push({
        id: t.id, title: t.title, icon: t.icon, category: t.category,
        type: 'adhoc', pattern: null, weekdays: [],
        time: null, dueDate: t.dueDate, dueTime: t.dueTime,
        assignee: t.assignee, isActive: true,
        createdAt: today, createdBy: 'parent'
      });
    });

    return tasks;
  }

  /** 生成示例每日任务实例（供今日使用） */
  function generateSampleTaskInstances(dateStr) {
    dateStr = dateStr || window.getTodayString();
    var tasks = generateSampleTasks();
    var routines = tasks.filter(function (t) { return t.type === 'routine' && t.isActive; });
    var jsDay = new Date(dateStr + 'T00:00:00').getDay();
    var weekday = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun

    var instances = [];

    routines.forEach(function (task) {
      var shouldGenerate = false;
      if (task.pattern === 'daily') {
        shouldGenerate = true;
      } else if (task.pattern === 'weekly') {
        shouldGenerate = task.weekdays && task.weekdays.indexOf(weekday) !== -1;
      }
      if (!shouldGenerate) return;

      instances.push({
        id: 'inst_' + task.id + '_' + dateStr,
        taskId: task.id,
        date: dateStr,
        status: 'todo',
        completedAt: null,
        note: ''
      });
    });

    return instances;
  }

  /** 生成示例日程数据 */
  function generateSampleEvents() {
    var today = window.getTodayString();
    var parts = today.split('-');
    var y = parseInt(parts[0]);
    var m = parseInt(parts[1]);
    var d = parseInt(parts[2]);
    function dateStr(offset) {
      var dt = new Date(y, m - 1, d + offset);
      return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    }
    var dayOffset = d - 1;

    var events = [];

    // 每日重复事件 — 睡前准备
    for (var i = 0; i <= dayOffset + 7; i++) {
      events.push({
        id: 'evt_sleep_' + i, title: '睡前准备', type: 'reminder', icon: '🌙',
        date: dateStr(-dayOffset + i), time: '21:30', description: '晚间照护确认入睡',
        recurring: 'daily', priority: 'medium', color: '#D97757',
        author: '妈妈', authorRole: 'parent', createdAt: today
      });
    }

    // 每周五志愿者陪伴
    function getFriday(offset) {
      var dt = new Date(y, m - 1, d);
      var day = dt.getDay();
      var diff = 5 - day + offset * 7;
      var friday = new Date(y, m - 1, d + diff);
      return friday.getFullYear() + '-' + String(friday.getMonth() + 1).padStart(2, '0') + '-' + String(friday.getDate()).padStart(2, '0');
    }
    events.push({ id: 'evt_vol_1', title: '影子老师陪伴', type: 'activity', icon: '🤝', date: getFriday(0), time: '15:00', endTime: '16:30', description: '影子老师张阿姨下午来陪伴散步', recurring: 'weekly', priority: 'low', color: '#13C2C2', author: '妈妈', authorRole: 'parent', createdAt: today });
    events.push({ id: 'evt_vol_2', title: '影子老师陪伴', type: 'activity', icon: '🤝', date: getFriday(-1), time: '15:00', endTime: '16:30', description: '影子老师张阿姨下午来陪伴散步', recurring: 'weekly', priority: 'low', color: '#13C2C2', author: '妈妈', authorRole: 'parent', createdAt: today });
    if (dayOffset >= 7) {
      events.push({ id: 'evt_vol_3', title: '影子老师陪伴', type: 'activity', icon: '🤝', date: getFriday(-2), time: '15:00', endTime: '16:30', description: '影子老师张阿姨下午来陪伴散步', recurring: 'weekly', priority: 'low', color: '#13C2C2', author: '妈妈', authorRole: 'parent', createdAt: today });
    }

    // 本月散布的单次事件
    var monthEvents = [
      { offset: -dayOffset + 1, title: '机构晨检', type: 'medical', icon: '🏥', time: '08:00', endTime: '08:30', desc: '月初健康检查，量体温、称体重', priority: 'medium', color: '#C96E68' },
      { offset: -dayOffset + 2, title: '烘焙课', type: 'activity', icon: '🍪', time: '10:00', endTime: '11:30', desc: '学习制作曲奇饼干', priority: 'low', color: '#E7B95E' },
      { offset: -dayOffset + 3, title: '电子琴课', type: 'activity', icon: '🎹', time: '14:00', endTime: '15:00', desc: '练习《小星星》完整弹奏', priority: 'low', color: '#13C2C2' },
      { offset: -dayOffset + 4, title: '社区适应训练', type: 'activity', icon: '🚶', time: '09:30', endTime: '11:00', desc: '去超市购物练习，学习认价格标签', priority: 'medium', color: '#D97757' },
      { offset: -dayOffset + 5, title: '绘画课', type: 'activity', icon: '🎨', time: '10:00', endTime: '11:30', desc: '画公交车主题的水彩画', priority: 'low', color: '#E7B95E' },
      { offset: -dayOffset + 6, title: 'IEP季度评估', type: 'meeting', icon: '📋', time: '10:00', endTime: '11:30', desc: 'Individualized Education Program 季度评估会议', priority: 'high', color: '#D97757' },
      { offset: -dayOffset + 7, title: '家长交流会', type: 'meeting', icon: '👩\u200d👩\u200d👦', time: '14:00', endTime: '15:30', desc: '机构家长交流会，分享照护经验', priority: 'medium', color: '#D97757' },
      { offset: -dayOffset + 8, title: '感统训练', type: 'activity', icon: '🧘', time: '10:00', endTime: '11:00', desc: '感觉统合训练，平衡木和触觉练习', priority: 'medium', color: '#6FA789' },
      { offset: -dayOffset + 9, title: '烘焙课', type: 'activity', icon: '🍪', time: '10:00', endTime: '11:30', desc: '学习制作小蛋糕', priority: 'low', color: '#E7B95E' },
      { offset: -dayOffset + 10, title: '户外安全演练', type: 'activity', icon: '⚠️', time: '14:00', endTime: '15:00', desc: '学习过马路、识别红绿灯', priority: 'high', color: '#C96E68' },
      { offset: -dayOffset + 11, title: '音乐课', type: 'activity', icon: '🎵', time: '10:00', endTime: '11:00', desc: '学习节奏拍打和简单合唱', priority: 'low', color: '#F5E6D3' },
      { offset: -dayOffset + 12, title: '体育活动', type: 'activity', icon: '⚽', time: '15:00', endTime: '16:00', desc: '机构运动会，参加接力跑和投球', priority: 'medium', color: '#6FA789' },
      { offset: -dayOffset + 14, title: '口腔检查', type: 'medical', icon: '🦷', time: '09:00', endTime: '10:00', desc: '社区医院口腔检查', priority: 'medium', color: '#C96E68' },
      { offset: -dayOffset + 15, title: '感统训练', type: 'activity', icon: '🧘', time: '10:00', endTime: '11:00', desc: '触觉脱敏训练，接触不同材质', priority: 'medium', color: '#6FA789' },
      { offset: -dayOffset + 16, title: '社交技能课', type: 'activity', icon: '🗣️', time: '14:00', endTime: '15:00', desc: '学习打招呼和自我介绍', priority: 'medium', color: '#D97757' },
      { offset: -dayOffset + 17, title: '烘焙课', type: 'activity', icon: '🍪', time: '10:00', endTime: '11:30', desc: '学习制作面包', priority: 'low', color: '#E7B95E' },
      { offset: -dayOffset + 18, title: '电子琴课', type: 'activity', icon: '🎹', time: '14:00', endTime: '15:00', desc: '学习《小星星》变奏', priority: 'low', color: '#13C2C2' },
      { offset: -dayOffset + 19, title: '心理咨询', type: 'medical', icon: '🧠', time: '10:00', endTime: '11:00', desc: '月度心理咨询评估', priority: 'high', color: '#F5E6D3' },
      { offset: -dayOffset + 20, title: '社区散步', type: 'activity', icon: '🚶', time: '15:00', endTime: '16:30', desc: '去公园散步，观察流浪猫', priority: 'low', color: '#13C2C2' },
      { offset: -dayOffset + 21, title: '烘焙课结业展示', type: 'activity', icon: '🏆', time: '14:00', endTime: '16:00', desc: '机构烘焙课程结业展示，家长可以参加', priority: 'high', color: '#E7B95E' },
      { offset: -dayOffset + 22, title: '家长面谈', type: 'meeting', icon: '👩', time: '10:00', endTime: '11:00', desc: '与李老师一对一面谈，了解本月进展', priority: 'medium', color: '#D97757' },
      { offset: -dayOffset + 23, title: '感统训练', type: 'activity', icon: '🧘', time: '10:00', endTime: '11:00', desc: '大运动协调训练', priority: 'medium', color: '#6FA789' },
      { offset: -dayOffset + 25, title: '机构开放日', type: 'activity', icon: '🏫', time: '09:00', endTime: '12:00', desc: '机构开放日，展示学员作品', priority: 'medium', color: '#D97757' },
      { offset: -dayOffset + 27, title: '支持性就业评估', type: 'meeting', icon: '💼', time: '10:00', endTime: '11:30', desc: '评估支持性就业进展和能力', priority: 'high', color: '#D97757' }
    ];

    monthEvents.forEach(function(e, idx) {
      var evtDate = dateStr(e.offset);
      if (e.offset >= -dayOffset && e.offset <= 10) {
        events.push({
          id: 'evt_m_' + idx, title: e.title, type: e.type, icon: e.icon,
          date: evtDate, time: e.time, endTime: e.endTime || '',
          description: e.desc, recurring: 'none', priority: e.priority,
          color: e.color,
          author: e.priority === 'high' ? '妈妈' : '李老师',
          authorRole: e.priority === 'high' ? 'parent' : 'teacher',
          createdAt: today
        });
      }
    });

    // 重要的未来事件
    events.push({ id: 'evt_checkup', title: '年度体检', type: 'medical', icon: '🏥', date: dateStr(5), time: '09:00', endTime: '11:00', description: '市残联年度体检，需带身份证和医保卡', recurring: 'yearly', priority: 'high', color: '#C96E68', author: '妈妈', authorRole: 'parent', createdAt: today });
    events.push({ id: 'evt_iep', title: 'IEP会议', type: 'meeting', icon: '📋', date: dateStr(3), time: '10:00', endTime: '11:30', description: 'Individualized Education Program 季度评估会议', recurring: 'none', priority: 'high', color: '#D97757', author: '李老师', authorRole: 'teacher', createdAt: today });

    return events;
  }

  /** DataStore - 封装所有localStorage操作 */
  var DataStore = {
    init: function () {
      var data = this.load();
      var needReset = false;

      if (!data) {
        data = { version: DATA_VERSION, currentUser: null, users: [], records: [] };
        needReset = true;
      }

      if (data.version !== DATA_VERSION) {
        data.version = DATA_VERSION;
        data.records = [];
        data.users = [];
        needReset = true;
      }

      if (!data.users) {
        data.users = [];
        needReset = true;
      }

      if (data.users.length === 0) {
        data.users = generateSampleUsers();
        needReset = true;
      }

      if (!data.records || data.records.length < 5) {
        data.records = generateSampleRecords();
        needReset = true;
      }

      if (!data.tasks || data.tasks.length === 0) {
        data.tasks = generateSampleTasks();
        needReset = true;
      }

      if (!data.events || data.events.length === 0) {
        data.events = generateSampleEvents();
        needReset = true;
      }

      // 初始化 primaryYouthMap，将 sample 家长关联到 sample 心青年
      if (!data.primaryYouthMap || Object.keys(data.primaryYouthMap).length === 0) {
        data.primaryYouthMap = { 'u_sample_parent': 'u_sample_youth' };
        needReset = true;
      }

      if (needReset) {
        this.save(data);
      }

      // 自动生成今日任务实例（幂等）
      var todayStr = window.getTodayString();
      var todayInstances = this._loadByKey(INSTANCE_KEY_PREFIX + todayStr);
      if (!todayInstances || todayInstances.length === 0) {
        var sampleInsts = generateSampleTaskInstances(todayStr);
        this._saveByKey(INSTANCE_KEY_PREFIX + todayStr, sampleInsts);
      }

      return data;
    },

    load: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.error('DataStore加载失败:', e);
        return null;
      }
    },

    save: function (data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('DataStore保存失败:', e);
      }
    },

    getRecords: function () {
      var data = this.load();
      return data && data.records ? data.records : [];
    },

    getRecordsByModule: function (moduleKey) {
      var records = this.getRecords();
      return records.filter(function (r) { return r.module === moduleKey; });
    },

    getRecordsByDateRange: function (startDate, endDate) {
      var records = this.getRecords();
      return records.filter(function (r) {
        return r.date >= startDate && r.date <= endDate;
      });
    },

    addRecord: function (record) {
      var data = this.load();
      if (!data) { data = { version: 1, currentUser: null, records: [] }; }
      if (!data.records) data.records = [];

      var newRecord = Object.assign({}, record, {
        id: window.generateUUID(),
        date: record.date || window.getTodayString(),
        time: record.time || window.getNowTimeString()
      });

      data.records.unshift(newRecord);
      this.save(data);
      return newRecord;
    },

    deleteRecord: function (id) {
      var data = this.load();
      if (!data || !data.records) return false;
      data.records = data.records.filter(function (r) { return r.id !== id; });
      this.save(data);
      return true;
    },

    getCurrentUser: function () {
      // 优先从 sessionStorage 读取（关闭标签页后自动清除）
      try {
        var sess = sessionStorage.getItem(CURRENT_USER_KEY);
        if (sess) return JSON.parse(sess);
      } catch (e) {}
      return null;
    },

    setCurrentUser: function (user) {
      // 存入 sessionStorage（不持久化登录态，每次打开新标签需重新登录）
      try {
        if (user) {
          sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        } else {
          sessionStorage.removeItem(CURRENT_USER_KEY);
        }
      } catch (e) {}
      // 同时在主数据中也记录 currentUser（兼容其他读取路径）
      var data = this.load();
      if (!data) { data = { version: DATA_VERSION, currentUser: user, users: [], records: [] }; }
      else { data.currentUser = user; }
      this.save(data);
    },

    getAllUsers: function () {
      var data = this.load();
      return data && data.users ? data.users : [];
    },

    registerUser: function (name, role, pin) {
      var data = this.load();
      if (!data) { data = { version: DATA_VERSION, currentUser: null, users: [], records: [] }; }
      if (!data.users) data.users = [];

      var existing = data.users.find(function (u) { return u.name === name && u.role === role; });
      if (existing) {
        if (existing.pin === pin) { return { success: true, user: existing, isNew: false }; }
        else { return { success: false, message: '该角色下已存在同名用户，PIN码不匹配，请重试或联系管理员' }; }
      }

      var roleConfig = ROLES[role];
      var newUser = {
        id: window.generateUserId(),
        name: name, role: role, pin: pin,
        avatar: roleConfig ? roleConfig.avatar : '👤',
        createdAt: window.getTodayString()
      };

      data.users.push(newUser);
      this.save(data);
      return { success: true, user: newUser, isNew: true };
    },

    findUserByNameAndPin: function (name, pin) {
      var data = this.load();
      if (!data || !data.users) return null;
      return data.users.find(function (u) { return u.name === name && u.pin === pin; }) || null;
    },

    findUserById: function (id) {
      var data = this.load();
      if (!data || !data.users) return null;
      return data.users.find(function (u) { return u.id === id; }) || null;
    },

    updateUserRole: function (userId, newRole) {
      var data = this.load();
      if (!data || !data.users) return false;
      var user = data.users.find(function (u) { return u.id === userId; });
      if (!user) return false;
      user.role = newRole;
      var roleConfig = ROLES[newRole];
      if (roleConfig) user.avatar = roleConfig.avatar;
      this.save(data);
      return true;
    },

    removeUser: function (userId) {
      var data = this.load();
      if (!data || !data.users) return false;
      var idx = data.users.findIndex(function (u) { return u.id === userId; });
      if (idx === -1) return false;
      data.users.splice(idx, 1);
      // 同时清理该用户的相关授权
      if (data.grants) {
        data.grants = data.grants.filter(function (g) { return g.userId !== userId; });
      }
      this.save(data);
      return true;
    },

    // ========== 辅助：按任意 key 读写 localStorage ==========

    _loadByKey: function(key) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error('_loadByKey失败:', e);
        return null;
      }
    },

    _saveByKey: function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('_saveByKey失败:', e);
      }
    },

    // ========== 任务 CRUD ==========

    /** 获取所有任务（含软删除的） */
    getTasks: function(includeInactive) {
      var data = this.load();
      var tasks = (data && data.tasks) ? data.tasks : [];
      if (!includeInactive) {
        tasks = tasks.filter(function (t) { return t.isActive !== false; });
      }
      return tasks;
    },

    /** 新增任务 */
    addTask: function(task) {
      var data = this.load();
      if (!data.tasks) data.tasks = [];
      var newTask = Object.assign({}, task, {
        id: 'task_' + window.generateUUID(),
        isActive: true,
        createdAt: window.getTodayString()
      });
      // 补全 routine 默认字段
      if (newTask.type === 'routine') {
        newTask.pattern = newTask.pattern || 'daily';
        newTask.weekdays = newTask.weekdays || [];
        newTask.time = newTask.time || '09:00';
        newTask.dueDate = null;
        newTask.dueTime = null;
      }
      // 补全 adhoc 默认字段
      if (newTask.type === 'adhoc') {
        newTask.pattern = null;
        newTask.weekdays = [];
        newTask.time = null;
      }
      data.tasks.push(newTask);
      this.save(data);
      return newTask;
    },

    /** 更新任务字段 */
    updateTask: function(taskId, updates) {
      var data = this.load();
      if (!data || !data.tasks) return null;
      var task = data.tasks.find(function (t) { return t.id === taskId; });
      if (!task) return null;
      Object.keys(updates).forEach(function (k) {
        task[k] = updates[k];
      });
      this.save(data);
      return task;
    },

    /** 软删除任务（isActive = false），不可恢复 */
    deleteTask: function(taskId) {
      var data = this.load();
      if (!data || !data.tasks) return false;
      var task = data.tasks.find(function (t) { return t.id === taskId; });
      if (!task) return false;
      task.isActive = false;
      this.save(data);
      return true;
    },

    // ========== 每日任务实例 ==========

    /** 获取指定日期的任务实例 */
    getTaskInstances: function(dateStr) {
      dateStr = dateStr || window.getTodayString();
      return this._loadByKey(INSTANCE_KEY_PREFIX + dateStr) || [];
    },

    /** 更新单个任务实例（状态/备注/完成时间） */
    updateTaskInstance: function(instanceId, dateStr, updates) {
      dateStr = dateStr || window.getTodayString();
      var instances = this._loadByKey(INSTANCE_KEY_PREFIX + dateStr) || [];
      var inst = instances.find(function (i) { return i.id === instanceId; });
      if (!inst) return null;
      Object.keys(updates).forEach(function (k) {
        inst[k] = updates[k];
      });
      // 如果状态变为 done，自动记录完成时间
      if (updates.status === 'done' && !inst.completedAt) {
        inst.completedAt = new Date().toISOString();
      }
      // 如果状态从 done 改回其他，清除完成时间
      if (updates.status && updates.status !== 'done') {
        inst.completedAt = null;
      }
      this._saveByKey(INSTANCE_KEY_PREFIX + dateStr, instances);
      return inst;
    },

    // ========== 规律任务引擎 ==========

    /**
     * 为指定日期生成任务实例（幂等）
     * 读取所有 active 的 routine 任务，根据 pattern 和 weekdays 判断是否生成
     * 已有实例则跳过
     */
    generateDailyInstances: function(dateStr) {
      dateStr = dateStr || window.getTodayString();
      var tasks = this.getTasks();
      var routines = tasks.filter(function (t) { return t.type === 'routine' && t.isActive; });
      var jsDay = new Date(dateStr + 'T00:00:00').getDay();
      var weekday = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun

      var existingInstances = this._loadByKey(INSTANCE_KEY_PREFIX + dateStr) || [];
      var newInstances = [];

      routines.forEach(function (task) {
        var shouldGenerate = false;

        if (task.pattern === 'daily') {
          shouldGenerate = true;
        } else if (task.pattern === 'weekly') {
          shouldGenerate = task.weekdays && task.weekdays.indexOf(weekday) !== -1;
        }
        // custom 暂时不处理

        if (!shouldGenerate) return;

        // 幂等检查：该任务今日是否已有实例
        var exists = existingInstances.some(function (inst) { return inst.taskId === task.id; });
        if (exists) return;

        newInstances.push({
          id: 'inst_' + task.id + '_' + dateStr,
          taskId: task.id,
          date: dateStr,
          status: 'todo',
          completedAt: null,
          note: ''
        });
      });

      if (newInstances.length > 0) {
        var merged = existingInstances.concat(newInstances);
        this._saveByKey(INSTANCE_KEY_PREFIX + dateStr, merged);
      }

      return this._loadByKey(INSTANCE_KEY_PREFIX + dateStr) || [];
    },

    getEvents: function() {
      var data = this.load();
      return data && data.events ? data.events : [];
    },

    addEvent: function(event) {
      var data = this.load();
      if (!data.events) data.events = [];
      var newEvent = Object.assign({}, event, { id: 'evt_' + window.generateUUID(), createdAt: window.getTodayString() });
      data.events.push(newEvent);
      this.save(data);
      return newEvent;
    },

    deleteEvent: function(eventId) {
      var data = this.load();
      if (!data || !data.events) return;
      data.events = data.events.filter(function(e) { return e.id !== eventId; });
      this.save(data);
    },

    getEventsByDate: function(dateStr) {
      return this.getEvents().filter(function(e) { return e.date === dateStr; });
    },

    getAllData: function() {
      var data = this.load();
      return data || { version: DATA_VERSION, currentUser: null, users: [], records: [], tasks: [], events: [] };
    },

    /* ---- 内部辅助 ---- */
    _loadByKey: function (key) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    _saveByKey: function (key, data) {
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    },

    /* ==========================================================
     * 协作网络 — 授权关系
     * grants: [{id, youthId, userId, role, relation, status:'active', createdAt}]
     * ========================================================== */
    getGrants: function () {
      return this._loadByKey(GRANTS_KEY) || [];
    },
    saveGrants: function (grants) {
      this._saveByKey(GRANTS_KEY, grants);
    },
    addGrant: function (grant) {
      var grants = this.getGrants();
      grant.id = grant.id || 'grant_' + window.generateUUID();
      grant.createdAt = grant.createdAt || window.getTodayString();
      grant.status = grant.status || 'active';
      grants.push(grant);
      this.saveGrants(grants);
      return grant;
    },
    /** 获取某个 youth 的所有授权用户 */
    getGrantsByYouth: function (youthId) {
      return this.getGrants().filter(function (g) { return g.youthId === youthId && g.status === 'active'; });
    },
    /** 获取某个用户被授权访问哪些 youth */
    getGrantsByUser: function (userId) {
      return this.getGrants().filter(function (g) { return g.userId === userId && g.status === 'active'; });
    },
    removeGrant: function (grantId) {
      var grants = this.getGrants().map(function (g) {
        if (g.id === grantId) { g.status = 'revoked'; }
        return g;
      });
      this.saveGrants(grants);
    },

    /* ==========================================================
     * 协作网络 — 邀请码
     * invitations: [{code, youthId, createdBy, role, relation, expiresAt, used:false}]
     * ========================================================== */
    getInvitations: function () {
      return this._loadByKey(INVITATIONS_KEY) || [];
    },
    saveInvitations: function (invitations) {
      this._saveByKey(INVITATIONS_KEY, invitations);
    },
    /** 生成一个 6 位字母数字混合邀请码 */
    generateInviteCode: function () {
      var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      var code = '';
      for (var i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    },
    createInvitation: function (opts) {
      var invitations = this.getInvitations();
      var code = this.generateInviteCode();
      // 确保唯一
      while (invitations.some(function (inv) { return inv.code === code && !inv.used; })) {
        code = this.generateInviteCode();
      }
      var exp = new Date();
      exp.setDate(exp.getDate() + 7); // 7天过期
      var invitation = {
        code: code,
        youthId: opts.youthId,
        createdBy: opts.createdBy,
        role: opts.role,
        relation: opts.relation,
        expiresAt: exp.toISOString().split('T')[0],
        used: false,
        createdAt: window.getTodayString()
      };
      invitations.push(invitation);
      this.saveInvitations(invitations);
      return invitation;
    },
    findInvitation: function (code) {
      var invitations = this.getInvitations();
      var today = window.getTodayString();
      return invitations.find(function (inv) {
        return inv.code === code && !inv.used && inv.expiresAt >= today;
      }) || null;
    },
    markInvitationUsed: function (code) {
      var invitations = this.getInvitations();
      invitations.forEach(function (inv) {
        if (inv.code === code) { inv.used = true; }
      });
      this.saveInvitations(invitations);
    },

    /* ==========================================================
     * 协作网络 — 加入申请
     * join_requests: [{id, userId, userName, userRole, invitationCode, relation, youthId, status, createdAt}]
     * ========================================================== */
    getJoinRequests: function () {
      return this._loadByKey(JOIN_REQUESTS_KEY) || [];
    },
    saveJoinRequests: function (requests) {
      this._saveByKey(JOIN_REQUESTS_KEY, requests);
    },
    addJoinRequest: function (req) {
      var requests = this.getJoinRequests();
      req.id = req.id || 'jr_' + window.generateUUID();
      req.createdAt = req.createdAt || window.getTodayString();
      req.status = req.status || 'pending';
      requests.push(req);
      this.saveJoinRequests(requests);
      return req;
    },
    /** 获取某个 youth 的待审批申请 */
    getPendingRequestsByYouth: function (youthId) {
      return this.getJoinRequests().filter(function (r) {
        return r.youthId === youthId && r.status === 'pending';
      });
    },
    updateJoinRequestStatus: function (requestId, status) {
      var requests = this.getJoinRequests();
      requests.forEach(function (r) {
        if (r.id === requestId) { r.status = status; }
      });
      this.saveJoinRequests(requests);
    },

    /* ==========================================================
     * 协作网络 — 家庭关系
     * family_relations: {youthId: [{userId, relation}]}
     * ========================================================== */
    getFamilyRelations: function () {
      return this._loadByKey(FAMILY_RELATIONS_KEY) || {};
    },
    saveFamilyRelations: function (relations) {
      this._saveByKey(FAMILY_RELATIONS_KEY, relations);
    },
    /** 为某个 youth 添加家庭成员 */
    addFamilyMember: function (youthId, userId, relation) {
      var relations = this.getFamilyRelations();
      if (!relations[youthId]) { relations[youthId] = []; }
      // 避免重复
      var exists = relations[youthId].some(function (m) { return m.userId === userId; });
      if (!exists) {
        relations[youthId].push({ userId: userId, relation: relation });
      }
      this.saveFamilyRelations(relations);
    },
    /** 建议每个用户绑定一个主 youth（家长首次创建档案时使用） */
    setPrimaryYouth: function (userId, youthId) {
      var data = this.load();
      if (!data.primaryYouthMap) { data.primaryYouthMap = {}; }
      data.primaryYouthMap[userId] = youthId;
      this.save(data);
    },
    getPrimaryYouth: function (userId) {
      var data = this.load();
      return (data && data.primaryYouthMap) ? data.primaryYouthMap[userId] : null;
    },

    /* ==========================================================
     * 操作日志 — 审计追踪
     * audit_log: [{id, action, actorId, actorName, targetId,
     *   targetName, detail, undoData, createdAt, reverted}]
     * ========================================================== */
    AUDIT_KEY: 'ai_dongwo_audit_log',
    getAuditLog: function () {
      return this._loadByKey(this.AUDIT_KEY) || [];
    },
    saveAuditLog: function (logs) {
      this._saveByKey(this.AUDIT_KEY, logs);
    },
    addAuditEntry: function (entry) {
      var logs = this.getAuditLog();
      entry.id = entry.id || 'log_' + window.generateUUID();
      entry.createdAt = entry.createdAt || window.getTodayString();
      entry.reverted = false;
      logs.unshift(entry);
      // 最多保留200条
      if (logs.length > 200) logs = logs.slice(0, 200);
      this.saveAuditLog(logs);
      return entry;
    },
    /** 撤销某条日志对应的操作（如果仍有 undoData） */
    revertAuditEntry: function (logId) {
      var logs = this.getAuditLog();
      var entry = logs.find(function (l) { return l.id === logId; });
      if (!entry || entry.reverted || !entry.undoData) return false;
      entry.reverted = true;
      this.saveAuditLog(logs);
      return entry.undoData;
    },
    /** 获取某个 youth 的操作日志 */
    getAuditLogByYouth: function (youthId) {
      return this.getAuditLog().filter(function (l) {
        return l.targetId === youthId || (l.undoData && l.undoData.youthId === youthId);
      });
    },

    /* ==========================================================
     * 授权角色变更（带审计日志）
     * ========================================================== */
    updateGrantRole: function (grantId, newRole, actor) {
      var grants = this.getGrants();
      var grant = grants.find(function (g) { return g.id === grantId; });
      if (!grant) return false;
      var oldRole = grant.role;
      grant.role = newRole;
      this.saveGrants(grants);
      // 写审计日志
      var targetUser = this.findUserById(grant.userId);
      this.addAuditEntry({
        action: 'role_change',
        actorId: actor.id, actorName: actor.name,
        targetId: grant.userId, targetName: targetUser ? targetUser.name : '未知用户',
        detail: '角色从「' + (window.Constants.ROLES[oldRole] ? window.Constants.ROLES[oldRole].label : oldRole) + '」变更为「' + (window.Constants.ROLES[newRole] ? window.Constants.ROLES[newRole].label : newRole) + '」',
        undoData: { type: 'role_restore', grantId: grantId, oldRole: oldRole, newRole: newRole, grant: grant }
      });
      return true;
    },
    /** 撤销角色变更 */
    undoRoleChange: function (undoData) {
      var grants = this.getGrants();
      var grant = grants.find(function (g) { return g.id === undoData.grantId; });
      if (!grant) return false;
      grant.role = undoData.oldRole;
      this.saveGrants(grants);
      return true;
    },

    /* ==========================================================
     * 撤权（带审计日志）
     * ========================================================== */
    revokeGrant: function (grantId, actor) {
      var grants = this.getGrants();
      var grant = grants.find(function (g) { return g.id === grantId; });
      if (!grant) return false;
      grant.status = 'revoked';
      grant.revokedAt = window.getTodayString();
      this.saveGrants(grants);
      var targetUser = this.findUserById(grant.userId);
      this.addAuditEntry({
        action: 'revoke',
        actorId: actor.id, actorName: actor.name,
        targetId: grant.userId, targetName: targetUser ? targetUser.name : '未知用户',
        detail: '撤销了「' + (window.Constants.ROLES[grant.role] ? window.Constants.ROLES[grant.role].label : grant.role) + '」的授权',
        undoData: { type: 'grant_restore', grantId: grantId, grant: grant }
      });
      return true;
    },
    /** 恢复授权 */
    restoreGrant: function (grantId) {
      var grants = this.getGrants();
      var grant = grants.find(function (g) { return g.id === grantId; });
      if (!grant) return false;
      grant.status = 'active';
      delete grant.revokedAt;
      this.saveGrants(grants);
      return true;
    },

    /* ==========================================================
     * 获取即将到期的授权（7天内到期）
     * ========================================================== */
    getExpiringGrants: function (youthId) {
      var today = window.getTodayString();
      var expDate = new Date();
      expDate.setDate(expDate.getDate() + 7);
      var expStr = expDate.toISOString().split('T')[0];
      return this.getGrants().filter(function (g) {
        return g.youthId === youthId
          && g.status === 'active'
          && g.expiresAt
          && g.expiresAt >= today
          && g.expiresAt <= expStr;
      });
    },

    /* ==========================================================
     * 系统备份与恢复
     * ========================================================== */
    exportBackup: function () {
      var backup = {
        version: DATA_VERSION,
        exportedAt: new Date().toISOString(),
        data: this.load(),
        grants: this.getGrants(),
        invitations: this.getInvitations(),
        joinRequests: this.getJoinRequests(),
        familyRelations: this.getFamilyRelations(),
        auditLog: this.getAuditLog()
      };
      return backup;
    },
    importBackup: function (backup) {
      if (!backup || !backup.data) return false;
      this.save(backup.data);
      if (backup.grants) this.saveGrants(backup.grants);
      if (backup.invitations) this.saveInvitations(backup.invitations);
      if (backup.joinRequests) this.saveJoinRequests(backup.joinRequests);
      if (backup.familyRelations) this.saveFamilyRelations(backup.familyRelations);
      if (backup.auditLog) this.saveAuditLog(backup.auditLog);
      return true;
    },

    // ========== 照护信息（权威单一数据源） ==========

    _getCareDefaults: function() {
      // 优先从 Constants 取初始值，fallback 静态默认
      var C = window.Constants;
      if (C && C.careInfo) {
        return JSON.parse(JSON.stringify(C.careInfo));
      }
      return {
        allergy: { items: '无', level: '无' },
        medicine: '无',
        checkup: '无',
        special: '无',
        sleep: '无'
      };
    },

    /** 获取照护信息（读本地存储，首次从 Constants 初始化） */
    getCareInfo: function() {
      var data = this.load();
      if (data && data.careInfo) return data.careInfo;
      // 首次初始化
      var defaults = this._getCareDefaults();
      if (!data) data = { version: DATA_VERSION };
      data.careInfo = defaults;
      this.save(data);
      return defaults;
    },

    /**
     * 更新照护信息（带冲突检测）
     * 返回 { success, conflict?, data }
     */
    updateCareInfo: function(updates) {
      var current = this.getCareInfo();
      var merged = Object.assign({}, current, updates);
      var conflict = this.validateMedicalConsistency(merged);
      if (conflict) {
        return { success: false, conflict: conflict, data: current };
      }
      var data = this.load() || {};
      data.careInfo = merged;
      this.save(data);
      return { success: true, conflict: null, data: merged };
    },

    /** 强制写入（绕过冲突检测，高风险操作） */
    forceUpdateCareInfo: function(updates) {
      var data = this.load() || {};
      if (!data.careInfo) data.careInfo = this._getCareDefaults();
      Object.keys(updates).forEach(function(k) {
        data.careInfo[k] = updates[k];
      });
      this.save(data);
      return data.careInfo;
    },

    /**
     * 医疗信息一致性校验
     * @param {object} [careInfoOverride] 可选，检测指定值而非当前存储值
     */
    validateMedicalConsistency: function(careInfoOverride) {
      var ci = careInfoOverride || this.getCareInfo();
      var medValue = (ci.medicine || '').trim();
      // 有明确用药信息 → 不冲突
      if (medValue && medValue !== '无' && medValue !== '无长期用药' && medValue !== '无用药') {
        return null;
      }

      var tasks = this.getTasks();
      var medTasks = tasks.filter(function(t) {
        return t.category === 'medication' && t.isActive !== false;
      });
      var events = this.getEvents ? this.getEvents() : [];
      var medEvents = events.filter(function(e) {
        return e.title && (e.title.indexOf('服药') !== -1 || e.title.indexOf('用药') !== -1);
      });

      var conflicts = [];
      if (medTasks.length > 0) {
        conflicts.push({ type: 'task', count: medTasks.length,
          detail: medTasks.map(function(t) { return t.title; }).join('、') });
      }
      if (medEvents.length > 0) {
        conflicts.push({ type: 'event', count: medEvents.length,
          detail: medEvents.map(function(e) { return e.title; }).join('、') });
      }

      if (conflicts.length > 0) {
        return {
          type: 'medical_mismatch',
          medicineValue: medValue || '无',
          conflicts: conflicts,
          message: '医疗信息不一致：档案标注为"' + (medValue || '无') + '"，但系统中存在用药相关的任务/事件/记录',
          needsConfirm: true
        };
      }
      return null;
    },

    // ========== 档案统一数据源（P1-1-3） ==========

    /**
     * 获取完整档案数据（优先 localStorage，fallback Constants）
     * 返回：{ basicInfo, communicationGuide, emotionSupport, careInfo,
     *         workInfo, relationsInfo, likesList, dislikesList, dailyRoutine,
     *         aboutMe, verifiedStrategies, stressSignals, scenarioCards }
     */
    getProfile: function() {
      var C = window.Constants;
      var data = this.load() || {};
      if (!data._profile) data._profile = {};
      var p = data._profile;

      // 每个字段优先读 localStorage._profile，缺失则深拷贝 Constants 做 fallback
      function _get(key, constKey) {
        if (p[key] !== undefined) return p[key];
        if (C && C[constKey]) return JSON.parse(JSON.stringify(C[constKey]));
        return null;
      }

      return {
        basicInfo:          _get('basicInfo', 'basicInfo'),
        communicationGuide: _get('communicationGuide', 'communicationGuide'),
        emotionSupport:     _get('emotionSupport', 'emotionSupport'),
        careInfo:           this.getCareInfo(),  // careInfo 已有独立持久化
        workInfo:           _get('workInfo', 'workInfo'),
        relationsInfo:      _get('relationsInfo', 'relationsInfo'),
        likesList:          _get('likesList', 'likesList'),
        dislikesList:       _get('dislikesList', 'dislikesList'),
        dailyRoutine:       _get('dailyRoutine', 'dailyRoutine'),
        aboutMe:            _get('aboutMe', 'aboutMe'),
        verifiedStrategies: _get('verifiedStrategies', 'verifiedStrategies'),
        stressSignals:      _get('stressSignals', 'stressSignals'),
        scenarioCards:      _get('scenarioCards', 'scenarioCards')
      };
    },

    /**
     * 更新档案字段（写入 localStorage._profile）
     */
    updateProfile: function(section, value) {
      var data = this.load() || {};
      if (!data._profile) data._profile = {};
      data._profile[section] = value;
      this.save(data);
      return true;
    },

    // ===== 档案统一数据源 end =====

  };

  window.DataStore = DataStore;

})();