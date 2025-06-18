// UI交互模块

// 防重复初始化标志
let uiInitialized = false;

// DOM 元素引用
let originalPromptTextarea;
let optimizeBtn;
let copyBtn;
let clearBtn;
let charCountElement;
let helpLink;
let helpModal;
let closeHelpModalBtn;
let businessLink;
let businessModal;
let closeBusinessModalBtn;
let announcementLink;
let announcementModal;
let closeAnnouncementModalBtn;
let startUsingBtn;

// 初始化UI功能
function initUI() {
    // 防止重复初始化
    if (uiInitialized) {
        console.log('UI已经初始化，跳过重复初始化');
        return;
    }

    // 获取DOM元素
    getDOMElements();

    // 绑定事件监听器
    bindEventListeners();

    // 初始化其他功能
    initOtherFeatures();

    // 页面加载动画
    initPageAnimation();

    // 标记为已初始化
    uiInitialized = true;
    console.log('UI初始化完成');
}

// 获取DOM元素
function getDOMElements() {
    originalPromptTextarea = document.getElementById('originalPrompt');
    optimizeBtn = document.getElementById('optimizeBtn');
    copyBtn = document.getElementById('copyBtn');
    clearBtn = document.getElementById('clearBtn');
    charCountElement = document.querySelector('.char-count');
    helpLink = document.getElementById('helpLink');
    helpModal = document.getElementById('helpModal');
    closeHelpModalBtn = document.getElementById('closeHelpModal');
    businessLink = document.getElementById('businessLink');
    businessModal = document.getElementById('businessModal');
    closeBusinessModalBtn = document.getElementById('closeBusinessModal');
    announcementLink = document.getElementById('announcementLink');
    announcementModal = document.getElementById('announcementModal');
    closeAnnouncementModalBtn = document.getElementById('closeAnnouncementModal');
    startUsingBtn = document.getElementById('startUsingBtn');
}

// 绑定事件监听器
function bindEventListeners() {
    // 优化按钮事件
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', () => {
            optimizeBtn.classList.remove('pulse-hint');
            addButtonAnimation(optimizeBtn);

            // 检查是否是思考模式
            const selectedMode = getSelectedMode();
            if (selectedMode === 'thinking') {
                handleThinkingMode();
            } else {
                optimizePrompt();
            }
        });
    }

    // 复制和清空按钮事件
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAll);
    }

    // 字符计数更新
    if (originalPromptTextarea) {
        originalPromptTextarea.addEventListener('input', updateCharCount);
        
        // 键盘事件处理
        originalPromptTextarea.addEventListener('keydown', handleKeyboardEvents);
    }

    // 模态框事件
    initModalEvents();
    
    // 模型卡片效果
    addModelCardEffects();
    
    // 模式选择事件
    initModeSelection();
    
    // 邮箱复制事件
    initEmailCopyEvent();
}

// 处理键盘事件
function handleKeyboardEvents(e) {
    // Ctrl + Enter: 快速优化 (使用Gemini Flash模型)
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        if (optimizeBtn) {
            optimizeBtn.classList.remove('pulse-hint');
            addButtonAnimation(optimizeBtn);
        }

        // 检查是否是思考模式
        const selectedMode = getSelectedMode();
        if (selectedMode === 'thinking') {
            handleThinkingMode();
        } else {
            quickOptimizePrompt();
        }
    }
    // Enter: 根据当前模式选择相应的处理方式
    else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (optimizeBtn) {
            optimizeBtn.classList.remove('pulse-hint');
            addButtonAnimation(optimizeBtn);
        }

        // 检查是否是思考模式
        const selectedMode = getSelectedMode();
        if (selectedMode === 'thinking') {
            handleThinkingMode();
        } else {
            optimizePrompt();
        }
    }
    // Shift + Enter: 换行 (默认行为)
}

// 更新字符计数
function updateCharCount() {
    if (!originalPromptTextarea || !charCountElement) return;
    
    const text = originalPromptTextarea.value;
    const count = text.length;
    charCountElement.textContent = `${count} 字符`;

    // 当有内容时，给按钮添加脉冲提示
    if (optimizeBtn) {
        if (count > 0 && !optimizeBtn.classList.contains('pulse-hint')) {
            optimizeBtn.classList.add('pulse-hint');
        } else if (count === 0) {
            optimizeBtn.classList.remove('pulse-hint');
        }
    }
}

// 初始化模态框事件
function initModalEvents() {
    // 帮助弹框
    if (helpLink && helpModal && closeHelpModalBtn) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(helpModal);
        });

        closeHelpModalBtn.addEventListener('click', function() {
            closeModal(helpModal);
        });
    }

    // 问题反馈弹框
    if (businessLink && businessModal && closeBusinessModalBtn) {
        businessLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(businessModal);
        });

        closeBusinessModalBtn.addEventListener('click', function() {
            closeModal(businessModal);
        });
    }

    // 公告弹框
    if (announcementLink && announcementModal && closeAnnouncementModalBtn) {
        announcementLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(announcementModal);
        });

        closeAnnouncementModalBtn.addEventListener('click', function() {
            closeModal(announcementModal);
        });
    }

    // 开始使用按钮
    if (startUsingBtn && announcementModal) {
        startUsingBtn.addEventListener('click', function() {
            closeModal(announcementModal);
            if (originalPromptTextarea) {
                originalPromptTextarea.focus();
            }
        });
    }

    // 点击弹框外部区域关闭弹框
    window.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            closeModal(helpModal);
        }
        if (e.target === businessModal) {
            closeModal(businessModal);
        }
        if (e.target === announcementModal) {
            closeModal(announcementModal);
        }
    });

    // ESC键关闭弹框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (helpModal && helpModal.style.display === 'block') {
                closeModal(helpModal);
            }
            if (businessModal && businessModal.style.display === 'block') {
                closeModal(businessModal);
            }
            if (announcementModal && announcementModal.style.display === 'block') {
                closeModal(announcementModal);
            }
        }
    });
}

