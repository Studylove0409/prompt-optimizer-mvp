/**
 * 智能访谈模块 - 思考专家模式
 */

class ExpertInterviewManager {
    constructor() {
        this.currentStage = 1;
        this.originalIdea = '';
        this.analysisData = null;
        this.userAnswers = {};
        this.isProcessing = false;

        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        console.log('开始初始化专家访谈DOM元素...');
        
        // 主要容器
        this.expertSection = document.getElementById('expertInterviewSection');
        
        // 阶段元素
        this.analysisStage = document.getElementById('analysisStage');
        this.interviewStage = document.getElementById('interviewStage');
        this.synthesisStage = document.getElementById('synthesisStage');
        
        // 状态元素
        this.analysisStatus = document.getElementById('analysisStatus');
        this.interviewStatus = document.getElementById('interviewStatus');
        this.synthesisStatus = document.getElementById('synthesisStatus');
        
        // 内容元素
        this.analysisResult = document.getElementById('analysisResult');
        this.interviewForm = document.getElementById('interviewForm');
        this.synthesisResult = document.getElementById('synthesisResult');
        
        // 按钮元素
        this.interviewBackBtn = document.getElementById('interviewBackBtn');
        this.interviewSubmitBtn = document.getElementById('interviewSubmitBtn');
        this.expertCopyBtn = document.getElementById('expertCopyBtn');
        this.expertRestartBtn = document.getElementById('expertRestartBtn');
        
        // 进度元素
        this.progressFill = document.getElementById('interviewProgressFill');
        this.progressSteps = document.querySelectorAll('.progress-step');
        
        // 结果元素
        this.expertOptimizedPrompt = document.getElementById('expertOptimizedPrompt');
        
        // 检查关键元素是否存在
        const missingElements = [];
        if (!this.expertSection) {
            missingElements.push('expertInterviewSection');
        }
        if (!this.analysisStage) {
            missingElements.push('analysisStage');
        }
        if (!this.interviewForm) {
            missingElements.push('interviewForm');
        }
        if (!this.analysisStatus) {
            missingElements.push('analysisStatus');
        }
        if (!this.interviewStatus) {
            missingElements.push('interviewStatus');
        }
        if (!this.synthesisStatus) {
            missingElements.push('synthesisStatus');
        }
        
        if (missingElements.length > 0) {
            console.error('缺失的DOM元素:', missingElements);
            throw new Error(`缺失专家访谈必要的DOM元素: ${missingElements.join(', ')}`);
        }
        
        console.log('✅ 专家访谈DOM元素初始化完成');
    }

    bindEvents() {
        // 返回修改按钮
        if (this.interviewBackBtn) {
            this.interviewBackBtn.addEventListener('click', () => this.goBackToInput());
        }

        // 提交访谈按钮
        if (this.interviewSubmitBtn) {
            this.interviewSubmitBtn.addEventListener('click', () => this.submitInterview());
        }

        // 复制结果按钮
        if (this.expertCopyBtn) {
            this.expertCopyBtn.addEventListener('click', () => this.copyResult());
        }

        // 重新开始按钮
        if (this.expertRestartBtn) {
            this.expertRestartBtn.addEventListener('click', () => this.restart());
        }
    }

    // 开始智能访谈流程
    async startInterview(originalPrompt) {
        console.log('开始智能访谈流程:', originalPrompt);
        
        if (this.isProcessing) {
            console.log('正在处理中，跳过重复调用');
            return;
        }

        if (!originalPrompt || originalPrompt.trim() === '') {
            console.error('原始提示词为空');
            showCustomAlert('请先输入您的想法', 'warning');
            return;
        }

        this.originalIdea = originalPrompt;
        this.isProcessing = true;

        try {
            // 显示专家模式界面
            this.showExpertSection();
            
            // 开始第一阶段：需求分析
            await this.startAnalysisPhase();
        } catch (error) {
            console.error('启动智能访谈失败:', error);
            this.isProcessing = false;
            showCustomAlert('启动智能访谈失败，请重试', 'error');
        }
    }

