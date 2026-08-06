/**
 * constants.js — 常量与数据定义模块
 * 挂载：window.Constants
 */
(function () {
  'use strict';

  /* ==========================================================
   * 小雨案例全部数据
   * ========================================================== */

  /** 小雨基本信息 */
  var basicInfo = {
    name: '小雨',
    age: 24,
    gender: '男',
    intro: '喜欢烘焙、对公交车路线了如指掌的安静男孩',
    communication: '短句为主 · 需要耐心等待'
  };

  /** 喜欢的事物 */
  var likesList = [
    { icon: '🍪', title: '烘焙', desc: '能独立做曲奇和杯子蛋糕，过程很专注' },
    { icon: '🚌', title: '公交车', desc: '对本市公交线路非常熟悉，能说出每条线路经过哪些站' },
    { icon: '🎹', title: '弹琴', desc: '在机构学了几个月电子琴，能弹简单旋律' },
    { icon: '🐱', title: '动物', desc: '特别喜欢猫，看到猫会主动靠近' }
  ];

  /** 不喜欢的事物 */
  var dislikesList = [
    { icon: '🔄', title: '突然改变计划', desc: '会感到不安和焦虑' },
    { icon: '🔊', title: '很吵的环境', desc: '商场、装修声让他不适' },
    { icon: '⏰', title: '被催促"快点"', desc: '会增加焦虑感' },
    { icon: '🦐', title: '海鲜（过敏）', desc: '虾、蟹、贝类——严禁食用' },
    { icon: '🚫', title: '被不打招呼碰身体', desc: '需要先沟通再接触' }
  ];

  /** 沟通说明书 */
  var communicationGuide = {
    best: [
      '短句、慢一点、一次说一件事',
      '给他反应时间，不要催',
      '用他熟悉的事物举例（公交车、烘焙）',
      '提前告诉他接下来要做什么'
    ],
    caution: [
      '语速稍慢，给他反应时间',
      '重要的事提前说、重复确认',
      '用"先...然后..."说流程',
      '用熟悉的例子打比方'
    ],
    avoid: [
      '一次说很多件事',
      '语速太快、很着急',
      '反问句、讽刺、开玩笑',
      '说"你怎么连这个都不懂"',
      '焦虑时追问"你到底怎么了"'
    ]
  };

  /** 情绪与行为支持 */
  var emotionSupport = {
    triggers: [
      '环境太吵、人太多',
      '计划突然改变',
      '被催促"快点"',
      '被不打招呼碰',
      '做事被打断'
    ],
    warnings: [
      '说话开始重复',
      '捂耳朵、抓头发',
      '来回踱步',
      '突然不说话',
      '找借口要离开'
    ],
    soothing: [
      '带到安静的地方',
      '给 5 分钟独处，不要追问',
      '用简单的选择帮他恢复控制感："你想喝水还是坐着？"',
      '不要试图在焦虑中跟他讲道理',
      '恢复后自然过渡，不要过度关注'
    ],
    crisis: [
      '如果出现自伤或攻击行为',
      '立即确保环境安全',
      '通知负责人和紧急联系人',
      '记录事件经过'
    ]
  };

  /** 照护与医疗提醒 */
  var careInfo = {
    allergy: { items: '虾、蟹、贝类', level: '严禁接触' },
    medicine: '无',
    checkup: '年度体检',
    special: '对嘈杂环境敏感',
    sleep: '晚上10点前入睡'
  };

  /** 工作支持 */
  var workInfo = {
    canDo: ['包装', '清洁', '按步骤完成任务'],
    needSupport: ['理解新任务指令', '应对变化'],
    avoid: ['不要安排需要快速反应的工作']
  };

  /** 日常作息时间轴 */
  var dailyRoutine = [
    { time: '08:30', title: '起床洗漱', activity: '自己刷牙洗脸，穿好衣服', support: '提醒时间即可，不需催促', risk: 'green', reminder: '' },
    { time: '09:00', title: '早餐', activity: '喜欢吃面包和牛奶', support: '提前摆好餐具', risk: 'green', reminder: '注意过敏：不能有海鲜成分' },
    { time: '09:30', title: '自由时间', activity: '看书、拼图或听音乐', support: '提供安静的空间', risk: 'green', reminder: '' },
    { time: '10:00', title: '机构活动', activity: '手工课/音乐课/生活技能训练', support: '提前说明今天做什么', risk: 'green', reminder: '提前一天告知行程安排' },
    { time: '11:30', title: '午餐', activity: '在机构或回家吃午饭', support: '避免突然更换菜单', risk: 'yellow', reminder: '检查食物有无海鲜成分' },
    { time: '12:30', title: '午休', activity: '安静休息或听轻音乐', support: '保持环境安静', risk: 'green', reminder: '' },
    { time: '13:30', title: '下午活动', activity: '烘焙练习/社区散步/电子琴', support: '鼓励参与但允许不参加', risk: 'yellow', reminder: '外出时避开嘈杂场所' },
    { time: '15:00', title: '自由时间', activity: '看公交车线路图、画画', support: '不强求社交互动', risk: 'green', reminder: '' },
    { time: '16:00', title: '支持性就业准备', activity: '模拟工作场景练习', support: '用步骤卡片辅助理解', risk: 'yellow', reminder: '新任务需要提前讲解' },
    { time: '17:30', title: '晚餐', activity: '和家人一起吃饭', support: '饭桌上不追问他今天做了什么', risk: 'green', reminder: '' },
    { time: '18:30', title: '晚间放松', activity: '看电视、听音乐或散步', support: '尊重他的选择', risk: 'green', reminder: '' },
    { time: '20:00', title: '洗漱准备', activity: '洗澡、准备睡觉', support: '提前10分钟提醒', risk: 'green', reminder: '水温要适中' },
    { time: '20:30', title: '睡前安静时间', activity: '听轻音乐或翻翻喜欢的书', support: '调暗灯光', risk: 'green', reminder: '' },
    { time: '21:00', title: '入睡', activity: '关灯睡觉', support: '保持房间安静', risk: 'green', reminder: '' },
    { time: '21:30', title: '夜班照护', activity: '家长确认入睡', support: '注意有无异常', risk: 'red', reminder: '夜间如情绪波动及时安抚' }
  ];

  /** 关系地图 */
  var relationsInfo = {
    core: [
      { name: '妈妈', role: '法定支持人', emoji: '👩' },
      { name: '爸爸', role: '法定支持人', emoji: '👨' },
      { name: '李老师', role: '机构老师', emoji: '👩\u200d🏫' }
    ],
    daily: [
      { name: '同事小王', role: '工作伙伴', emoji: '👷' },
      { name: '邻居阿姨', role: '邻居', emoji: '👵' }
    ],
    avoid: [
      '太热情、说话太快的陌生人',
      '一上来就想抱他、摸他头的人',
      '人多嘈杂的聚会',
      '推销、募捐、强迫说话的场景'
    ]
  };

  /** 速读卡版本配置 */
  var quickCardVersions = {
    standard: {
      label: '标准版',
      target: '家长/法定支持人',
      sections: [
        { title: '关于小雨', type: 'blue', items: ['24岁，安静男孩', '喜欢烘焙、公交车、弹琴、猫', '沟通：短句为主，需要耐心等待'] },
        { title: '怎样沟通', type: 'green', items: ['短句、慢一点、一次说一件事', '给他反应时间，不要催', '可以聊公交车或烘焙', '提前告诉他接下来要做什么'] },
        { title: '绝对不要做', type: 'red', items: ['不要突然拍他肩膀、碰他', '不要催他"快点"', '不要给他吃海鲜', '不要一次说很多件事'] },
        { title: '焦虑时怎么办', type: 'yellow', items: ['看到捂耳朵、来回走就是信号', '带到安静地方，给5分钟独处', '不要追问"你怎么了"', '用简单选择恢复控制感'] },
        { title: '紧急联系人', type: 'blue', items: ['妈妈 138-xxxx-xxxx', '爸爸 139-xxxx-xxxx', '李老师（机构） 010-xxxx-xxxx'] }
      ]
    },
    teacher: {
      label: '教师版',
      target: '机构老师',
      sections: [
        { title: '小雨在课堂', type: 'blue', items: ['需要提前说明课程安排', '喜欢有步骤的任务', '能专注做手工和音乐'] },
        { title: '安全红线', type: 'red', items: ['食物严格排除海鲜成分', '情绪波动时不要追问', '环境噪音过大时及时调整'] },
        { title: '教学建议', type: 'green', items: ['用"先...然后..."说明流程', '新任务需要步骤卡片辅助', '允许他按自己的节奏完成'] },
        { title: '预警信号', type: 'yellow', items: ['说话重复、捂耳朵、来回踱步', '突然沉默、找借口离开'] }
      ]
    },
    institution: {
      label: '机构概览版',
      target: '机构管理人员',
      sections: [
        { title: '学员概况', type: 'blue', items: ['姓名：小雨，24岁', '沟通方式：短句、需要反应时间', '支持需求：理解指令、应对变化'] },
        { title: '医疗与安全', type: 'red', items: ['海鲜过敏（严禁接触）', '嘈杂环境敏感', '夜间照护需确认情绪稳定'] },
        { title: '就业方向', type: 'green', items: ['适合：包装、清洁、步骤型任务', '需要：指令分步说明', '避免：快速反应类工作'] },
        { title: '应急联系人', type: 'yellow', items: ['妈妈（法定支持人）', '爸爸（法定支持人）', '李老师（机构负责老师）'] }
      ]
    }
  };

  /** 隐私分级配置（5级体系） */
  var privacyLevels = {
    youth:      ['A', 'B'],
    parent:     ['A', 'B', 'C', 'D'],
    teacher:    ['A', 'B'],
    caregiver:  ['A', 'B', 'C'],
    government: ['A'],
    admin:      ['A', 'B', 'C', 'D']
  };

  /** 角色名称映射（中文） */
  var roleLabels = {
    youth: '心青年',
    parent: '家长',
    teacher: '老师',
    caregiver: '影子老师',
    government: '政府',
    admin: '管理员'
  };

  /* ==========================================================
   * 角色系统配置
   * ========================================================== */

  /** 多角色配置 */
  var ROLES = {
    youth: { label: '心青年', name: '小雨', avatar: '🌻', color: '#4A90D9',
      canAdd: ['mood', 'note'],
      description: '记录自己的心情和感受' },
    parent: { label: '家长', name: '妈妈', avatar: '👨\u200d👩\u200d👧', color: '#52C41A',
      canAdd: ['care', 'communication', 'emotion', 'strategy', 'note'],
      description: '记录日常照护和家庭情况' },
    teacher: { label: '老师', name: '李老师', avatar: '📚', color: '#FAAD14',
      canAdd: ['activity', 'communication', 'emotion', 'strategy', 'note'],
      description: '记录教学和活动情况' },
    caregiver: { label: '影子老师', name: '张阿姨', avatar: '🤝', color: '#722ED1',
      canAdd: ['care', 'communication', 'emotion', 'strategy', 'note'],
      description: '记录日常照护和陪伴情况' },
    government: { label: '政府', name: '政府管理员', avatar: '🏛️', color: '#EB2F96',
      canAdd: [],
      description: '查看宏观数据看板' },
    admin: { label: '管理员', name: '系统管理员', avatar: '🛡️', color: '#13C2C2',
      canAdd: [],
      description: '系统配置与用户管理' },
    temp_supporter: { label: '临时支持者', name: '临时支持者', avatar: '🤲', color: '#FA8C16',
      canAdd: [],
      description: '快速了解如何支持心青年（最小权限）' }
  };

  /** 记录类型配置 */
  var RECORD_TYPES = {
    mood: { label: '心情记录', icon: '💭', color: '#4A90D9',
      fields: ['mood', 'content'], description: '记录今天的心情' },
    care: { label: '照护记录', icon: '🏥', color: '#52C41A',
      fields: ['title', 'content'], description: '记录饮食、睡眠、健康等照护情况' },
    activity: { label: '活动记录', icon: '🎯', color: '#FAAD14',
      fields: ['title', 'content'], description: '记录参加的课程、活动、训练' },
    communication: { label: '沟通观察', icon: '💬', color: '#722ED1',
      fields: ['content'], description: '记录沟通中的观察发现' },
    emotion: { label: '情绪事件', icon: '😊', color: '#F5222D',
      fields: ['emotion_type', 'content'], description: '记录情绪波动的触发和应对' },
    note: { label: '一般备注', icon: '📝', color: '#999999',
      fields: ['title', 'content'], description: '添加其他需要记录的备注' },
    strategy: { label: '策略记录', icon: '🧩', color: '#EB2F96',
      fields: ['emotion_type', 'title', 'content', 'effectiveness'], description: '记录情绪行为策略使用及效果' },
    life: { label: '生活记录', icon: '❤️', color: '#4A90D9',
      fields: ['title', 'content'], description: '记录兴趣、活动、日常生活偏好' },
    social: { label: '社交记录', icon: '👥', color: '#EB2F96',
      fields: ['title', 'content'], description: '记录社交互动、人际关系变化' }
  };

  /** 心情选项 */
  var MOOD_OPTIONS = [
    { value: 'happy', label: '开心', emoji: '😄' },
    { value: 'calm', label: '平静', emoji: '😌' },
    { value: 'anxious', label: '焦虑', emoji: '😰' },
    { value: 'sad', label: '难过', emoji: '😢' },
    { value: 'excited', label: '兴奋', emoji: '🤩' }
  ];

  /** 情绪类型选项 */
  var EMOTION_OPTIONS = [
    { value: '开心', emoji: '😊' },
    { value: '平静', emoji: '😌' },
    { value: '焦虑', emoji: '😰' },
    { value: '生气', emoji: '😠' },
    { value: '难过', emoji: '😢' }
  ];

  /** 家庭关系选项 */
  var FAMILY_RELATIONS = [
    { value: 'father', label: '父亲' },
    { value: 'mother', label: '母亲' },
    { value: 'grandfather', label: '祖父' },
    { value: 'grandmother', label: '祖母' },
    { value: 'brother', label: '兄弟' },
    { value: 'sister', label: '姐妹' },
    { value: 'other_guardian', label: '其他监护人' }
  ];

  /** 邀请码可选角色（排除 youth 和主监护人 parent） */
  var INVITABLE_ROLES = [
    { value: 'teacher', label: '老师' },
    { value: 'caregiver', label: '影子老师' }
  ];

  /** 页面ID与Hash的映射 */
  var routeMap = {
    'home': 'home',
    'life': 'life',
    'communication': 'communication',
    'emotion': 'emotion',
    'care': 'care',
    'work': 'work',
    'relations': 'relations',
    'timeline': 'timeline',
    'login': 'login',
    'profile': 'profile',
    'charts': 'charts',
    'tasks': 'tasks',
    'calendar': 'calendar',
    'archive': 'archive',
    'archive-topics': 'archive-topics',
    'archive-status': 'archive-status',
    'analytics': 'analytics',
    'records': 'records',
    'quickcard': 'quickcard',
    'grants': 'grants',
    'join': 'join',
    'approvals': 'approvals',
    'archive-code': 'archive-code',
    'welcome': 'welcome',
    'chat': 'chat',
    'chat-conversation': 'chat-conversation',
    'chat-review': 'chat-review',
    'youth-chat': 'youth-chat',
    'batch-import': 'batch-import',
    'admin-users': 'admin-users',
    'admin-data': 'admin-data',
    'quick-start': 'quick-start',
    'supporter-card': 'supporter-card',
    'quick-record': 'quick-record',
    'draft-review': 'draft-review'
  };

  /**
   * 页面父子归属映射：每个页面 hash → 归属的一级 Tab route
   * null 表示无归属（如 login / welcome）
   */
  var PAGE_PARENT = {
    // 💬 AI聊聊
    'chat': 'chat',
    'chat-conversation': 'chat',
    'chat-review': 'chat',
    'youth-chat': 'youth-chat',
    // ✅ 任务
    'home': 'home',
    'tasks': 'home',
    'calendar': 'home',
    // 👤 档案
    'archive': 'archive',
    'life': 'archive',
    'communication': 'archive',
    'emotion': 'archive',
    'care': 'archive',
    'work': 'archive',
    'relations': 'archive',
    'timeline': 'archive',
    'records': 'archive',
    'quickcard': 'archive',
    'archive-topics': 'archive',
    'archive-status': 'archive',
    // 📊 分析
    'charts': 'charts',
    'analytics': 'charts',
    // ⚙️ 管理
    'profile': 'profile',
    'grants': 'profile',
    'join': 'profile',
    'approvals': 'profile',
    'archive-code': 'profile',
    'batch-import': 'profile',
    'admin-users': 'profile',
    'admin-data': 'profile',
    // 无归属
    'login': null,
    'welcome': null,
    'quick-start': null,
    'supporter-card': null,
    'quick-record': null,
    'draft-review': null
  };

  /**
   * 返回逐级层级映射：子页面 → 直接父级页面（用于返回按钮）
   * 与 PAGE_PARENT（一级菜单归属）分开维护
   */
  var PAGE_BACK_PARENT = {
    'archive-topics': 'archive',
    'archive-status': 'archive',
    'life': 'archive-topics',
    'communication': 'archive-topics',
    'emotion': 'archive-topics',
    'care': 'archive-topics',
    'work': 'archive-topics',
    'relations': 'archive-topics',
    'timeline': 'archive',
    'quickcard': 'archive',
    'records': 'archive'
  };

  /**
   * 各角色可见的一级 Tab 列表
   */
  var ROLE_NAV_TABS = {
    'youth': ['youth-chat', 'home', 'archive'],
    'parent': ['chat', 'home', 'archive', 'charts', 'profile'],
    'teacher': ['chat', 'home', 'archive', 'charts', 'profile'],
    'caregiver': ['chat', 'home', 'archive', 'charts', 'profile'],
    'government': ['charts', 'profile'],
    'admin': ['profile', 'charts'],
    'temp_supporter': []
  };

  /**
   * 各角色登录后的默认落地页 hash
   */
  var ROLE_DEFAULT_PAGES = {
    'youth': 'home',
    'parent': 'home',
    'teacher': 'home',
    'caregiver': 'archive',
    'government': 'analytics',
    'admin': 'profile',
    'temp_supporter': 'supporter-card'
  };

  /** 侧边栏菜单配置（普通角色：parent/teacher/caregiver） */
  var SIDEBAR_MENU = [
    { group: '任务', items: [
      { hash: 'home', icon: '🏠', label: '今日' },
      { hash: 'tasks', icon: '✅', label: '任务清单' },
      { hash: 'calendar', icon: '📆', label: '日程日历' }
    ]},
    {
      group: '档案',
      items: [
        { hash: 'archive', icon: '📋', label: '档案总览' },
        { hash: 'life', icon: '💚', label: '我喜欢的生活' },
        { hash: 'communication', icon: '💬', label: '沟通说明书' },
        { hash: 'emotion', icon: '🌊', label: '情绪与行为支持' },
        { hash: 'care', icon: '💊', label: '照护与医疗提醒' },
        { hash: 'work', icon: '💼', label: '工作支持' },
        { hash: 'relations', icon: '👥', label: '关系地图' },
        { hash: 'timeline', icon: '📅', label: '时间轴' }
      ]
    },
    {
      group: '分析',
      items: [
        { hash: 'analytics', icon: '📈', label: '分析总览' }
      ]
    },
    {
      group: '管理',
      items: [
        { hash: 'profile', icon: '⚙️', label: '我的账号' },
        { hash: 'grants', icon: '👥', label: '授权管理' },
        { hash: 'join', icon: '👨\u200d👩\u200d👧', label: '家庭与成员' },
        { hash: 'approvals', icon: '📋', label: '加入审批' },
        { hash: 'archive-code', icon: '📱', label: '档案码/分享' }
      ]
    }
  ];

  /** 政府角色侧边栏菜单 */
  var GOVERNMENT_NAV_ITEMS = [
    { group: '分析', items: [
      { hash: 'analytics', icon: '📈', label: '分析总览' }
    ]},
    { group: '账号', items: [
      { hash: 'profile', icon: '⚙️', label: '账号信息' },
      { hash: 'grants', icon: '🔒', label: '授权说明' }
    ]}
  ];

  /** 管理员角色侧边栏菜单 */
  var ADMIN_NAV_ITEMS = [
    { group: '管理', items: [
      { hash: 'home', icon: '🏠', label: '系统概览' },
      { hash: 'admin-users', icon: '👥', label: '用户管理' },
      { hash: 'batch-import', icon: '📥', label: '批量导入' }
    ]},
    { group: '系统', items: [
      { hash: 'admin-data', icon: '📈', label: '系统数据' },
      { hash: 'analytics', icon: '📊', label: '数据分析' }
    ]}
  ];

  /* ==========================================================
   * 策略知识库
   * ========================================================== */

  var STRATEGY_KB = {
    anxiety: {
      label: '焦虑/紧张', emoji: '😰',
      levels: {
        mild: [
          { name: '深呼吸引导', steps: ['降低环境刺激（关灯/降噪音）', '示范深呼吸', '陪伴数息3-5次'], caution: '不强迫模仿，允许自我调节节奏', expected: '5-10分钟内情绪平稳' },
          { name: '感官安抚', steps: ['提供感官玩具（压力球/触觉板）', '引导到安静角落', '播放白噪音'], caution: '提前了解个人偏好感官物品', expected: '10-15分钟情绪缓解' },
          { name: '转移注意力', steps: ['观察兴趣点', '自然引入喜欢的话题/活动', '逐步引导脱离焦虑源'], caution: '转移要自然，不要说"别焦虑"', expected: '注意力成功转移' }
        ],
        moderate: [
          { name: '安静空间隔离', steps: ['引导至预设安全空间', '降低光线和声音', '提供安抚物品', '保持陪伴但保持距离'], caution: '空间需提前布置，有安全感；不锁门', expected: '15-30分钟情绪稳定' },
          { name: '压力释放', steps: ['提供深压力背心/重力毯', '引导做推墙/深蹲等本体觉活动', '允许摇晃身体'], caution: '提前确认个人接受度', expected: '20分钟内紧张感降低' },
          { name: '音乐疗法', steps: ['播放个人偏好音乐', '允许戴耳机隔绝环境音', '陪伴静默'], caution: '音乐库需提前建立', expected: '10-20分钟情绪改善' }
        ],
        severe: [
          { name: '专业介入', steps: ['确保环境安全', '通知专业人员/家长', '记录详细情况', '维持安全距离'], caution: '不可独自处理；保留现场记录', expected: '专业人员接手处理' },
          { name: '安全保护', steps: ['清理危险物品', '用软垫保护', '避免身体接触', '持续观察呼吸和状态'], caution: '不强行约束；保护头部', expected: '确保人身安全' }
        ]
      }
    },
    aggression: {
      label: '暴躁/攻击行为', emoji: '😠',
      levels: {
        mild: [
          { name: '运动释放', steps: ['引导到开放空间', '做跳跃/跑步等大运动', '逐渐引导到替代行为'], caution: '提前规划安全运动空间', expected: '能量释放，情绪缓和' },
          { name: '替代行为引导', steps: ['识别攻击需求（击打？推？）', '提供替代物（枕头/沙袋）', '引导力量释放到替代物'], caution: '不说"不能打"，给替代方案', expected: '攻击行为转为安全释放' },
          { name: '情绪命名', steps: ['平静状态下帮助命名情绪', '"你现在是不是很生气？"', '等待回应，不急于解决'], caution: '部分心青年语言能力有限，可用图片卡', expected: '情绪被识别和接纳' }
        ],
        moderate: [
          { name: '环境隔离', steps: ['引导/协助到安全空间', '移除可伤害物品', '降低环境刺激', '保持安全距离观察'], caution: '确保有安全出口；至少两人配合', expected: '30分钟内情绪逐步降级' },
          { name: '感官降级', steps: ['关灯/拉窗帘', '降低声音', '提供深压力输入', '减少语言指令'], caution: '感官过载是常见触发因素', expected: '感官负荷降低，情绪缓和' }
        ],
        severe: [
          { name: '紧急保护', steps: ['确保所有人安全', '呼叫支援', '通知家长/专业人员', '保护心青年头部和身体'], caution: '不可独自处理；记录时间线', expected: '安全度过危机' },
          { name: '紧急联系人通知', steps: ['按预设顺序通知', '提供现场情况', '等待专业指导'], caution: '紧急联系人需提前设定', expected: '专业支援到位' }
        ]
      }
    },
    selfInjury: {
      label: '自伤行为', emoji: '🤕',
      levels: {
        mild: [
          { name: '替代感官输入', steps: ['识别自伤部位和功能', '提供等价感官刺激（如手部按压代替拍头）', '引导使用'], caution: '替代物需满足相同感官需求', expected: '自伤行为减少' },
          { name: '情绪Redirect', steps: ['不惊呼制止', '平静提供替代物', '引导到手部活动'], caution: '大反应会强化行为', expected: '行为转移' }
        ],
        moderate: [
          { name: '安全保护', steps: ['佩戴护具（头盔/护腕）', '移除尖锐物品', '提供安全自伤替代（捏压力球）'], caution: '保护为主，不强制止', expected: '减少伤害程度' },
          { name: '感官降级', steps: ['降低环境刺激', '深压力输入', '减少语言指令'], caution: '感官过载常引发自伤', expected: '15-20分钟缓和' }
        ],
        severe: [
          { name: '紧急保护', steps: ['保护关键部位（头/眼）', '呼叫支援', '记录持续时间和频率', '通知专业人员'], caution: '频繁或严重自伤需专业评估', expected: '安全度过' },
          { name: '医疗评估', steps: ['检查是否有身体不适（牙痛/胃痛）', '记录行为模式', '预约专业评估'], caution: '排除身体疼痛引发的自伤', expected: '明确原因' }
        ]
      }
    },
    fear: {
      label: '恐惧/恐怖反应', emoji: '😨',
      levels: {
        mild: [
          { name: '社交故事预演', steps: ['提前编写社交故事', '反复阅读', '角色扮演', '实地尝试'], caution: '故事需个性化，用第一人称', expected: '心理准备充分' },
          { name: '感官保护', steps: ['降噪耳机', '遮光眼罩', '携带安全感物品'], caution: '提前准备感官保护工具', expected: '感官负荷降低' }
        ],
        moderate: [
          { name: '系统脱敏', steps: ['制作恐惧物品/场景图片', '从图片→视频→远距离观察→近距离', '每步给予奖励', '逐步延长接触时间'], caution: '每步停留时间足够长再进阶', expected: '恐惧反应降低' }
        ],
        severe: [
          { name: '紧急撤离+专业评估', steps: ['立即撤离恐惧源', '到安全空间安抚', '记录触发因素', '预约专业评估'], caution: '严重恐惧反应需心理专业介入', expected: '情绪稳定，制定后续计划' }
        ]
      }
    },
    stereotypy: {
      label: '刻板/重复行为', emoji: '🔄',
      levels: {
        mild: [{ name: '理解行为功能', steps: ['观察行为功能（自我调节？沟通？）', '若无害则允许', '若影响参与则提供替代'], caution: '刻板行为有其功能，理解再干预', expected: '不影响日常功能' }],
        moderate: [{ name: '替代行为', steps: ['识别行为功能', '设计功能等价的替代行为', '逐步引导'], caution: '替代行为需满足相同感官需求', expected: '刻板行为减少' }],
        severe: [{ name: '渐进适应', steps: ['提前预告环境变化', '提供感官工具', '缩短暴露时间逐步延长'], caution: '不强迫完全抑制', expected: '适应能力提升' }]
      }
    },
    withdrawal: {
      label: '社交退缩/拒绝', emoji: '\ud83e\udee5',
      levels: {
        mild: [{ name: '渐进式参与', steps: ['允许观察不参与', '小任务开始', '同伴配对', '逐步增加参与度'], caution: '不强迫社交；尊重个人节奏', expected: '逐步融入活动' }],
        moderate: [{ name: '提前准备', steps: ['提前介绍环境照片', '角色扮演', '携带安抚物品', '缩短首次时间'], caution: '新环境是主要触发因素', expected: '适应新环境' }],
        severe: [{ name: '社交故事', steps: ['编写社交故事', '提前阅读', '情境中提醒', '事后回顾'], caution: '社交故事需个性化', expected: '社交理解提升' }]
      }
    },
    hyperactivity: {
      label: '多动/冲动行为', emoji: '⚡',
      levels: {
        mild: [{ name: '本体觉输入', steps: ['课间做跳跃/推墙活动', '使用坐垫/弹力带', '允许小动作'], caution: '提供合法的活动方式', expected: '注意力提升' }],
        moderate: [{ name: '自我调节训练', steps: ['使用"停-想-做"卡片', '练习等待', '逐步延长等待时间'], caution: '从短时间开始', expected: '冲动行为减少' }],
        severe: [{ name: '任务分解', steps: ['大任务拆小步', '每步计时', '完成即奖励', '逐步延长任务时长'], caution: '任务难度逐步提升', expected: '注意力持续时间延长' }]
      }
    },
    sleep: {
      label: '睡眠问题', emoji: '😴',
      levels: {
        mild: [{ name: '睡前仪式', steps: ['固定睡前流程（洗澡→阅读→关灯）', '降低环境刺激', '白噪音辅助'], caution: '流程需固定一致', expected: '入睡时间缩短' }],
        moderate: [{ name: '检查触发因素', steps: ['排除身体不适', '检查环境（温度/噪音）', '轻安抚不互动', '记录频率'], caution: '频繁醒来需专业评估', expected: '夜间醒来减少' }],
        severe: [{ name: '专业评估', steps: ['记录睡眠日志', '预约睡眠专科', '排除医学原因'], caution: '长期严重睡眠问题需医疗介入', expected: '明确原因并制定方案' }]
      }
    },
    eating: {
      label: '饮食问题', emoji: '🍽️',
      levels: {
        mild: [{ name: '渐进暴露', steps: ['新食物放桌上不要求吃', '逐步接触（看→闻→舔→咬）', '搭配偏好食物'], caution: '不强迫进食；记录营养摄入', expected: '食物接受度扩大' }],
        moderate: [{ name: '灵活调整', steps: ['记录仪式行为', '微调一个变量', '逐步增加灵活性'], caution: '突然改变会引发焦虑', expected: '进食仪式减少' }],
        severe: [{ name: '营养评估', steps: ['记录每日摄入', '咨询营养师', '必要时补充营养剂'], caution: '严重偏食影响健康需专业介入', expected: '营养均衡改善' }]
      }
    },
    sensory: {
      label: '感官过载', emoji: '🌀',
      levels: {
        mild: [{ name: '感官饮食', steps: ['安排定时感官活动（推墙/跳跃）', '提供感官工具箱', '记录有效活动'], caution: '感官饮食需个性化定制', expected: '感官需求得到满足' }],
        moderate: [{ name: '感官过载应对', steps: ['识别预警信号（捂耳/闭眼/烦躁）', '立即降低环境刺激', '提供深压力输入', '允许自我调节'], caution: '恢复后不急于恢复正常', expected: '15-20分钟情绪恢复' }],
        severe: [{ name: '环境重构', steps: ['评估环境感官负荷', '改造空间（灯光/隔音）', '建立专属安静空间', '制定应急方案'], caution: '环境改造需多方协作', expected: '感官过载频率降低' }]
      }
    }
  };

  var EMOTION_TO_STRATEGY = {
    '开心': null,
    '平静': null,
    '焦虑': 'anxiety',
    '生气': 'aggression',
    '难过': 'withdrawal'
  };

  /* ==========================================================
   * 模块标签池 — 每条记录可按模块打标签
   * ========================================================== */

  var MODULE_TAGS = {
    communication: ['对话', '短句', '图片卡', '示范', '选择', '比喻', '指令', '反馈', '社交故事', '视觉提示'],
    emotion: ['焦虑', '开心', '生气', '难过', '兴奋', '安抚', '触发', '预警', '感官', '深压力'],
    care: ['过敏', '用药', '饮食', '睡眠', '体检', '卫生', '安全', '过敏原', '用药提醒', '作息'],
    work: ['烘焙', '清洁', '包装', '电子琴', '散步', '绘画', '步骤分解', '任务支持', '就业', '技能'],
    relations: ['社交', '互动', '关系', '家庭', '朋友', '同事', '社区', '支持圈', '信任', '边界']
  };

  /** 记录类型到档案模块的映射 */
  var TYPE_TO_MODULE = {
    mood: 'emotion',
    emotion: 'emotion',
    communication: 'communication',
    care: 'care',
    activity: 'work',
    life: 'life',
    social: 'relations',
    strategy: 'emotion',
    note: null
  };

  /** 模块到记录类型的映射矩阵 — 两级选择器用，未列出的组合在UI中置灰 */
  var RECORD_MATRIX = {
    communication: ['communication', 'note'],
    emotion: ['mood', 'emotion', 'strategy', 'note'],
    care: ['care', 'note'],
    work: ['activity', 'note'],
    relations: ['social', 'note']
  };

  /* ==========================================================
   * 「认识我」— 以人为本的自我介绍（P1 核心新增）
   * ========================================================== */

  /** 心青年第一人称自我介绍 */
  var aboutMe = {
    firstPerson: '我叫小雨，今年24岁。我说话不多，但我能听懂。给我一点时间，我就能把事情做好。',
    strengths: [
      { icon: '🍪', title: '我擅长', desc: '烘焙——我能独立做出好吃的曲奇和杯子蛋糕' },
      { icon: '🚌', title: '我知道很多', desc: '本市的公交线路我都清楚，去哪坐几路车我都知道' },
      { icon: '🎹', title: '我会', desc: '弹电子琴，能弹出简单的旋律' }
    ],
    interests: [
      { icon: '🐱', title: '我喜欢', desc: '猫咪和所有小动物' },
      { icon: '🎵', title: '我喜欢', desc: '听轻音乐、拼图和看公交车线路图' }
    ],
    calming: [
      { icon: '🏠', title: '让我安心的事', desc: '安静的环境、固定的日程、提前知道会发生什么' },
      { icon: '💚', title: '让我快乐的事', desc: '做烘焙、坐公交车看风景、有人耐心听我说话' },
      { icon: '🧸', title: '安抚我的方式', desc: '给我5分钟独处时间，给我一个简单的选择，不要催促我' }
    ],
    communicationPreference: {
      callMe: '叫我"小雨"就好',
      howToTalk: '用短句、慢一点、一次只说一件事。给我几秒钟反应时间。',
      howToExplain: '用"先...然后..."的句式，用我熟悉的例子（公交车、烘焙）打比方',
      avoid: '不要一次说很多件事，不要用反问或讽刺，不要催我"快点"'
    },
    independence: [
      { level: '✅ 我能自己做', items: ['刷牙洗脸', '穿衣服', '吃饭', '收拾餐具', '看公交车线路图规划路线', '做曲奇和杯子蛋糕'] },
      { level: '🤝 需要协助', items: ['理解新任务指令', '应对突然改变的计划', '在嘈杂环境中保持平静', '处理紧急情况'] }
    ],
    aspiration: '我希望有一份和烘焙相关的工作，每天能安安静静地做事。我也希望别人了解我之后，不会觉得我"奇怪"。'
  };

  /* ==========================================================
   * 三类信息来源标记（P2 核心新增）
   * ========================================================== */

  /** 信息来源类型 */
  var SOURCE_TYPES = {
    selfReported: { key: 'self', label: '心青年自己说的', icon: '💬', color: '#4A90D9', desc: '本人通过对话或表达直接传递的信息' },
    observerReported: { key: 'observer', label: '支持者观察到的', icon: '👁️', color: '#722ED1', desc: '家长、老师等照护者基于观察记录的信息' },
    coConfirmed: { key: 'confirmed', label: '大家共同确认的', icon: '✅', color: '#52C41A', desc: '多方交叉验证后共同认可的信息' }
  };

  /* ==========================================================
   * ABC 支持框架记录（P4 核心新增）
   * ========================================================== */

  /** ABC 框架模板 */
  var ABC_FRAMEWORK = {
    antecedent: { label: '发生前（环境/人物/事件）', placeholder: '当时的环境是怎样的？周围有哪些人？之前发生了什么？', hint: '尽量描述可观察的事实，避免主观判断' },
    behavior: { label: '发生时（可观察到的表现）', placeholder: '具体做了什么？说了什么？持续了多久？', hint: '避免"不听话""情绪不好"等标签，只记录观察到的行为' },
    consequence: { label: '支持措施（工作人员做了什么）', placeholder: '当时采取了什么措施？说了什么？', hint: '描述实际采取的行动' },
    result: { label: '结果（什么有效、什么无效）', placeholder: '哪种方法有效？哪种没有帮助？为什么？', hint: '记录可观察到的结果变化' },
    nextSuggestion: { label: '下次建议', placeholder: '是否需要调整环境或任务？下次可以试试什么不同的方法？', hint: '基于这次经验，给下次支持的建议' }
  };

  /** 示例：完整的ABC支持链记录 */
  var abcSampleRecord = {
    antecedent: '下午2:30临时取消烘焙课，改为户外活动。教室里约有6人在说话，声音较大。',
    behavior: '小雨开始反复问"为什么不去烘焙"，在教室内来回走动，约3分钟后双手捂住耳朵。',
    consequence: '李老师蹲下来，用平和的语气说"我们先坐一下"，带到安静角落，给他看了明天的日程表，让他选了"先喝水还是先坐5分钟"。',
    result: '选择"坐5分钟"后，约4分钟情绪平稳。后续主动问"明天有烘焙课吗"。',
    nextSuggestion: '① 活动改变时提前告知，出示修改后的日程卡 ② 在教室设一个安静的"休息角" ③ 准备备选活动让他选择'
  };

  /* ==========================================================
   * 策略有效性评价体系（P9 核心新增）
   * ========================================================== */

  var EFFECTIVENESS_LEVELS = [
    { value: 'effective', label: '有效', icon: '✅', color: '#52C41A', desc: '这个方法明显帮助了心青年' },
    { value: 'partial', label: '部分有效', icon: '🔶', color: '#FAAD14', desc: '有一定帮助，但效果不完全' },
    { value: 'none', label: '无明显效果', icon: '⚪', color: '#999', desc: '没有观察到明显变化' },
    { value: 'worse', label: '可能加重压力', icon: '⚠️', color: '#F5222D', desc: '这个方法可能让情况更糟' }
  ];

  /** 已验证的有效支持经验（P7 AI发现示例） */
  var verifiedStrategies = [
    {
      id: 'strat_001',
      name: '提前告知变化并展示日程卡',
      triggerPattern: '活动临时改变',
      earlySignals: '反复询问、来回走动',
      steps: ['提前告知活动安排变化', '出示修改后的日程图', '让他选择替代活动'],
      avoidMethods: ['突然通知变化', '多人围住解释', '连续追问感受'],
      recoveryArrangement: '确认情绪平稳后，自然过渡到当天活动，不过度关注',
      effectiveness: 'effective',
      verifiedAt: '2026-07-28',
      applicableScenarios: ['学校', '就业', '社区活动'],
      sourceType: 'confirmed'
    },
    {
      id: 'strat_002',
      name: '提供安静空间 + 简单选择恢复控制感',
      triggerPattern: '环境嘈杂、人多',
      earlySignals: '捂耳朵、突然不说话、找借口离开',
      steps: ['引导到安静空间', '给5分钟独处', '提供2个简单选择（喝水or坐着）'],
      avoidMethods: ['追问"你怎么了"', '试图讲道理', '不让离开'],
      recoveryArrangement: '允许在自己觉得舒服的时候自然回归，不强迫',
      effectiveness: 'effective',
      verifiedAt: '2026-07-25',
      applicableScenarios: ['学校', '社区活动', '临时照护'],
      sourceType: 'confirmed'
    },
    {
      id: 'strat_003',
      name: '用"先...然后..."分步说明新任务',
      triggerPattern: '新任务、不熟悉的流程',
      earlySignals: '站在原地不动、重复问"怎么做"',
      steps: ['把任务拆成小步骤', '用"先...然后..."说明', '给步骤卡片辅助理解', '允许按自己节奏做'],
      avoidMethods: ['一次性说完所有步骤', '催促"快点"', '在他没准备好时就让他开始'],
      recoveryArrangement: '完成每步后给予简单肯定，自然进入下一步',
      effectiveness: 'effective',
      verifiedAt: '2026-07-20',
      applicableScenarios: ['学校', '就业', '社区活动'],
      sourceType: 'confirmed'
    }
  ];

  /* ==========================================================
   * AI 发现有效支持经验 演示数据（P7 P10 核心新增）
   * ========================================================== */

  /** AI 发现提示示例 */
  var aiDiscoverySamples = [
    {
      id: 'discovery_001',
      title: 'AI 发现：有效支持经验沉淀建议',
      observation: '近5次情绪波动中，有4次发生在活动临时改变后。其中提前展示日程卡的2次，恢复时间明显更短（平均4分钟 vs 15分钟）。',
      suggestion: '是否将"提前告知变化并展示日程卡"加入小雨的支持建议？',
      evidence: [
        { date: '2026-07-28', event: '烘焙课临时取消', support: '展示日程卡 + 提供选择', result: '4分钟恢复' },
        { date: '2026-07-22', event: '户外活动改为室内', support: '提前告知 + 展示日程卡', result: '3分钟恢复' },
        { date: '2026-07-15', event: '老师临时换人', support: '未提前告知', result: '20分钟恢复' },
        { date: '2026-07-10', event: '参观地点改变', support: '未提前告知', result: '15分钟恢复' },
        { date: '2026-07-03', event: '课程顺序调整', support: '当时解释原因', result: '12分钟恢复' }
      ],
      status: 'pending_confirm'
    },
    {
      id: 'discovery_002',
      title: 'AI 发现：不同支持者记录差异',
      observation: '妈妈记录的"情绪波动"频率（每周3次）与李老师记录的频率（每周1次）存在明显差异。可能原因：家庭环境触发因素更多，或妈妈对情绪波动的定义更敏感。',
      suggestion: '建议妈妈和李老师共同回顾两次记录，确认各自的观察标准是否一致。这不是对错的判断，而是为了更好地理解小雨在不同环境下的状态。',
      evidence: [],
      status: 'pending_confirm'
    },
    {
      id: 'discovery_003',
      title: 'AI 发现：值得关注的变化',
      observation: '最近两周，小雨在烘焙活动中的参与度从"需要全程引导"变为"可独立完成大部分步骤"。李老师记录中出现了新的积极行为：主动收拾工具、询问"明天还做吗"。',
      suggestion: '这可能是就业准备度的积极信号。是否可以尝试让他指导新学员做简单步骤？（注意：这只是待核实的观察线索，不是诊断结论，请由熟悉小雨的支持者确认。）',
      evidence: [],
      status: 'pending_confirm'
    }
  ];

  /* ==========================================================
   * 多场景交接卡（P6 核心新增）
   * ========================================================== */

  var scenarioCards = {
    medical: {
      id: 'medical',
      label: '🏥 就医沟通卡',
      target: '医生、护士',
      sections: [
        { title: '基本信息', type: 'blue', items: ['小雨，24岁，男性', '海鲜过敏（虾蟹贝类）——严禁接触', '无长期用药'] },
        { title: '沟通方式', type: 'green', items: ['用短句、慢一点沟通', '给他几秒钟反应时间', '他能听懂，但表达可能需要时间', '重要信息请先告知陪同者'] },
        { title: '就诊注意事项', type: 'yellow', items: ['提前告知检查步骤，用"先...然后..."', '嘈杂环境可能让他紧张', '如需身体接触，请先告诉他你要做什么', '提供安静等候空间更好'] },
        { title: '紧急联系人', type: 'red', items: ['妈妈 138-xxxx-xxxx（法定支持人）', '李老师 010-xxxx-xxxx（机构老师）'] }
      ]
    },
    work: {
      id: 'work',
      label: '💼 工作支持卡',
      target: '就业辅导员、同事',
      sections: [
        { title: '能力与优势', type: 'blue', items: ['独立完成烘焙（曲奇、杯子蛋糕）', '按步骤完成任务，做事专注', '了解公交路线，能独立通勤', '工作态度认真负责'] },
        { title: '有效支持方式', type: 'green', items: ['新任务用步骤卡片辅助，一次一个步骤', '提前告知工作安排的变化', '允许在自己的节奏下完成任务', '用具体、正面的反馈（"这个曲奇形状很好"）'] },
        { title: '需要特别留意', type: 'yellow', items: ['活动临时改变时可能焦虑', '嘈杂环境可能影响工作状态', '需要明确的开始和结束信号', '避免安排需要快速反应的任务'] },
        { title: '紧急联系', type: 'red', items: ['妈妈 138-xxxx-xxxx', '李老师 010-xxxx-xxxx'] }
      ]
    },
    community: {
      id: 'community',
      label: '🎯 社区活动支持卡',
      target: '社区工作者、志愿者',
      sections: [
        { title: '认识小雨', type: 'blue', items: ['24岁，安静、友善', '对公交车和烘焙非常了解', '喜欢动物、电子琴和拼图'] },
        { title: '如何支持他', type: 'green', items: ['提前说明活动流程', '嘈杂时带他到安静处', '给他反应时间，不要催促', '用他喜欢的话题开场：公交车、烘焙'] },
        { title: '需要留意', type: 'yellow', items: ['环境太吵时会捂耳朵', '计划改变时需要提前告知', '海鲜过敏——注意活动中的食物'] },
        { title: '联系方式', type: 'red', items: ['妈妈 138-xxxx-xxxx', '李老师 010-xxxx-xxxx'] }
      ]
    },
    respite: {
      id: 'respite',
      label: '🏠 临时照护交接卡',
      target: '临时照护者',
      sections: [
        { title: '5分钟认识我', type: 'blue', items: ['我是小雨，24岁。我话不多但我能听懂。', '我喜欢烘焙、公交车、猫咪和电子琴。', '请用短句慢慢和我说，给我反应时间。'] },
        { title: '日常安排', type: 'green', items: ['早餐9:00（注意：不能有海鲜）', '自由时间喜欢看书、拼图、听音乐', '午餐11:30（避免突然更换菜单）', '午休12:30需要安静环境', '晚上10点前入睡'] },
        { title: '需要特别留意的情况', type: 'yellow', items: ['活动临时改变时可能焦虑——提前告知很重要', '嘈杂环境可能不适——提供安静空间', '被催促时会不安——给他足够时间', '如有焦虑信号（反复问、来回走）：带到安静处，给5分钟'] },
        { title: '紧急联系', type: 'red', items: ['妈妈 138-xxxx-xxxx', '爸爸 139-xxxx-xxxx', '如发生严重过敏或自伤行为，立即拨打120'] }
      ]
    },
    emergency: {
      id: 'emergency',
      label: '🚨 紧急情况速读卡',
      target: '急救人员',
      sections: [
        { title: '身份信息', type: 'red', items: ['姓名：小雨，24岁，男性', '诊断：孤独症谱系', '沟通：能理解简单指令，但表达可能有限'] },
        { title: '医疗关键信息', type: 'red', items: ['海鲜过敏（虾蟹贝类）——可能引起严重过敏反应', '无长期用药', '年度体检正常'] },
        { title: '危机处理要点', type: 'yellow', items: ['用短句、平静的声音沟通', '一次只说一件事', '减少环境刺激（关灯、降低噪音）', '不要多人围住或连续追问', '允许他握住熟悉的物品'] },
        { title: '紧急联系人', type: 'red', items: ['妈妈 138-xxxx-xxxx', '爸爸 139-xxxx-xxxx', '李老师 010-xxxx-xxxx'] }
      ]
    }
  };

  /* ==========================================================
   * 压力信号与支持方法（替代"行为红线"）（P3 核心新增）
   * ========================================================== */

  var stressSignals = [
    {
      id: 'stress_001',
      category: '需要特别留意的情况',
      triggerFactors: '临时改变计划、环境过于嘈杂、多人同时发出指令',
      earlySignals: '反复询问同一个问题、来回走动、说话音量变大',
      behavior: '可能捂耳朵、找借口离开、突然不说话',
      effectiveSupport: [
        '减少语言指令，出示日程图',
        '引导到安静空间',
        '提供2个简单选择（"先喝水还是先坐一下？"）'
      ],
      avoidMethods: ['多人围住解释', '连续追问"你怎么了"', '试图讲道理或说服'],
      recoveryArrangement: '确认情绪平稳后自然过渡，不过度关注刚才的事件',
      sourceType: 'confirmed'
    },
    {
      id: 'stress_002',
      category: '压力信号与支持方法',
      triggerFactors: '被催促、新任务没理解、被不打招呼触碰',
      earlySignals: '站在原地不动、重复说"不会"、"不知道"',
      behavior: '可能推开物品、离开座位、说话有情绪',
      effectiveSupport: [
        '用步骤卡片分步说明',
        '允许按自己的节奏做',
        '用"先...然后..."句式'
      ],
      avoidMethods: ['说"你怎么连这个都不懂"', '催促"快点"', '不打招呼就触碰身体'],
      recoveryArrangement: '完成第一步后给予简单肯定，逐步恢复任务信心',
      sourceType: 'confirmed'
    },
    {
      id: 'stress_003',
      category: '安全提醒',
      triggerFactors: '接触到海鲜（虾蟹贝类）',
      earlySignals: '皮肤发红、呼吸急促',
      behavior: '可能出现严重过敏反应',
      effectiveSupport: [
        '立即停止接触',
        '拨打120',
        '通知紧急联系人'
      ],
      avoidMethods: ['任何含有海鲜的食物或调味料'],
      recoveryArrangement: '就医后确认身体状况，避免再次接触',
      sourceType: 'confirmed'
    }
  ];

  /* ==========================================================
   * 完整支持链演示数据（P10 核心新增）
   * ========================================================== */

  var demoWorkflow = {
    title: 'AI懂我 · 工作演示链',
    description: '以下演示AI如何帮助沉淀有效支持经验，防止宝贵的支持知识随着人员更换而丢失',
    steps: [
      { step: 1, actor: '心青年·小雨', action: '在对话端表达："明天不想去新的工作地点。"', icon: '💬', color: '#4A90D9' },
      { step: 2, actor: 'AI懂我', action: '通过简短追问理解原因：是因为之前没去过、不知道路怎么走、还是担心那里的人不认识？', icon: '🤖', color: '#722ED1' },
      { step: 3, actor: '妈妈·家长', action: '补充记录：小雨对新环境和临时变化比较敏感，上次换工位时焦虑了20分钟。', icon: '👩', color: '#52C41A' },
      { step: 4, actor: '李老师', action: '记录有效方法：提前给小雨看了新地点的照片和公交路线图，用日程卡展示了当天流程，焦虑明显降低。', icon: '👩\u200d🏫', color: '#FAAD14' },
      { step: 5, actor: 'AI懂我', action: 'AI 分析发现：近4次涉及"新环境"的记录中，有3次使用了"提前展示照片+路线图"，焦虑持续时间平均缩短70%。建议将此方法沉淀为小雨的"新环境适应策略"。', icon: '🤖', color: '#722ED1' },
      { step: 6, actor: '系统', action: '自动更新工作场景支持卡，新任就业辅导员用5分钟即可了解小雨并知道如何正确提供支持。', icon: '📋', color: '#EB2F96' },
      { step: 7, actor: '价值', action: '即使支持人员更换，小雨的有效支持经验不会丢失。这就是"AI懂我"的核心价值。', icon: '💡', color: '#13C2C2' }
    ]
  };

  // 暴露到全局
  window.Constants = {
    basicInfo: basicInfo,
    likesList: likesList,
    dislikesList: dislikesList,
    communicationGuide: communicationGuide,
    emotionSupport: emotionSupport,
    careInfo: careInfo,
    workInfo: workInfo,
    dailyRoutine: dailyRoutine,
    relationsInfo: relationsInfo,
    quickCardVersions: quickCardVersions,
    privacyLevels: privacyLevels,
    roleLabels: roleLabels,
    FAMILY_RELATIONS: FAMILY_RELATIONS,
    INVITABLE_ROLES: INVITABLE_ROLES,
    ROLES: ROLES,
    RECORD_TYPES: RECORD_TYPES,
    MOOD_OPTIONS: MOOD_OPTIONS,
    EMOTION_OPTIONS: EMOTION_OPTIONS,
    routeMap: routeMap,
    PAGE_PARENT: PAGE_PARENT,
    PAGE_BACK_PARENT: PAGE_BACK_PARENT,
    ROLE_NAV_TABS: ROLE_NAV_TABS,
    ROLE_DEFAULT_PAGES: ROLE_DEFAULT_PAGES,
    SIDEBAR_MENU: SIDEBAR_MENU,
    GOVERNMENT_NAV_ITEMS: GOVERNMENT_NAV_ITEMS,
    ADMIN_NAV_ITEMS: ADMIN_NAV_ITEMS,
    STRATEGY_KB: STRATEGY_KB,
    EMOTION_TO_STRATEGY: EMOTION_TO_STRATEGY,
    MODULE_TAGS: MODULE_TAGS,
    TYPE_TO_MODULE: TYPE_TO_MODULE,
    RECORD_MATRIX: RECORD_MATRIX,
    // v2.0 新增：以人为本
    aboutMe: aboutMe,
    SOURCE_TYPES: SOURCE_TYPES,
    ABC_FRAMEWORK: ABC_FRAMEWORK,
    abcSampleRecord: abcSampleRecord,
    EFFECTIVENESS_LEVELS: EFFECTIVENESS_LEVELS,
    verifiedStrategies: verifiedStrategies,
    aiDiscoverySamples: aiDiscoverySamples,
    scenarioCards: scenarioCards,
    stressSignals: stressSignals,
    demoWorkflow: demoWorkflow
  };

})();