// 打开模态框
function openModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
}

// 关闭模态框
function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // 恢复背景滚动
    }
}

// 模型卡片点击效果
function addModelCardEffects() {
    const modelCards = document.querySelectorAll('.model-card');

    modelCards.forEach(card => {
        card.addEventListener('click', () => {
            // 触发粒子迸发效果
            triggerParticleBurst(card);
        });
    });
}

// 初始化模式选择功能
function initModeSelection() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modeSelect = document.getElementById('modeSelect');

    // 按钮模式选择
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            modeBtns.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的active类
            btn.classList.add('active');
            
            // 同步下拉框的值
            if (modeSelect) {
                modeSelect.value = btn.dataset.mode;
                // 同时更新下拉框的data-selected属性
                modeSelect.setAttribute('data-selected', btn.dataset.mode);
            }
        });
    });

    // 下拉框模式选择
    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const selectedMode = e.target.value;
            
            // 移除所有按钮的active类
            modeBtns.forEach(btn => btn.classList.remove('active'));
            
            // 找到对应的按钮并添加active类
            const targetBtn = document.querySelector(`[data-mode="${selectedMode}"]`);
            if (targetBtn) {
                targetBtn.classList.add('active');
            }
            
            // 为下拉框设置选中模式的数据属性，用于特殊样式
            modeSelect.setAttribute('data-selected', selectedMode);
        });
        
        // 初始化时也设置默认选中的模式
        const initialMode = modeSelect.value || 'general';
        modeSelect.setAttribute('data-selected', initialMode);
    }
}

// 初始化邮箱复制事件
function initEmailCopyEvent() {
    const contactEmail = document.querySelector('.contact-email');
    if (contactEmail) {
        contactEmail.addEventListener('click', async function() {
            const email = this.textContent.trim();
            const success = await copyTextToClipboard(email);
            
            if (success) {
                showCustomAlert('邮箱地址已复制到剪贴板', 'success', 2000);
            } else {
                showCustomAlert('复制失败，请手动复制邮箱地址', 'error', 3000);
            }
        });
    }
}

// 初始化其他功能
function initOtherFeatures() {
    // 设置初始焦点
    if (originalPromptTextarea) {
        originalPromptTextarea.focus();
    }

    // 更新字符计数
    updateCharCount();

    // 初始化密码切换功能（独立于认证模块）
    initPasswordToggles();

    // 监听认证弹窗的显示，重新初始化密码切换
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const authModal = document.getElementById('authModal');
                if (authModal && authModal.style.display === 'flex') {
                    console.log('检测到认证弹窗显示，重新初始化密码切换');
                    setTimeout(() => {
                        initPasswordToggles();
                    }, 200);
                }
            }
        });
    });

    // 观察认证弹窗的变化
    const authModal = document.getElementById('authModal');
    if (authModal) {
        observer.observe(authModal, { attributes: true, attributeFilter: ['style'] });
    }
}

// 页面加载动画
function initPageAnimation() {
    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
}

// 初始化密码显示切换功能
function initPasswordToggles() {
    console.log('初始化密码切换功能');
    const passwordToggles = document.querySelectorAll('.password-toggle');
    console.log('找到密码切换按钮数量:', passwordToggles.length);

    passwordToggles.forEach((toggle, index) => {
        console.log(`处理第${index + 1}个密码切换按钮:`, toggle.id || 'no-id');

        // 检查是否已经绑定过事件
        if (toggle.dataset.uiInitialized === 'true') {
            console.log('按钮已初始化，跳过');
            return;
        }

        toggle.addEventListener('click', (e) => {
            console.log('密码切换按钮被点击');
            e.preventDefault();
            e.stopPropagation();

            const input = toggle.parentElement.querySelector('input[type="password"], input[type="text"]');
            const eyeOpen = toggle.querySelector('.eye-open');
            const eyeClosed = toggle.querySelector('.eye-closed');

            console.log('找到的元素:', {
                input: !!input,
                eyeOpen: !!eyeOpen,
                eyeClosed: !!eyeClosed,
                currentType: input?.type
            });

            if (input && eyeOpen && eyeClosed) {
                if (input.type === 'password') {
                    input.type = 'text';
                    eyeOpen.style.display = 'none';
                    eyeClosed.style.display = 'block';
                    console.log('密码已显示');
                } else {
                    input.type = 'password';
                    eyeOpen.style.display = 'block';
                    eyeClosed.style.display = 'none';
                    console.log('密码已隐藏');
                }
            } else {
                console.error('密码切换功能缺少必要元素');
            }
        });

        // 标记为已初始化
        toggle.dataset.uiInitialized = 'true';
        console.log('密码切换按钮初始化完成');
    });
}

// 注意：UI初始化已移至script.js中统一管理，避免重复初始化

