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
    volunteer: {
      label: '志愿者版',
      target: '新接触小雨的志愿者',
      sections: [
        { title: '认识小雨', type: 'blue', items: ['24岁，安静的男孩', '喜欢猫、音乐、烘焙'] },
        { title: '最重要的三条', type: 'red', items: ['不碰海鲜（他过敏）', '不要催他"快点"', '不要不打招呼碰他'] },
        { title: '和他相处', type: 'green', items: ['说话慢一点、一次说一件事', '给他反应时间', '安静陪伴就好'] },
        { title: '如果他紧张', type: 'yellow', items: ['不要追问"怎么了"', '保持安静，给他空间', '告诉附近的老师或家长'] }
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
    self:      ['A', 'B'],
    parent:    ['A', 'B', 'C', 'D'],
    teacher:   ['A', 'B'],
    caregiver: ['A', 'B', 'C'],
    volunteer: ['A']
  };

  /** 角色名称映射（中文） */
  var roleLabels = {
    self: '心青年本人',
    parent: '家长',
    teacher: '老师',
    caregiver: '护理员',
    volunteer: '志愿者'
  };

  /** 对话式采集预设脚本 */
  var chatScript = [
    {
      step: 0,
      aiMessage: '您好！我是"AI懂我"档案助手。我会通过几个简单的问题帮您建立支持档案。我们先从基本信息开始吧！',
      options: ['好的，开始吧', '我先了解一下流程'],
      userReply: null
    },
    {
      step: 1,
      aiMessage: '请告诉我，您要为谁建立支持档案？他/她的名字是什么？',
      options: ['我叫小雨，24岁，男性', '我叫小明，20岁，女性'],
      userReply: null
    },
    {
      step: 2,
      aiMessage: '好的！{name}平时最喜欢做什么呢？可以举几个例子。',
      options: ['喜欢烘焙、公交车、弹琴、猫', '喜欢画画、拼图、听音乐'],
      userReply: null
    },
    {
      step: 3,
      aiMessage: '那有什么事情是{name}特别不喜欢或者会让他/她不舒服的？',
      options: ['突然改变计划、很吵的环境、被催促', '人多的时候、强光、某些声音'],
      userReply: null
    },
    {
      step: 4,
      aiMessage: '非常重要的信息：{name}有没有食物过敏或需要特别注意的医疗事项？',
      options: ['海鲜过敏（虾、蟹、贝类）——严禁接触', '没有过敏，但有癫痫需要服药'],
      userReply: null
    },
    {
      step: 5,
      aiMessage: '和{name}沟通时，什么方式最有效？有什么需要特别注意的吗？',
      options: ['短句、慢一点、一次说一件事，给反应时间', '用图片辅助理解，避免复杂指令'],
      userReply: null
    },
    {
      step: 6,
      aiMessage: '{name}在什么情况下容易情绪波动？情绪波动时有什么表现？',
      options: ['环境太吵、计划改变、被催促时会焦虑', '被批评、做不好事情时会沮丧'],
      userReply: null
    },
    {
      step: 7,
      aiMessage: '最后一个问题：{name}身边有哪些重要的照顾者或支持者？',
      options: ['爸爸妈妈（法定支持人），李老师（机构老师）', '妈妈和外婆，社区社工小刘'],
      userReply: null
    },
    {
      step: 8,
      aiMessage: '太好了！我已经收集了所有关键信息。正在为您生成"AI懂我"支持档案...\n\n档案已经生成完毕！您可以在首页查看小雨的完整支持档案，也可以打开速读卡分享给老师或志愿者。',
      options: [],
      userReply: null
    }
  ];

  /* ==========================================================
   * 角色系统配置
   * ========================================================== */

  /** 多角色配置 */
  var ROLES = {
    self: { label: '心青年本人', name: '小雨', avatar: '👦', color: '#4A90D9',
      canAdd: ['mood', 'note'],
      description: '记录自己的心情和感受' },
    parent: { label: '家长/照护人', name: '妈妈', avatar: '👩', color: '#52C41A',
      canAdd: ['care', 'communication', 'emotion', 'strategy', 'note'],
      description: '记录日常照护和家庭情况' },
    teacher: { label: '机构老师', name: '李老师', avatar: '👩\u200d🏫', color: '#FAAD14',
      canAdd: ['activity', 'communication', 'emotion', 'strategy', 'note'],
      description: '记录教学和活动情况' },
    caregiver: { label: '护理员', name: '张阿姨', avatar: '👵', color: '#722ED1',
      canAdd: ['care', 'communication', 'emotion', 'strategy', 'note'],
      description: '记录日常护理和健康情况' },
    volunteer: { label: '志愿者', name: '小王', avatar: '👷', color: '#13C2C2',
      canAdd: ['accompany', 'emotion', 'note'],
      description: '记录陪伴和观察情况' }
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
    accompany: { label: '陪伴记录', icon: '🤝', color: '#13C2C2',
      fields: ['content'], description: '记录陪伴过程中的观察' },
    note: { label: '一般备注', icon: '📝', color: '#999999',
      fields: ['title', 'content'], description: '添加其他需要记录的备注' },
    strategy: { label: '策略记录', icon: '🧩', color: '#EB2F96',
      fields: ['emotion_type', 'title', 'content', 'effectiveness'], description: '记录情绪行为策略使用及效果' }
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
    'collect': 'collect',
    'login': 'login',
    'profile': 'profile',
    'charts': 'charts',
    'tasks': 'tasks',
    'calendar': 'calendar',
    'archive': 'archive',
    'analytics': 'analytics'
  };

  /** 侧边栏菜单配置 */
  var SIDEBAR_MENU = [
    { group: '概览', items: [{ hash: 'home', icon: '🏠', label: '首页' }] },
    {
      group: '档案',
      items: [
        { hash: 'archive', icon: '📋', label: '完整档案' },
        { hash: 'life', icon: '💚', label: '生活' },
        { hash: 'communication', icon: '💬', label: '沟通说明书' },
        { hash: 'emotion', icon: '🌈', label: '情绪与行为' },
        { hash: 'care', icon: '🩺', label: '照护与医疗' },
        { hash: 'work', icon: '💼', label: '工作支持' },
        { hash: 'relations', icon: '👥', label: '关系地图' }
      ]
    },
    {
      group: '日常',
      items: [
        { hash: 'timeline', icon: '📅', label: '时间轴' },
        { hash: 'tasks', icon: '✅', label: '每日任务' },
        { hash: 'calendar', icon: '📆', label: '日程日历' }
      ]
    },
    {
      group: '数据',
      items: [
        { hash: 'charts', icon: '📊', label: '数据可视化' },
        { hash: 'analytics', icon: '📈', label: '数据价值' }
      ]
    },
    {
      group: 'AI助手',
      items: [{ hash: 'collect', icon: '🤖', label: '对话采集' }]
    }
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
    chatScript: chatScript,
    ROLES: ROLES,
    RECORD_TYPES: RECORD_TYPES,
    MOOD_OPTIONS: MOOD_OPTIONS,
    EMOTION_OPTIONS: EMOTION_OPTIONS,
    routeMap: routeMap,
    SIDEBAR_MENU: SIDEBAR_MENU,
    STRATEGY_KB: STRATEGY_KB,
    EMOTION_TO_STRATEGY: EMOTION_TO_STRATEGY
  };

})();