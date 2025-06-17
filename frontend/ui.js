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
    "期望收益": ["1-3个月见效", "3-6个月见效", "6-12个月见效", "1年以上长期", "快速回本", "稳定增长", "高收益高风险", "保本微利"]
};

// 显示思考模式动态表单
function showThinkingForm(analysisResult, originalPrompt) {
    console.log('🎯 showThinkingForm called with analysisResult:', analysisResult);
    console.log('🎯 Quick options enabled version - v2.0');
    
    const thinkingFormSection = document.getElementById('thinkingFormSection');
    const thinkingFormContent = document.getElementById('thinkingFormContent');

    if (!thinkingFormSection || !thinkingFormContent) {
        console.error('找不到思考模式表单元素');
        return;
    }

    // 清空之前的内容
    thinkingFormContent.innerHTML = '';

    // 生成动态表单字段
    analysisResult.forEach((item, index) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'thinking-field';

        // 检查是否有预设选项
        const hasOptions = fieldOptions[item.key];
        console.log(`🔍 Field "${item.key}" hasOptions:`, hasOptions);
        
        if (hasOptions) {
            console.log(`✅ 为字段 "${item.key}" 生成快速选择按钮`);
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
        } else {
            // 生成普通文本输入
            fieldDiv.innerHTML = `
                <label class="thinking-field-label" for="thinking-field-${index}">
                    ${item.key}
                </label>
                <textarea
                    class="thinking-field-input"
                    id="thinking-field-${index}"
                    placeholder="${item.question}"
                    data-key="${item.key}"
                    rows="2"
                ></textarea>
            `;
        }

        thinkingFormContent.appendChild(fieldDiv);
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

    thinkingFormContent.appendChild(customInfoSection);

    // 显示表单区域
    thinkingFormSection.style.display = 'block';

    // 滚动到表单区域
    thinkingFormSection.scrollIntoView({ behavior: 'smooth' });

    // 绑定按钮事件
    bindThinkingFormEvents(originalPrompt);

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

// 绑定思考模式表单事件
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

        // 隐藏加载状态和表单
        hideLoading();
        hideThinkingForm();

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

        // 隐藏加载状态和表单
        hideLoading();
        hideThinkingForm();

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
window.hideThinkingForm = hideThinkingForm;
window.addCustomInfoField = addCustomInfoField;
window.removeCustomInfoField = removeCustomInfoField;