// 思考模式处理函数
async function handleThinkingMode() {
    const originalPromptTextarea = document.getElementById('originalPrompt');
    const originalPrompt = originalPromptTextarea.value.trim();
    const selectedModel = getSelectedModel();

    if (!originalPrompt) {
        showCustomAlert('请输入要优化的提示词', 'warning', 3000);
        return;
    }

    // 显示加载状态
    showLoading();

    try {
        // 第一阶段：分析提示词
        const analysisData = await analyzeThinkingPrompt(originalPrompt, selectedModel);

        // 隐藏加载状态
        hideLoading();

        // 显示动态表单
        showThinkingForm(analysisData.analysis_result, originalPrompt);

    } catch (error) {
        console.error('思考模式分析失败:', error);
        hideLoading();
        showCustomAlert('分析失败，请检查网络连接或稍后重试', 'error', 3500);
    }
}

// 预设选项配置
const fieldOptions = {
    // 通用字段
    "目标用户": ["开发者/程序员", "设计师/创意工作者", "学生/研究者", "商务人士", "普通用户", "AI工程师", "教师/培训师", "内容创作者"],
    "输出格式": ["详细文本", "结构化列表", "代码示例", "步骤指南", "创意内容", "分析报告", "对话形式", "图表说明"],
    "语调风格": ["专业正式", "友好亲切", "简洁直接", "详细解释", "创意有趣", "学术严谨", "实用导向", "启发引导"],
    "技术水平": ["初学者", "有一定经验", "较为熟练", "专业级别", "专家水平"],
    "难度要求": ["基础入门", "中等难度", "进阶水平", "专业级别", "专家级别"],
    "内容类型": ["教程指南", "问题解答", "创意文案", "技术分析", "策略规划", "总结归纳", "比较分析", "案例研究"],
    
    // 学习相关字段
    "学习目标": ["找工作/求职", "兴趣爱好", "项目开发", "学术研究", "技能提升", "转行准备", "创业需要", "考试准备"],
    "基础水平": ["零基础", "有其他语言基础", "有Java基础", "有编程思维", "计算机专业背景", "自学过编程", "培训班经历", "工作经验"],
    "学习路径": ["在线视频课程", "实体书籍", "实战项目", "培训班", "大学课程", "导师指导", "自学摸索", "社区交流"],
    "时间投入": ["每天1-2小时", "每天3-4小时", "每天5小时以上", "周末集中学习", "工作日晚上", "全职学习", "碎片时间", "寒暑假集中"],
    "实践经验": ["Web开发项目", "移动应用开发", "游戏开发", "数据分析", "算法练习", "开源项目", "企业项目", "个人作品集"],
    
    // 创作相关字段
    "创作目标": ["商业用途", "个人兴趣", "学习练习", "作品集", "比赛参赛", "客户需求", "团队协作", "技能展示"],
    "创作风格": ["现代简约", "古典优雅", "科技未来", "自然清新", "温馨可爱", "专业商务", "艺术抽象", "复古怀旧"],
    "应用场景": ["社交媒体", "商业宣传", "个人博客", "学术论文", "产品介绍", "教学材料", "演示文稿", "印刷品"],
    
    // 分析相关字段  
    "分析深度": ["概览总结", "详细分析", "深度研究", "对比评估", "趋势预测", "原因探究", "解决方案", "实施建议"],
    "分析角度": ["技术角度", "商业角度", "用户角度", "市场角度", "成本角度", "风险角度", "发展角度", "创新角度"],
    
    // 创业/商业相关字段
    "目标人群": ["学生群体", "上班族", "退休人员", "家庭主妇", "自由职业者", "企业主", "年轻创业者", "专业人士"],
    "风险偏好": ["低风险稳健型", "中等风险平衡型", "高风险激进型", "保守谨慎型", "积极进取型", "风险厌恶型", "投机冒险型", "稳中求进型"],
    "启动资金": ["5万以下", "5-10万", "10-20万", "20-50万", "50-100万", "100万以上", "资金有限", "资金充足"],
    "兴趣领域": ["科技互联网", "教育培训", "餐饮服务", "健康养生", "文化创意", "金融投资", "电商零售", "旅游休闲"],
    "技能特长": ["技术开发", "市场营销", "设计创意", "管理协调", "沟通表达", "数据分析", "项目管理", "客户服务"],
    
    // 其他常见字段
    "经验水平": ["新手入门", "初级水平", "中级水平", "高级水平", "专家级别"],
    "预期目标": ["短期收益", "长期发展", "技能提升", "经验积累", "人脉拓展", "品牌建立", "市场占有", "创新突破"],
    "资源需求": ["人力资源", "资金支持", "技术支持", "市场渠道", "合作伙伴", "办公场地", "设备工具", "专业指导"],
    
    // 个人和收益相关字段
    "个人情况": ["技术背景", "管理经验", "销售经验", "创意设计", "数据分析", "教育培训", "服务行业", "多技能复合"],
    "期望收益": ["1-3个月见效", "3-6个月见效", "6-12个月见效", "1年以上长期", "快速回本", "稳定增长", "高收益高风险", "保本微利"],
    
    // 编程学习相关字段
    "编程基础": ["零基础新手", "HTML/CSS基础", "JavaScript基础", "Java基础", "C/C++基础", "其他语言基础", "有编程思维", "计算机专业"],
    "学习资源": ["在线视频课程", "官方文档", "技术书籍", "编程实战", "开源项目", "训练营/培训", "导师指导", "社区论坛"],
    
    // 常见字段的别名和变体
    "使用场景": ["工作学习", "生活娱乐", "商业应用", "学术研究", "个人项目", "团队协作", "教学培训", "创意设计"],
    "使用目的": ["工作需要", "学习提升", "兴趣爱好", "项目开发", "研究分析", "内容创作", "问题解决", "技能训练"],
    "受众群体": ["学生群体", "职场人士", "技术开发者", "创意工作者", "管理人员", "普通用户", "专业人士", "初学者"],
    "主要目标": ["提高效率", "学习新技能", "解决问题", "创作内容", "分析数据", "制定计划", "优化流程", "增长知识"],
    "期望效果": ["快速上手", "深入理解", "实用性强", "创意丰富", "逻辑清晰", "简单易懂", "专业权威", "全面详细"],
    "背景信息": ["完全新手", "有一定基础", "专业背景", "跨领域学习", "实际应用", "理论研究", "教学需要", "工作应用"],
    "相关经验": ["无相关经验", "少量经验", "一定经验", "丰富经验", "专业经验", "跨领域经验", "理论经验", "实践经验"],
    "知识背景": ["零基础", "基础了解", "中等水平", "较深了解", "专业水平", "专家级", "跨学科", "实践为主"],
    "应用领域": ["教育培训", "商业应用", "技术开发", "创意设计", "数据分析", "内容创作", "项目管理", "日常生活"],
    "复杂程度": ["简单易懂", "中等难度", "较为复杂", "高度复杂", "专业级别", "入门级别", "进阶级别", "专家级别"],
    "详细程度": ["简要概述", "基本介绍", "详细说明", "深入分析", "全面解析", "重点突出", "步骤详细", "案例丰富"],
    "时间要求": ["立即可用", "短期内", "中期目标", "长期规划", "快速了解", "逐步学习", "深入研究", "持续改进"],
    "格式要求": ["文字说明", "列表格式", "图表展示", "步骤指导", "案例分析", "对比说明", "问答形式", "结构化"],
    
    // 更多通用字段
    "目标对象": ["学生", "职场新人", "专业人士", "管理者", "技术人员", "创意工作者", "普通用户", "专家学者"],
    "应用范围": ["个人使用", "团队协作", "企业应用", "教育机构", "研究领域", "创业项目", "日常生活", "专业工作"],
    "重点关注": ["实用性", "创新性", "可操作性", "理论深度", "案例丰富", "逻辑清晰", "简单易懂", "专业权威"],
    "预期成果": ["知识掌握", "技能提升", "问题解决", "效率提高", "创新思路", "实践应用", "理论理解", "全面发展"]
};

