/**
 * storage.js — localStorage 封装
 * 挂载：window.DataStore
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ai_dongwo_data';
  var DATA_VERSION = 6;

  var C = window.Constants;
  var ROLES = C.ROLES;

  /** 生成示例用户数据 */
  function generateSampleUsers() {
    return [
      { id: 'u_sample_youth', name: '小雨', role: 'youth', pin: '1111', avatar: '🌻', createdAt: window.getTodayString() },
      { id: 'u_sample_parent', name: '妈妈', role: 'parent', pin: '2222', avatar: '👨\u200d👩\u200d👧', createdAt: window.getTodayString() },
      { id: 'u_sample_teacher', name: '李老师', role: 'teacher', pin: '3333', avatar: '📚', createdAt: window.getTodayString() },
      { id: 'u_sample_caregiver', name: '张阿姨', role: 'caregiver', pin: '4444', avatar: '🤝', createdAt: window.getTodayString() },
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
      records.push(Object.assign({ id: window.generateUUID(), type: type, date: dateStr(0), time: timeStr(9, 0) }, data));
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

    // === 沟通记录 ===
    var commData = [
      { d: 0, c: '用"先...然后..."的方式讲解新任务，理解得很快。对公交车相关的比喻反应特别好。', a: 'teacher' },
      { d: -6, c: '今天尝试用图片卡片辅助沟通，对"下一步做什么"的理解明显提升。', a: 'teacher' },
      { d: -14, c: '给他两个选择时（A或B），能较快做出决定。直接问"你想做什么"时反而需要更长时间。', a: 'teacher' },
      { d: -20, c: '下雨天不能外出时，用画图的方式解释原因，他比语言解释更能接受。', a: 'caregiver' }
    ];

    commData.forEach(function(item) {
      var au = authors[item.a];
      addRecord('communication', {
        content: item.c,
        author: au.name, authorRole: au.role, authorId: au.id, authorAvatar: au.avatar,
        date: dateStr(item.d), time: timeStr(10, Math.floor(Math.random() * 60))
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

  /** 生成示例任务数据 */
  function generateSampleTasks() {
    return [
      { id: 'task_1', title: '起床洗漱', icon: '🪥', category: 'daily', time: '08:30', difficulty: 'easy', supportTip: '提醒时间即可，不需催促', isActive: true, createdAt: window.getTodayString(), checkins: [] },
      { id: 'task_2', title: '吃早餐', icon: '🍞', category: 'daily', time: '09:00', difficulty: 'easy', supportTip: '检查食物无海鲜成分', isActive: true, createdAt: window.getTodayString(), checkins: [] },
      { id: 'task_3', title: '机构活动', icon: '🎨', category: 'therapy', time: '10:00', difficulty: 'medium', supportTip: '提前说明今天做什么活动', isActive: true, createdAt: window.getTodayString(), checkins: [] },
      { id: 'task_4', title: '午餐', icon: '🍱', category: 'daily', time: '11:30', difficulty: 'easy', supportTip: '避免突然更换菜单', isActive: true, createdAt: window.getTodayString(), checkins: [] },
      { id: 'task_5', title: '午休', icon: '😴', category: 'daily', time: '12:30', difficulty: 'easy', supportTip: '保持环境安静', isActive: true, createdAt: window.getTodayString(), checkins: [] },
      { id: 'task_6', title: '烘焙练习', icon: '🍪', category: 'work', time: '14:00', difficulty: 'medium', supportTip: '鼓励参与但允许不参加', isActive: true, createdAt: window.getTodayString(), checkins: [] },
      { id: 'task_7', title: '社区散步', icon: '🚶', category: 'social', time: '15:30', difficulty: 'easy', supportTip: '避开嘈杂场所', isActive: true, createdAt: window.getTodayString(), checkins: [] },
      { id: 'task_8', title: '电子琴练习', icon: '🎹', category: 'therapy', time: '16:00', difficulty: 'medium', supportTip: '按步骤练习，不要催促', isActive: true, createdAt: window.getTodayString(), checkins: [] }
    ];
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

    // 每日重复事件 — 服药提醒
    for (var i = 0; i <= dayOffset + 7; i++) {
      events.push({
        id: 'evt_med_' + i, title: '服药提醒', type: 'reminder', icon: '💊',
        date: dateStr(-dayOffset + i), time: '21:00', description: '每日睡前服药',
        recurring: 'daily', priority: 'high', color: '#722ED1',
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
      { offset: -dayOffset + 1, title: '机构晨检', type: 'medical', icon: '🏥', time: '08:00', endTime: '08:30', desc: '月初健康检查，量体温、称体重', priority: 'medium', color: '#F5222D' },
      { offset: -dayOffset + 2, title: '烘焙课', type: 'activity', icon: '🍪', time: '10:00', endTime: '11:30', desc: '学习制作曲奇饼干', priority: 'low', color: '#FAAD14' },
      { offset: -dayOffset + 3, title: '电子琴课', type: 'activity', icon: '🎹', time: '14:00', endTime: '15:00', desc: '练习《小星星》完整弹奏', priority: 'low', color: '#13C2C2' },
      { offset: -dayOffset + 4, title: '社区适应训练', type: 'activity', icon: '🚶', time: '09:30', endTime: '11:00', desc: '去超市购物练习，学习认价格标签', priority: 'medium', color: '#4A90D9' },
      { offset: -dayOffset + 5, title: '绘画课', type: 'activity', icon: '🎨', time: '10:00', endTime: '11:30', desc: '画公交车主题的水彩画', priority: 'low', color: '#FAAD14' },
      { offset: -dayOffset + 6, title: 'IEP季度评估', type: 'meeting', icon: '📋', time: '10:00', endTime: '11:30', desc: 'Individualized Education Program 季度评估会议', priority: 'high', color: '#4A90D9' },
      { offset: -dayOffset + 7, title: '家长交流会', type: 'meeting', icon: '👩\u200d👩\u200d👦', time: '14:00', endTime: '15:30', desc: '机构家长交流会，分享照护经验', priority: 'medium', color: '#4A90D9' },
      { offset: -dayOffset + 8, title: '感统训练', type: 'activity', icon: '🧘', time: '10:00', endTime: '11:00', desc: '感觉统合训练，平衡木和触觉练习', priority: 'medium', color: '#52C41A' },
      { offset: -dayOffset + 9, title: '烘焙课', type: 'activity', icon: '🍪', time: '10:00', endTime: '11:30', desc: '学习制作小蛋糕', priority: 'low', color: '#FAAD14' },
      { offset: -dayOffset + 10, title: '户外安全演练', type: 'activity', icon: '⚠️', time: '14:00', endTime: '15:00', desc: '学习过马路、识别红绿灯', priority: 'high', color: '#F5222D' },
      { offset: -dayOffset + 11, title: '音乐课', type: 'activity', icon: '🎵', time: '10:00', endTime: '11:00', desc: '学习节奏拍打和简单合唱', priority: 'low', color: '#722ED1' },
      { offset: -dayOffset + 12, title: '体育活动', type: 'activity', icon: '⚽', time: '15:00', endTime: '16:00', desc: '机构运动会，参加接力跑和投球', priority: 'medium', color: '#52C41A' },
      { offset: -dayOffset + 14, title: '口腔检查', type: 'medical', icon: '🦷', time: '09:00', endTime: '10:00', desc: '社区医院口腔检查', priority: 'medium', color: '#F5222D' },
      { offset: -dayOffset + 15, title: '感统训练', type: 'activity', icon: '🧘', time: '10:00', endTime: '11:00', desc: '触觉脱敏训练，接触不同材质', priority: 'medium', color: '#52C41A' },
      { offset: -dayOffset + 16, title: '社交技能课', type: 'activity', icon: '🗣️', time: '14:00', endTime: '15:00', desc: '学习打招呼和自我介绍', priority: 'medium', color: '#4A90D9' },
      { offset: -dayOffset + 17, title: '烘焙课', type: 'activity', icon: '🍪', time: '10:00', endTime: '11:30', desc: '学习制作面包', priority: 'low', color: '#FAAD14' },
      { offset: -dayOffset + 18, title: '电子琴课', type: 'activity', icon: '🎹', time: '14:00', endTime: '15:00', desc: '学习《小星星》变奏', priority: 'low', color: '#13C2C2' },
      { offset: -dayOffset + 19, title: '心理咨询', type: 'medical', icon: '🧠', time: '10:00', endTime: '11:00', desc: '月度心理咨询评估', priority: 'high', color: '#722ED1' },
      { offset: -dayOffset + 20, title: '社区散步', type: 'activity', icon: '🚶', time: '15:00', endTime: '16:30', desc: '去公园散步，观察流浪猫', priority: 'low', color: '#13C2C2' },
      { offset: -dayOffset + 21, title: '烘焙课结业展示', type: 'activity', icon: '🏆', time: '14:00', endTime: '16:00', desc: '机构烘焙课程结业展示，家长可以参加', priority: 'high', color: '#FAAD14' },
      { offset: -dayOffset + 22, title: '家长面谈', type: 'meeting', icon: '👩', time: '10:00', endTime: '11:00', desc: '与李老师一对一面谈，了解本月进展', priority: 'medium', color: '#4A90D9' },
      { offset: -dayOffset + 23, title: '感统训练', type: 'activity', icon: '🧘', time: '10:00', endTime: '11:00', desc: '大运动协调训练', priority: 'medium', color: '#52C41A' },
      { offset: -dayOffset + 25, title: '机构开放日', type: 'activity', icon: '🏫', time: '09:00', endTime: '12:00', desc: '机构开放日，展示学员作品', priority: 'medium', color: '#4A90D9' },
      { offset: -dayOffset + 27, title: '支持性就业评估', type: 'meeting', icon: '💼', time: '10:00', endTime: '11:30', desc: '评估支持性就业进展和能力', priority: 'high', color: '#4A90D9' }
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
    events.push({ id: 'evt_checkup', title: '年度体检', type: 'medical', icon: '🏥', date: dateStr(5), time: '09:00', endTime: '11:00', description: '市残联年度体检，需带身份证和医保卡', recurring: 'yearly', priority: 'high', color: '#F5222D', author: '妈妈', authorRole: 'parent', createdAt: today });
    events.push({ id: 'evt_iep', title: 'IEP会议', type: 'meeting', icon: '📋', date: dateStr(3), time: '10:00', endTime: '11:30', description: 'Individualized Education Program 季度评估会议', recurring: 'none', priority: 'high', color: '#4A90D9', author: '李老师', authorRole: 'teacher', createdAt: today });

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

      if (needReset) {
        this.save(data);
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
      var data = this.load();
      return data ? data.currentUser : null;
    },

    setCurrentUser: function (user) {
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

    getTasks: function() {
      var data = this.load();
      return data && data.tasks ? data.tasks : [];
    },

    updateTaskCheckin: function(taskId, date, status, note) {
      var data = this.load();
      if (!data || !data.tasks) return false;
      var task = data.tasks.find(function(t) { return t.id === taskId; });
      if (!task) return false;
      var existing = task.checkins.find(function(c) { return c.date === date; });
      if (existing) {
        existing.status = status;
        existing.time = new Date().toTimeString().slice(0,5);
        if (note !== undefined) existing.note = note;
      } else {
        task.checkins.push({ date: date, time: new Date().toTimeString().slice(0,5), status: status, note: note || '' });
      }
      this.save(data);
      return true;
    },

    addTask: function(task) {
      var data = this.load();
      if (!data.tasks) data.tasks = [];
      var newTask = Object.assign({}, task, { id: 'task_' + window.generateUUID(), createdAt: window.getTodayString(), checkins: [] });
      data.tasks.push(newTask);
      this.save(data);
      return newTask;
    },

    toggleTaskActive: function(taskId) {
      var data = this.load();
      if (!data || !data.tasks) return;
      var task = data.tasks.find(function(t) { return t.id === taskId; });
      if (task) { task.isActive = !task.isActive; this.save(data); }
    },

    deleteTask: function(taskId) {
      var data = this.load();
      if (!data || !data.tasks) return;
      data.tasks = data.tasks.filter(function(t) { return t.id !== taskId; });
      this.save(data);
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
    }
  };

  window.DataStore = DataStore;

})();