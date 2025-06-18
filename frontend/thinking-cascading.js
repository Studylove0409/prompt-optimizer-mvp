// 思考模式级联问答管理器

class CascadingQuestionManager {
    constructor(originalPrompt, model) {
        this.originalPrompt = originalPrompt;
        this.model = model;
        this.conversationHistory = [];
        this.currentQuestion = null;
        this.isLoading = false;
        this.modal = null;
        this.elements = {};
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.modal = document.getElementById('thinkingCascadingModal');
        this.elements = {
            currentStep: document.getElementById('currentStep'),
            progressFill: document.getElementById('progressFill'),
            currentQuestion: document.getElementById('currentQuestion'),
            aiReasoning: document.getElementById('aiReasoning'),
            reasoningText: document.getElementById('reasoningText'),
            currentAnswer: document.getElementById('currentAnswer'),
            currentAnswerSelect: document.getElementById('currentAnswerSelect'),
            skipBtn: document.getElementById('skipBtn'),
            submitAnswerBtn: document.getElementById('submitAnswerBtn'),
            finalizeBtn: document.getElementById('finalizeBtn'),
            answeredSummary: document.getElementById('answeredSummary'),
            summaryContent: document.getElementById('summaryContent'),
            summaryToggle: document.getElementById('summaryToggle'),
            closeBtn: document.getElementById('closeThinkingModal')
        };
    }
    