// 字段匹配函数 - 支持智能匹配和内容分析
function findFieldOptions(fieldKey, fieldQuestion = '') {
    console.log(`🔍 匹配分析 - 字段: "${fieldKey}", 问题: "${fieldQuestion}"`);
    
    // 直接匹配
    if (fieldOptions[fieldKey]) {
        console.log(`✅ 直接匹配成功: ${fieldKey}`);
        return fieldOptions[fieldKey];
    }
    
    // 同义词匹配映射
    const synonymMap = {
        "目标人群": "目标用户",
        "受众": "目标用户", 
        "用户群体": "目标用户",
        "目标受众": "目标用户",
        "用户类型": "目标用户",
        
        "输出样式": "输出格式",
        "回复格式": "输出格式",
        "展示格式": "输出格式",
        "呈现方式": "输出格式",
        
        "语言风格": "语调风格",
        "表达方式": "语调风格",
        "沟通风格": "语调风格",
        "写作风格": "语调风格",
        
        "专业水平": "技术水平",
        "能力水平": "技术水平",
        "熟练程度": "技术水平",
        
        "内容难度": "难度要求",
        "复杂度": "难度要求",
        
        "学习方式": "学习路径",
        "学习渠道": "学习路径",
        
        "时间安排": "时间投入",
        "学习时间": "时间投入",
        
        "项目经验": "实践经验",
        "实际经验": "实践经验",
        "工作经验": "实践经验",
        
        "设计风格": "创作风格",
        "视觉风格": "创作风格",
        
        "使用环境": "应用场景",
        "应用环境": "应用场景",
        "使用情境": "应用场景",
        
        "目的": "使用目的",
        "目标": "主要目标",
        "期望": "期望效果",
        "背景": "背景信息",
        "经验": "相关经验",
        "基础": "知识背景",
        "领域": "应用领域",
        "难度": "复杂程度",
        "详细": "详细程度",
        "时间": "时间要求",
        "格式": "格式要求"
    };
    
    // 检查同义词匹配
    if (synonymMap[fieldKey] && fieldOptions[synonymMap[fieldKey]]) {
        console.log(`✅ 同义词匹配成功: ${fieldKey} -> ${synonymMap[fieldKey]}`);
        return fieldOptions[synonymMap[fieldKey]];
    }
    
    // 关键词包含匹配（字段名称）
    for (const [key, options] of Object.entries(fieldOptions)) {
        if (fieldKey.includes(key) || key.includes(fieldKey)) {
            console.log(`✅ 关键词匹配成功: ${fieldKey} <-> ${key}`);
            return options;
        }
    }
    
    // 智能内容匹配（基于问题描述）
    const questionContent = (fieldKey + ' ' + fieldQuestion).toLowerCase();
    
    // 根据问题内容的关键词来匹配
    const contentMatchers = {
        "目标用户": ["用户", "受众", "人群", "对象", "读者", "观众"],
        "输出格式": ["格式", "形式", "样式", "呈现", "展示", "输出"],
        "语调风格": ["语调", "风格", "语言", "表达", "沟通", "语气", "口吻"],
        "技术水平": ["水平", "程度", "级别", "能力", "熟练", "基础"],
        "难度要求": ["难度", "复杂", "深度", "深浅"],
        "应用场景": ["场景", "环境", "情况", "情境", "用途"],
        "时间投入": ["时间", "周期", "期限", "频率"],
        "学习路径": ["学习", "路径", "方式", "渠道", "途径"],
        "实践经验": ["经验", "实践", "项目", "案例", "实战"],
        "创作风格": ["创作", "设计", "美学", "视觉"],
        "内容类型": ["类型", "内容", "主题", "方向"],
        "使用目的": ["目的", "目标", "用意", "意图"],
        "背景信息": ["背景", "情况", "现状", "基础信息"],
        "期望效果": ["效果", "结果", "期望", "希望", "想要"]
    };
    
    for (const [optionKey, keywords] of Object.entries(contentMatchers)) {
        if (fieldOptions[optionKey] && keywords.some(keyword => questionContent.includes(keyword))) {
            console.log(`✅ 内容匹配成功: "${questionContent}" -> ${optionKey}`);
            return fieldOptions[optionKey];
        }
    }
    
    console.log(`⚠️ 无匹配，使用默认选项`);
    // 默认通用选项
    return ["请选择", "基础水平", "中等水平", "高级水平", "专家水平", "其他"];
}