    // 显示专家模式界面
    showExpertSection() {
        // 隐藏普通输出区域
        const outputSection = document.getElementById('outputSection');
        if (outputSection) {
            outputSection.style.display = 'none';
        }

        // 显示专家访谈区域
        this.expertSection.style.display = 'block';
        this.currentStage = 1;
        this.updateProgress();

        // 滚动到专家区域
        this.expertSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // 第一阶段：需求分析
    async startAnalysisPhase() {
        this.analysisStage.classList.add('active');
        this.analysisStatus.textContent = '正在分析您的想法...';

        try {
            // 调用分析器API
            const analysisData = await this.callAnalyzerAPI(this.originalIdea);
            
            // 显示分析结果
            this.displayAnalysisResult(analysisData);
            
            // 进入第二阶段
            setTimeout(() => {
                this.startInterviewPhase(analysisData);
            }, 1500);

        } catch (error) {
            console.error('分析阶段失败:', error);
            this.analysisStatus.textContent = '分析失败，请重试';
            this.isProcessing = false;
        }
    }

    // 调用分析器API
    async callAnalyzerAPI(originalPrompt) {
        const requestBody = {
            original_idea: originalPrompt,
            model: 'gemini-2.0-flash'
        };

        const API_BASE_URL = window.location.protocol === 'file:'
            ? 'http://localhost:8000/api'
            : '/api';

        // 获取认证令牌
        const token = window.getAuthToken ? await window.getAuthToken() : null;
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        console.log('调用分析器API:', `${API_BASE_URL}/analyze`);
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }

    // 显示分析结果
    displayAnalysisResult(analysisData) {
        this.analysisData = analysisData;
        this.analysisStatus.textContent = '分析完成';
        
        const summaryElement = this.analysisResult.querySelector('.analysis-summary');
        if (summaryElement) {
            summaryElement.textContent = analysisData.summary || '已识别出关键问题点，准备进入访谈阶段。';
        }
        
        this.analysisResult.style.display = 'block';
    }

    // 第二阶段：智能访谈
    startInterviewPhase(analysisData) {
        this.currentStage = 2;
        this.updateProgress();
        
        this.analysisStage.classList.remove('active');
        this.interviewStage.style.display = 'block';
        this.interviewStage.classList.add('active');
        
        this.interviewStatus.textContent = `请回答以下 ${analysisData.questions.length} 个问题以完善您的想法`;
        
        // 生成动态表单
        this.generateInterviewForm(analysisData.questions);
    }

    // 生成动态访谈表单
    generateInterviewForm(questions) {
        this.interviewForm.innerHTML = '';
        
        questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'interview-question';
            questionDiv.style.animationDelay = `${index * 0.1}s`;
            
            const isTextarea = question.type === 'textarea' || !question.type;
            const inputElement = isTextarea ? 'textarea' : 'input';
            const inputType = isTextarea ? '' : `type="${question.type || 'text'}"`;
            
            questionDiv.innerHTML = `
                <label class="question-label" for="question_${question.key}">
                    ${question.question}
                    ${question.required ? '<span style="color: #ff4500;">*</span>' : ''}
                </label>
                <${inputElement} 
                    id="question_${question.key}" 
                    name="${question.key}"
                    class="question-input"
                    ${inputType}
                    placeholder="${question.placeholder || '请输入...'}"
                    ${question.required ? 'required' : ''}
                ></${inputElement}>
            `;
            
            this.interviewForm.appendChild(questionDiv);
            
            // 添加入场动画
            setTimeout(() => {
                questionDiv.style.opacity = '0';
                questionDiv.style.transform = 'translateY(20px)';
                questionDiv.style.transition = 'all 0.4s ease';
                
                setTimeout(() => {
                    questionDiv.style.opacity = '1';
                    questionDiv.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100);
        });
    }

    // 返回修改输入
    goBackToInput() {
        this.restart();
        
        // 回到输入区域
        const inputSection = document.querySelector('.input-section');
        if (inputSection) {
            inputSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // 提交访谈表单
    async submitInterview() {
        if (this.isProcessing) return;

        // 收集用户答案
        const formData = new FormData();
        const inputs = this.interviewForm.querySelectorAll('.question-input');
        
        let hasRequiredEmpty = false;
        inputs.forEach(input => {
            const value = input.value.trim();
            if (input.required && !value) {
                hasRequiredEmpty = true;
                input.style.borderColor = '#ff4500';
                input.focus();
                return;
            }
            input.style.borderColor = '';
            this.userAnswers[input.name] = value;
        });

        if (hasRequiredEmpty) {
            showCustomAlert('请填写所有必填项', 'warning');
            return;
        }

        this.isProcessing = true;
        this.interviewSubmitBtn.disabled = true;
        this.interviewSubmitBtn.textContent = '处理中...';

        // 进入第三阶段
        await this.startSynthesisPhase();
    }

    // 第三阶段：提示词合成
    async startSynthesisPhase() {
        this.currentStage = 3;
        this.updateProgress();
        
        this.interviewStage.classList.remove('active');
        this.synthesisStage.style.display = 'block';
        this.synthesisStage.classList.add('active');
        
        this.synthesisStatus.textContent = '正在合成专业提示词...';

        try {
            // 调用合成器API
            const finalPrompt = await this.callSynthesizerAPI();
            
            // 显示最终结果
            this.displayFinalResult(finalPrompt);

        } catch (error) {
            console.error('合成阶段失败:', error);
            this.synthesisStatus.textContent = '合成失败，请重试';
        } finally {
            this.isProcessing = false;
            this.interviewSubmitBtn.disabled = false;
            this.interviewSubmitBtn.textContent = '提交并生成';
        }
    }

    // 调用合成器API
    async callSynthesizerAPI() {
        const requestBody = {
            original_idea: this.originalIdea,
            user_answers: this.userAnswers,
            model: 'gemini-2.0-flash'
        };

        const API_BASE_URL = window.location.protocol === 'file:'
            ? 'http://localhost:8000/api'
            : '/api';

        // 获取认证令牌
        const token = window.getAuthToken ? await window.getAuthToken() : null;
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        console.log('调用合成器API:', `${API_BASE_URL}/synthesize`);
        const response = await fetch(`${API_BASE_URL}/synthesize`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.optimized_prompt;
    }

    // 显示最终结果
    displayFinalResult(finalPrompt) {
        this.synthesisStatus.textContent = '合成完成';
        this.expertOptimizedPrompt.textContent = finalPrompt;
        this.synthesisResult.style.display = 'block';

        // 显示成功提示
        showCustomAlert('专家级提示词生成成功！', 'success');
    }

    // 复制结果
    async copyResult() {
        const text = this.expertOptimizedPrompt.textContent;
        const success = await copyTextToClipboard(text);
        
        if (success) {
            // 更新按钮状态
            const originalText = this.expertCopyBtn.querySelector('.button-text').textContent;
            this.expertCopyBtn.querySelector('.button-text').textContent = '已复制!';
            this.expertCopyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            
            showCustomAlert('专家提示词已复制到剪贴板', 'success');
            
            setTimeout(() => {
                this.expertCopyBtn.querySelector('.button-text').textContent = originalText;
                this.expertCopyBtn.style.background = '';
            }, 2000);
        } else {
            showCustomAlert('复制失败，请手动选择文本复制', 'error');
        }
    }

    // 重新开始
    restart() {
        this.currentStage = 1;
        this.originalIdea = '';
        this.analysisData = null;
        this.userAnswers = {};
        this.isProcessing = false;

        // 隐藏专家区域
        this.expertSection.style.display = 'none';
        
        // 重置所有阶段
        this.analysisStage.classList.remove('active');
        this.interviewStage.style.display = 'none';
        this.interviewStage.classList.remove('active');
        this.synthesisStage.style.display = 'none';
        this.synthesisStage.classList.remove('active');
        
        // 重置内容
        this.analysisResult.style.display = 'none';
        this.synthesisResult.style.display = 'none';
        this.interviewForm.innerHTML = '';
        
        // 重置按钮状态
        this.interviewSubmitBtn.disabled = false;
        this.interviewSubmitBtn.textContent = '提交并生成';
        
        this.updateProgress();
    }

    // 更新进度
    updateProgress() {
        const progressPercent = (this.currentStage / 3) * 100;
        this.progressFill.style.width = `${progressPercent}%`;
        
        this.progressSteps.forEach((step, index) => {
            if (index < this.currentStage) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
}

// 初始化专家访谈管理器
let expertInterviewManager;

// 等待DOM加载完成后初始化
function initializeExpertInterview() {
    console.log('准备初始化专家访谈管理器...');
    console.log('Document readyState:', document.readyState);
    
    if (document.readyState === 'loading') {
        console.log('DOM还在加载中，等待DOMContentLoaded事件...');
        document.addEventListener('DOMContentLoaded', initializeExpertInterview);
        return;
    }

    try {
        console.log('开始创建ExpertInterviewManager实例...');
        expertInterviewManager = new ExpertInterviewManager();
        window.expertInterviewManager = expertInterviewManager;
        
        console.log('✅ 专家访谈管理器初始化成功');
        console.log('window.expertInterviewManager:', typeof window.expertInterviewManager);
    } catch (error) {
        console.error('❌ 专家访谈管理器初始化失败:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 多重初始化策略
function ensureExpertInterviewInitialized() {
    console.log('检查专家访谈管理器初始化状态...');
    console.log('window.expertInterviewManager存在:', !!window.expertInterviewManager);
    
    if (!window.expertInterviewManager) {
        console.log('专家访谈管理器未初始化，尝试重新初始化...');
        try {
            initializeExpertInterview();
            if (window.expertInterviewManager) {
                console.log('✅ 重新初始化成功');
            } else {
                console.log('❌ 重新初始化失败');
            }
        } catch (error) {
            console.error('重新初始化时发生错误:', error);
        }
    } else {
        console.log('✅ 专家访谈管理器已存在');
    }
    return !!window.expertInterviewManager;
}

// 强制重新初始化函数（用于调试）
function forceReinitializeExpertInterview() {
    console.log('强制重新初始化专家访谈管理器...');
    window.expertInterviewManager = null;
    expertInterviewManager = null;
    
    try {
        initializeExpertInterview();
        console.log('强制重新初始化结果:', !!window.expertInterviewManager);
    } catch (error) {
        console.error('强制重新初始化失败:', error);
    }
    
    return !!window.expertInterviewManager;
}

// 开始初始化
initializeExpertInterview();

// DOM加载完成后再次检查
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded 事件触发，检查专家访谈管理器状态...');
    if (!window.expertInterviewManager) {
        console.log('DOMContentLoaded时专家访谈管理器仍未初始化，重试...');
        setTimeout(initializeExpertInterview, 100);
    }
});

// 页面完全加载后最后一次检查
window.addEventListener('load', () => {
    console.log('Window load 事件触发，最终检查专家访谈管理器状态...');
    if (!window.expertInterviewManager) {
        console.log('页面加载完成时专家访谈管理器仍未初始化，最后重试...');
        setTimeout(initializeExpertInterview, 500);
    }
});

// 导出到全局作用域
window.ExpertInterviewManager = ExpertInterviewManager;
window.ensureExpertInterviewInitialized = ensureExpertInterviewInitialized;
window.initializeExpertInterview = initializeExpertInterview;
window.forceReinitializeExpertInterview = forceReinitializeExpertInterview;