    bindEvents() {
        // 提交答案
        this.elements.submitAnswerBtn.addEventListener('click', () => {
            this.submitCurrentAnswer();
        });
        
        // 跳过问题
        this.elements.skipBtn.addEventListener('click', () => {
            this.skipCurrentQuestion();
        });
        
        // 完成优化
        this.elements.finalizeBtn.addEventListener('click', () => {
            this.finalizeOptimization();
        });
        
        // 关闭弹框
        this.elements.closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('thinking-cascading-backdrop')) {
                this.closeModal();
            }
        });
        
        // 摘要切换
        this.elements.summaryToggle.addEventListener('click', () => {
            this.toggleSummary();
        });
        
        // 回车键提交
        this.elements.currentAnswer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitCurrentAnswer();
            }
        });
        
        // 选择框变化
        this.elements.currentAnswerSelect.addEventListener('change', () => {
            // 自动提交选择题答案
            setTimeout(() => this.submitCurrentAnswer(), 300);
        });
    }
    
    async start() {
        this.showModal();
        await this.getNextQuestion();
    }
    
    showModal() {
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // 清理状态
        this.conversationHistory = [];
        this.currentQuestion = null;
        this.isLoading = false;
    }
    
    async getNextQuestion() {
        if (this.isLoading) return;
        
        this.setLoading(true);
        
        try {
            const response = await this.getNextQuestion_API();
            
            this.setLoading(false);
            
            if (response.has_next_question) {
                this.currentQuestion = response.question;
                this.displayQuestion(response.question, response.reasoning);
                this.updateProgress(response.progress);
                this.updateActionButtons(response.can_finalize);
            } else {
                // 没有更多问题，直接完成优化
                await this.finalizeOptimization();
            }
            
        } catch (error) {
            this.setLoading(false);
            console.error('获取下一个问题失败:', error);
            this.showError('获取问题失败，请稍后重试');
        }
    }
    
    displayQuestion(questionData, reasoning) {
        // 添加问题切换动画
        this.elements.currentQuestion.parentElement.classList.add('changing');
        
        setTimeout(() => {
            // 更新问题文本
            this.elements.currentQuestion.textContent = questionData.question;
            
            // 显示AI推理（如果有）
            if (reasoning) {
                this.elements.reasoningText.textContent = reasoning;
                this.elements.aiReasoning.style.display = 'block';
            } else {
                this.elements.aiReasoning.style.display = 'none';
            }
            
            // 根据问题类型显示相应的输入控件
            this.setupInputControl(questionData);
            
            // 移除动画类
            this.elements.currentQuestion.parentElement.classList.remove('changing');
        }, 250);
    }
    
    setupInputControl(questionData) {
        if (questionData.type === 'select') {
            // 显示选择框
            this.elements.currentAnswer.style.display = 'none';
            this.elements.currentAnswerSelect.style.display = 'block';
            
            // 清空并填充选项
            this.elements.currentAnswerSelect.innerHTML = '<option value="">请选择...</option>';
            questionData.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                this.elements.currentAnswerSelect.appendChild(optionElement);
            });
            
            this.elements.currentAnswerSelect.focus();
        } else {
            // 显示文本输入框
            this.elements.currentAnswer.style.display = 'block';
            this.elements.currentAnswerSelect.style.display = 'none';
            
            this.elements.currentAnswer.placeholder = questionData.placeholder || '请输入你的回答...';
            this.elements.currentAnswer.value = '';
            this.elements.currentAnswer.focus();
        }
    }
    
    updateProgress(progress) {
        this.elements.currentStep.textContent = progress.current;
        const percentage = (progress.current / progress.estimated_total) * 100;
        this.elements.progressFill.style.width = `${Math.min(percentage, 100)}%`;
    }
    
    updateActionButtons(canFinalize) {
        if (canFinalize && this.conversationHistory.length >= 2) {
            this.elements.finalizeBtn.style.display = 'block';
        } else {
            this.elements.finalizeBtn.style.display = 'none';
        }
    }
    
    async submitCurrentAnswer() {
        if (this.isLoading || !this.currentQuestion) return;
        
        const answer = this.getCurrentAnswer();
        if (!answer.trim()) {
            this.showError('请先回答当前问题');
            return;
        }
        
        // 添加到对话历史
        this.conversationHistory.push({
            question: this.currentQuestion.question,
            answer: answer,
            importance: this.currentQuestion.importance
        });
        
        // 清空输入
        this.clearCurrentInput();
        
        // 更新摘要
        this.updateSummary();
        
        // 获取下一个问题
        await this.getNextQuestion();
    }
    
    async skipCurrentQuestion() {
        if (this.isLoading || !this.currentQuestion) return;
        
        // 添加跳过记录到对话历史
        this.conversationHistory.push({
            question: this.currentQuestion.question,
            answer: '(已跳过)',
            importance: this.currentQuestion.importance
        });
        
        // 更新摘要
        this.updateSummary();
        
        // 获取下一个问题
        await this.getNextQuestion();
    }
    
    getCurrentAnswer() {
        if (this.elements.currentAnswerSelect.style.display !== 'none') {
            return this.elements.currentAnswerSelect.value;
        } else {
            return this.elements.currentAnswer.value;
        }
    }
    
    clearCurrentInput() {
        this.elements.currentAnswer.value = '';
        this.elements.currentAnswerSelect.value = '';
    }
    
    updateSummary() {
        if (this.conversationHistory.length === 0) {
            this.elements.answeredSummary.style.display = 'none';
            return;
        }
        
        this.elements.answeredSummary.style.display = 'block';
        
        const summaryHTML = this.conversationHistory.map(item => `
            <div class="summary-item">
                <div class="summary-question">${item.question}</div>
                <div class="summary-answer">${item.answer}</div>
            </div>
        `).join('');
        
        this.elements.summaryContent.innerHTML = summaryHTML;
    }
    
    toggleSummary() {
        const content = this.elements.summaryContent;
        const toggle = this.elements.summaryToggle;
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
        } else {
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
        }
    }
    
    async finalizeOptimization() {
        if (this.isLoading) return;
        
        if (this.conversationHistory.length === 0) {
            this.showError('请至少回答一个问题');
            return;
        }
        
        this.setLoading(true, '正在生成优化结果...');
        
        try {
            const response = await this.finalizeOptimization_API();
            
            this.setLoading(false);
            
            // 关闭弹框
            this.closeModal();
            
            // 显示结果
            if (window.showResult) {
                window.showResult(response.optimized_prompt, response.model_used);
            }
            
            // 显示成功提示
            if (window.showCustomAlert) {
                window.showCustomAlert('优化完成！', 'success', 2000);
            }
            
        } catch (error) {
            this.setLoading(false);
            console.error('完成优化失败:', error);
            this.showError('优化失败，请稍后重试');
        }
    }
    
    setLoading(isLoading, message = '') {
        this.isLoading = isLoading;
        
        const submitBtn = this.elements.submitAnswerBtn;
        const finalizeBtn = this.elements.finalizeBtn;
        
        if (isLoading) {
            // 显示加载状态
            submitBtn.disabled = true;
            finalizeBtn.disabled = true;
            
            // 显示加载动画
            const loadingElements = [
                submitBtn.querySelector('.btn-loading'),
                finalizeBtn.querySelector('.btn-loading')
            ];
            
            loadingElements.forEach(el => {
                if (el) el.style.display = 'block';
            });
            
            // 更新按钮文本
            if (message) {
                const submitSpan = submitBtn.querySelector('span');
                const finalizeSpan = finalizeBtn.querySelector('span');
                if (submitSpan) submitSpan.textContent = message;
                if (finalizeSpan) finalizeSpan.textContent = message;
            }
        } else {
            // 恢复正常状态
            submitBtn.disabled = false;
            finalizeBtn.disabled = false;
            
            // 隐藏加载动画
            const loadingElements = [
                submitBtn.querySelector('.btn-loading'),
                finalizeBtn.querySelector('.btn-loading')
            ];
            
            loadingElements.forEach(el => {
                if (el) el.style.display = 'none';
            });
            
            // 恢复按钮文本
            const submitSpan = submitBtn.querySelector('span');
            const finalizeSpan = finalizeBtn.querySelector('span');
            if (submitSpan) submitSpan.textContent = '提交回答';
            if (finalizeSpan) finalizeSpan.textContent = '完成并优化';
        }
    }
    
    showError(message) {
        if (window.showCustomAlert) {
            window.showCustomAlert(message, 'error', 3000);
        } else {
            alert(message);
        }
    }
    
    async getNextQuestion_API() {
        // 优先使用新的API函数
        if (window.getNextCascadingQuestion) {
            return await window.getNextCascadingQuestion(
                this.originalPrompt,
                this.conversationHistory,
                this.model
            );
        }
        
        // 备用方案
        return await this.callAPI('/thinking/next-question', {
            original_prompt: this.originalPrompt,
            conversation_history: this.conversationHistory,
            model: this.model
        });
    }
    
    async finalizeOptimization_API() {
        // 优先使用新的API函数
        if (window.finalizeCascadingOptimization) {
            return await window.finalizeCascadingOptimization(
                this.originalPrompt,
                this.conversationHistory,
                this.model
            );
        }
        
        // 备用方案
        return await this.callAPI('/thinking/finalize', {
            original_prompt: this.originalPrompt,
            conversation_history: this.conversationHistory,
            model: this.model
        });
    }
    
    async callAPI(endpoint, data) {
        // 使用现有的通用API调用函数
        if (window.apiCall) {
            return await window.apiCall(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
        
        // 备用方案：如果通用API函数不可用，使用直接调用
        const API_BASE_URL = (() => {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const isFileProtocol = window.location.protocol === 'file:';
            
            if (isLocalhost || isFileProtocol) {
                return 'http://localhost:8000/api';
            } else {
                return '/api';
            }
        })();
        
        // 获取认证令牌
        const getAuthToken = async () => {
            if (!window.supabaseClient) {
                return null;
            }
            
            try {
                const { data: { session }, error } = await window.supabaseClient.auth.getSession();
                if (error || !session) {
                    return null;
                }
                return session.access_token;
            } catch (error) {
                console.error('获取认证令牌失败:', error);
                return null;
            }
        };
        
        const token = await getAuthToken();
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API错误: ${response.status}`);
        }
        
        return await response.json();
    }
}

// 新的思考模式处理函数
async function handleThinkingModeV2() {
    const originalPromptTextarea = document.getElementById('originalPrompt');
    const originalPrompt = originalPromptTextarea.value.trim();
    const selectedModel = getSelectedModel();

    if (!originalPrompt) {
        showCustomAlert('请输入要优化的提示词', 'warning', 3000);
        return;
    }

    // 创建级联问题管理器并开始
    const manager = new CascadingQuestionManager(originalPrompt, selectedModel);
    await manager.start();
}

// 导出到全局作用域
window.CascadingQuestionManager = CascadingQuestionManager;
window.handleThinkingModeV2 = handleThinkingModeV2;