// 显示思考模式动态表单
function showThinkingForm(analysisResult, originalPrompt) {
    console.log('🎯 showThinkingForm called with analysisResult:', analysisResult);
    console.log('🎯 Modal version - v4.0 DEBUG');
    
    // 使用新的模态弹窗元素
    const thinkingModal = document.getElementById('thinkingModal');
    const thinkingModalContent = document.getElementById('thinkingModalContent');

    console.log('🔍 Modal elements check:', {
        thinkingModal: !!thinkingModal,
        thinkingModalContent: !!thinkingModalContent,
        modalDisplay: thinkingModal?.style.display,
        modalClassList: thinkingModal?.classList.toString()
    });

    if (!thinkingModal || !thinkingModalContent) {
        console.error('❌ 找不到思考模式模态弹窗元素');
        alert('错误：找不到模态弹窗元素，请刷新页面重试');
        return;
    }

    // 清空之前的内容
    thinkingModalContent.innerHTML = '';

    // 生成动态表单字段
    analysisResult.forEach((item, index) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'thinking-field';
        fieldDiv.style.setProperty('--index', index + 1);

        // 检查是否有预设选项（使用智能匹配）
        const hasOptions = findFieldOptions(item.key, item.question);
        console.log(`🔍 字段分析结果:`, {
            fieldKey: item.key,
            fieldQuestion: item.question,
            matchedOptions: hasOptions,
            isDefaultOptions: hasOptions.includes("基础水平")
        });
        
        // 现在所有字段都会有选项，至少有默认选项
        // 生成按钮选择界面
        fieldDiv.innerHTML = `
            <label class="thinking-field-label">
                ${item.key}
            </label>
            <div class="thinking-field-description">${item.question}</div>
            <div class="quick-options-container" data-field-index="${index}">
                ${hasOptions.map(option => `
                    <button type="button" class="quick-option-btn" data-value="${option}">
                        ${option}
                    </button>
                `).join('')}
            </div>
            <textarea
                class="thinking-field-input"
                id="thinking-field-${index}"
                placeholder="或输入自定义内容..."
                data-key="${item.key}"
                rows="2"
            ></textarea>
        `;

        thinkingModalContent.appendChild(fieldDiv);
    });

    // 添加自定义补充信息区域
    const customInfoSection = document.createElement('div');
    customInfoSection.className = 'custom-info-section';
    customInfoSection.innerHTML = `
        <div class="custom-info-header">
            <h3 class="custom-info-title">
                <span class="custom-info-icon">✨</span>
                自定义补充信息
            </h3>
            <p class="custom-info-subtitle">您还可以添加其他重要信息，帮助AI更好地理解您的需求</p>
        </div>
        <div class="custom-info-container" id="customInfoContainer">
            <!-- 自定义信息字段将在这里动态添加 -->
        </div>
        <button type="button" class="add-custom-info-btn" id="addCustomInfoBtn">
            <span class="btn-icon">➕</span>
            <span class="btn-text">添加自定义信息</span>
        </button>
    `;

    thinkingModalContent.appendChild(customInfoSection);

    // 显示模态弹窗（替代原来的页面区域显示和滚动）
    console.log('📱 显示模态弹窗...');
    
    // 多重显示确保机制
    thinkingModal.style.display = 'block';
    thinkingModal.style.visibility = 'visible';
    thinkingModal.style.opacity = '1';
    thinkingModal.style.zIndex = '10001';
    thinkingModal.classList.add('show');
    
    // 防止背景滚动
    document.body.style.overflow = 'hidden';
    
    // 确保模态弹窗在最顶层
    thinkingModal.style.position = 'fixed';
    thinkingModal.style.top = '0';
    thinkingModal.style.left = '0';
    thinkingModal.style.width = '100%';
    thinkingModal.style.height = '100%';
    
    console.log('✅ 模态弹窗状态更新完成:', {
        display: thinkingModal.style.display,
        visibility: thinkingModal.style.visibility,
        opacity: thinkingModal.style.opacity,
        zIndex: thinkingModal.style.zIndex,
        classList: thinkingModal.classList.toString(),
        bodyOverflow: document.body.style.overflow
    });
    
    // 额外的延迟确保，防止样式被覆盖
    setTimeout(() => {
        if (thinkingModal.style.display !== 'block') {
            console.warn('⚠️ 模态弹窗被隐藏，强制重新显示');
            thinkingModal.style.display = 'block';
            thinkingModal.style.visibility = 'visible';
            thinkingModal.style.opacity = '1';
        }
    }, 100);

    // 绑定按钮事件（使用新的按钮ID）
    bindThinkingModalEvents(originalPrompt);
    
    // 绑定关闭事件
    bindThinkingModalCloseEvents();

    // 绑定自定义信息相关事件
    bindCustomInfoEvents();

    // 绑定快速选择按钮事件
    bindQuickOptionEvents();
}

// 绑定快速选择按钮事件
function bindQuickOptionEvents() {
    // 获取所有快速选择按钮
    const quickOptionBtns = document.querySelectorAll('.quick-option-btn');
    
    quickOptionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 获取对应的textarea
            const container = this.closest('.thinking-field');
            const textarea = container.querySelector('.thinking-field-input');
            const optionsContainer = this.closest('.quick-options-container');
            
            // 移除其他按钮的选中状态
            optionsContainer.querySelectorAll('.quick-option-btn').forEach(b => {
                b.classList.remove('selected');
            });
            
            // 添加当前按钮的选中状态
            this.classList.add('selected');
            
            // 将选中的值填入textarea
            textarea.value = this.dataset.value;
            
            // 触发输入事件（如果有其他监听器需要）
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 添加点击动画效果
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // 为textarea添加输入监听，清除按钮选中状态（当用户手动输入时）
    const textareas = document.querySelectorAll('.thinking-field .thinking-field-input');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            const container = this.closest('.thinking-field');
            const optionsContainer = container.querySelector('.quick-options-container');
            
            if (optionsContainer) {
                // 检查当前值是否匹配某个按钮
                const buttons = optionsContainer.querySelectorAll('.quick-option-btn');
                let matchFound = false;
                
                buttons.forEach(btn => {
                    if (btn.dataset.value === this.value) {
                        btn.classList.add('selected');
                        matchFound = true;
                    } else {
                        btn.classList.remove('selected');
                    }
                });
                
                // 如果没有匹配的按钮，清除所有选中状态
                if (!matchFound) {
                    buttons.forEach(btn => btn.classList.remove('selected'));
                }
            }
        });
    });
}

// 绑定思考模式表单事件（原版本）
function bindThinkingFormEvents(originalPrompt) {
    const generateBtn = document.getElementById('generateFinalPromptBtn');
    const skipBtn = document.getElementById('skipThinkingBtn');

    if (generateBtn) {
        generateBtn.onclick = () => generateFinalPrompt(originalPrompt);
    }

    if (skipBtn) {
        skipBtn.onclick = () => {
            // 跳过思考模式，直接生成最终提示词（不传递补充信息）
            generateFinalPromptWithoutInfo(originalPrompt);
        };
    }
}

// 显示思考模式模态弹窗加载状态（性能优化版本）
function showThinkingModalLoading() {
    // 使用HTML中已有的加载状态元素，而不是动态创建
    const existingLoadingOverlay = document.getElementById('thinkingModalLoading');
    
    if (!existingLoadingOverlay) {
        return;
    }

    // 显示已有的加载遮罩层
    existingLoadingOverlay.style.display = 'flex';

    // 同时将按钮设置为加载状态
    const generateBtn = document.getElementById('generateFinalPromptModalBtn');
    if (generateBtn) {
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
    }

    // 页面聚焦到进度条区域
    setTimeout(() => {
        const progressContent = existingLoadingOverlay.querySelector('.thinking-loading-content');
        if (progressContent) {
            progressContent.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }, 300);

    // 启动进度模拟
    simulateThinkingProgress();
}

// 隐藏思考模式模态弹窗加载状态（性能优化版本）
function hideThinkingModalLoading() {
    // 使用HTML中已有的加载状态元素
    const loadingOverlay = document.getElementById('thinkingModalLoading');
    const generateBtn = document.getElementById('generateFinalPromptModalBtn');
    const progressFill = document.getElementById('thinkingProgressFill');
    const progressText = document.getElementById('thinkingProgressText');
    
    // 清理进度定时器
    if (window.thinkingProgressInterval) {
        clearInterval(window.thinkingProgressInterval);
        window.thinkingProgressInterval = null;
    }
    
    // 完成时显示100%进度
    if (progressFill && progressText) {
        progressFill.style.width = '100%';
        progressText.textContent = '优化完成！ 100%';
        
        // 延迟隐藏加载遮罩，让用户看到完成状态
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // 完成后延迟滚动到结果区域
            setTimeout(() => {
                scrollToOptimizedResult();
            }, 500);
            
        }, 1200);
    } else {
        // 如果找不到进度元素，直接隐藏
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // 仍然尝试滚动到结果
        setTimeout(() => {
            scrollToOptimizedResult();
        }, 300);
    }

    if (generateBtn) {
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
    }
}

// 滚动到优化结果区域（性能优化版本）
function scrollToOptimizedResult() {
    // 先尝试滚动到优化结果区域
    const resultSection = document.getElementById('resultSection');
    const optimizedPromptTextarea = document.getElementById('optimizedPrompt');
    
    if (resultSection && resultSection.style.display !== 'none') {
        resultSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // 可选：聚焦到优化后的文本框
        if (optimizedPromptTextarea) {
            setTimeout(() => {
                optimizedPromptTextarea.focus();
            }, 800);
        }
    } else {
        // 如果结果区域不可见，滚动到页面底部或主要内容区域
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            window.scrollTo({
                top: mainContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
}

// 模拟思考进度（性能优化版本）
function simulateThinkingProgress() {
    // 等待加载状态显示完成再开始进度更新
    setTimeout(() => {
        const progressFill = document.getElementById('thinkingProgressFill');
        const progressText = document.getElementById('thinkingProgressText');
        
        if (!progressFill || !progressText) {
            return;
        }
        
        // 初始状态设置为0%
        progressFill.style.width = '0%';
        progressText.textContent = '开始分析... 0%';
        
        const progressSteps = [
            { progress: 8, text: '启动AI分析引擎...' },
            { progress: 18, text: '分析提示词结构...' },
            { progress: 32, text: '识别关键优化点...' },
            { progress: 45, text: '整合用户需求...' },
            { progress: 58, text: '生成优化策略...' },
            { progress: 72, text: '调整语言风格...' },
            { progress: 85, text: '精细化内容优化...' },
            { progress: 95, text: '最终质量检查...' }
        ];
        
        let stepIndex = 0;
        
        // 立即开始第一步
        setTimeout(() => {
            if (stepIndex < progressSteps.length && progressFill && progressText) {
                const step = progressSteps[stepIndex];
                
                progressFill.style.width = step.progress + '%';
                progressText.textContent = step.text + ' ' + step.progress + '%';
                
                stepIndex++;
            }
        }, 500);
        
        // 设置定时器继续后续步骤
        window.thinkingProgressInterval = setInterval(() => {
            const currentProgressFill = document.getElementById('thinkingProgressFill');
            const currentProgressText = document.getElementById('thinkingProgressText');
            
            if (!currentProgressFill || !currentProgressText) {
                clearInterval(window.thinkingProgressInterval);
                return;
            }
            
            if (stepIndex < progressSteps.length) {
                const step = progressSteps[stepIndex];
                
                currentProgressFill.style.width = step.progress + '%';
                currentProgressText.textContent = step.text + ' ' + step.progress + '%';
                
                stepIndex++;
            } else {
                // 在95%停留，显示即将完成状态
                currentProgressFill.style.width = '95%';
                currentProgressText.textContent = '即将完成... 95%';
            }
        }, 800);
        
    }, 400);
}

// 绑定思考模式模态弹窗事件（新版本）
function bindThinkingModalEvents(originalPrompt) {
    const generateBtn = document.getElementById('generateFinalPromptModalBtn');
    const skipBtn = document.getElementById('skipThinkingModalBtn');

    if (generateBtn) {
        generateBtn.onclick = async () => {
            // 立即显示加载状态，提供用户反馈
            showThinkingModalLoading();
            
            try {
                // 生成最终提示词
                await generateFinalPrompt(originalPrompt);
                
                // 隐藏加载状态并关闭模态弹窗
                hideThinkingModalLoading();
                closeThinkingModal();
                
            } catch (error) {
                console.error('生成最终提示词失败:', error);
                
                // 隐藏加载状态
                hideThinkingModalLoading();
                
                // 显示错误提示但不关闭模态弹窗，让用户可以重试
                showCustomAlert('生成失败，请检查网络连接或稍后重试', 'error', 3500);
            }
        };
    }

    if (skipBtn) {
        skipBtn.onclick = () => {
            // 跳过思考模式，直接生成最终提示词（不传递补充信息）
            generateFinalPromptWithoutInfo(originalPrompt);
            closeThinkingModal();
        };
    }

    // 绑定快速选择按钮事件
    bindQuickOptionEvents();
}

// 绑定思考模式模态弹窗关闭事件
function bindThinkingModalCloseEvents() {
    const thinkingModal = document.getElementById('thinkingModal');
    const closeBtn = document.getElementById('closeThinkingModal');
    const backdrop = thinkingModal?.querySelector('.thinking-modal-backdrop');

    // 点击关闭按钮
    if (closeBtn) {
        closeBtn.onclick = closeThinkingModal;
    }

    // 点击背景遮罩关闭
    if (backdrop) {
        backdrop.onclick = closeThinkingModal;
    }

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && thinkingModal && thinkingModal.style.display === 'block') {
            closeThinkingModal();
        }
    });
}

// 关闭思考模式模态弹窗
function closeThinkingModal() {
    const thinkingModal = document.getElementById('thinkingModal');
    if (thinkingModal) {
        thinkingModal.style.display = 'none';
        thinkingModal.classList.remove('show');
        // 恢复背景滚动
        document.body.style.overflow = '';
    }
}

// 绑定快速选择按钮事件
function bindQuickOptionEvents() {
    const quickOptionBtns = document.querySelectorAll('.quick-option-btn');
    quickOptionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const container = this.closest('.quick-options-container');
            const fieldIndex = container.dataset.fieldIndex;
            const textareaId = `thinking-field-${fieldIndex}`;
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                // 设置文本框值
                textarea.value = this.dataset.value;
                
                // 更新按钮选中状态
                container.querySelectorAll('.quick-option-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                
                // 触发输入事件以进行任何必要的验证
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });
}

// 绑定自定义信息相关事件
function bindCustomInfoEvents() {
    const addCustomInfoBtn = document.getElementById('addCustomInfoBtn');
    if (addCustomInfoBtn) {
        addCustomInfoBtn.onclick = addCustomInfoField;
    }
}

// 添加自定义信息字段
function addCustomInfoField() {
    const customInfoContainer = document.getElementById('customInfoContainer');
    if (!customInfoContainer) return;

    const fieldIndex = customInfoContainer.children.length;
    const customFieldDiv = document.createElement('div');
    customFieldDiv.className = 'custom-info-field';
    customFieldDiv.innerHTML = `
        <div class="custom-field-inputs">
            <input
                type="text"
                class="custom-field-key"
                placeholder="信息类型（如：目标用户、使用场景等）"
                data-index="${fieldIndex}"
                maxlength="20"
            />
            <textarea
                class="custom-field-value"
                placeholder="详细描述这个信息..."
                data-index="${fieldIndex}"
                rows="2"
            ></textarea>
        </div>
        <button type="button" class="remove-custom-field-btn" onclick="removeCustomInfoField(this)">
            <span class="remove-icon">✕</span>
        </button>
    `;

    customInfoContainer.appendChild(customFieldDiv);

    // 聚焦到新添加的字段
    const keyInput = customFieldDiv.querySelector('.custom-field-key');
    if (keyInput) {
        keyInput.focus();
    }
}

// 移除自定义信息字段
function removeCustomInfoField(button) {
    const fieldDiv = button.closest('.custom-info-field');
    if (fieldDiv) {
        fieldDiv.remove();
    }
}

// 生成最终提示词
async function generateFinalPrompt(originalPrompt) {
    const selectedModel = getSelectedModel();

    // 收集用户填写的信息
    const additionalInfo = {};

    // 收集AI生成的问题的回答
    const thinkingFields = document.querySelectorAll('.thinking-field-input');
    thinkingFields.forEach(field => {
        const key = field.dataset.key;
        const value = field.value.trim();
        if (value) {
            additionalInfo[key] = value;
        }
    });

    // 收集自定义补充信息
    const customFields = document.querySelectorAll('.custom-info-field');
    customFields.forEach(field => {
        const keyInput = field.querySelector('.custom-field-key');
        const valueInput = field.querySelector('.custom-field-value');

        if (keyInput && valueInput) {
            const key = keyInput.value.trim();
            const value = valueInput.value.trim();

            if (key && value) {
                additionalInfo[key] = value;
            }
        }
    });

    // 显示加载状态
    showLoading();

    try {
        // 第二阶段：基于补充信息优化提示词
        const optimizationData = await optimizeThinkingPrompt(originalPrompt, additionalInfo, selectedModel);

        // 隐藏加载状态
        hideLoading();
        
        // 如果是原页面表单模式，隐藏表单（模态弹窗模式下不需要隐藏）
        const thinkingFormSection = document.getElementById('thinkingFormSection');
        if (thinkingFormSection && thinkingFormSection.style.display !== 'none') {
            hideThinkingForm();
        }

        // 显示结果
        showResult(optimizationData.optimized_prompt, optimizationData.model_used);

        // 显示成功提示
        showCustomAlert('思考模式优化成功！', 'success', 2000);

    } catch (error) {
        console.error('思考模式优化失败:', error);
        hideLoading();
        showCustomAlert('优化失败，请检查网络连接或稍后重试', 'error', 3500);
    }
}

// 跳过思考模式，直接生成最终提示词（不传递补充信息）
async function generateFinalPromptWithoutInfo(originalPrompt) {
    const selectedModel = getSelectedModel();

    // 显示加载状态
    showLoading();

    try {
        // 第二阶段：基于空的补充信息优化提示词
        const optimizationData = await optimizeThinkingPrompt(originalPrompt, {}, selectedModel);

        // 隐藏加载状态
        hideLoading();
        
        // 如果是原页面表单模式，隐藏表单（模态弹窗模式下不需要隐藏）
        const thinkingFormSection = document.getElementById('thinkingFormSection');
        if (thinkingFormSection && thinkingFormSection.style.display !== 'none') {
            hideThinkingForm();
        }

        // 显示结果
        showResult(optimizationData.optimized_prompt, optimizationData.model_used);

        // 显示成功提示
        showCustomAlert('思考模式优化成功！', 'success', 2000);

    } catch (error) {
        console.error('思考模式优化失败:', error);
        hideLoading();
        showCustomAlert('思考模式优化失败，请稍后重试', 'error', 3500);
    }
}

// 隐藏思考模式表单
function hideThinkingForm() {
    const thinkingFormSection = document.getElementById('thinkingFormSection');
    if (thinkingFormSection) {
        thinkingFormSection.style.display = 'none';
    }
}

// 导出函数到全局作用域
window.updateCharCount = updateCharCount;
window.openModal = openModal;
window.closeModal = closeModal;
window.initPasswordToggles = initPasswordToggles;
window.handleThinkingMode = handleThinkingMode;
window.showThinkingForm = showThinkingForm;
window.bindThinkingModalEvents = bindThinkingModalEvents;
window.bindThinkingModalCloseEvents = bindThinkingModalCloseEvents;
window.closeThinkingModal = closeThinkingModal;
window.hideThinkingForm = hideThinkingForm;
window.addCustomInfoField = addCustomInfoField;
window.removeCustomInfoField = removeCustomInfoField;
window.findFieldOptions = findFieldOptions;
