// 快速回答功能模块

// 快速回答模块初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeQuickAnswer();
});

function initializeQuickAnswer() {
    console.log('初始化快速回答功能...');
    
    // 获取按钮元素
    const quickAnswerBtn = document.getElementById('quickAnswerBtn');
    const modal = document.getElementById('quickAnswerModal');
    const closeBtn = document.getElementById('closeQuickAnswerModal');
    const closeBtn2 = document.getElementById('closeAnswerModalBtn');
    const downloadAnswerBtn = document.getElementById('downloadAnswerBtn');
    const copyAnswerBtn = document.getElementById('copyAnswerBtn');
    const regenerateBtn = document.getElementById('regenerateAnswerBtn');
    
    // 绑定事件监听器
    if (quickAnswerBtn) {
        quickAnswerBtn.addEventListener('click', handleQuickAnswerClick);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeQuickAnswerModal);
    }
    
    if (closeBtn2) {
        closeBtn2.addEventListener('click', closeQuickAnswerModal);
    }
    
    if (downloadAnswerBtn) {
        downloadAnswerBtn.addEventListener('click', downloadQuickAnswer);
    }
    
    if (copyAnswerBtn) {
        copyAnswerBtn.addEventListener('click', copyQuickAnswer);
    }
    
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', regenerateQuickAnswer);
    }
    
    // 点击背景关闭弹框
    if (modal) {
        const backdrop = modal.querySelector('.quick-answer-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeQuickAnswerModal);
        }
    }
    
    // ESC键关闭弹框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            closeQuickAnswerModal();
        }
    });
}

// 处理快速回答按钮点击
async function handleQuickAnswerClick() {
    console.log('快速回答按钮被点击');
    
    // 获取优化后的提示词
    const optimizedPromptDiv = document.getElementById('optimizedPrompt');
    if (!optimizedPromptDiv || !optimizedPromptDiv.textContent.trim()) {
        showCustomAlert('请先优化提示词后再使用快速回答功能', 'warning', 3000);
        return;
    }
    
    const optimizedPrompt = optimizedPromptDiv.textContent.trim();
    
    // 显示弹框
    showQuickAnswerModal();
    
    // 开始生成回答
    await generateQuickAnswer(optimizedPrompt);
}

// 显示快速回答弹框
function showQuickAnswerModal() {
    const modal = document.getElementById('quickAnswerModal');
    if (!modal) return;
    
    // 重置弹框状态
    resetModalState();
    
    // 显示弹框
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
        
        // 弹框显示完成
    }, 10);
    
    // 禁用页面滚动
    document.body.style.overflow = 'hidden';
}


// 关闭快速回答弹框
function closeQuickAnswerModal() {
    const modal = document.getElementById('quickAnswerModal');
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    // 恢复页面滚动
    document.body.style.overflow = '';
}

// 重置弹框状态
function resetModalState() {
    
    // 隐藏所有区域
    const thinkingProcessSection = document.getElementById('thinkingProcessSection');
    const finalAnswerSection = document.getElementById('finalAnswerSection');
    const errorSection = document.getElementById('quickAnswerError');
    const downloadBtn = document.getElementById('downloadAnswerBtn');
    const copyBtn = document.getElementById('copyAnswerBtn');
    const regenerateBtn = document.getElementById('regenerateAnswerBtn');
    
    if (thinkingProcessSection) thinkingProcessSection.style.display = 'block';
    if (finalAnswerSection) finalAnswerSection.style.display = 'none';
    if (errorSection) errorSection.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';
    if (copyBtn) copyBtn.style.display = 'none';
    if (regenerateBtn) regenerateBtn.style.display = 'none';
    
    // 重置思维过程内容
    const thinkingLoading = document.getElementById('thinkingLoading');
    const thinkingText = document.getElementById('thinkingText');
    const finalAnswerContent = document.getElementById('finalAnswerContent');
    
    if (thinkingLoading) thinkingLoading.style.display = 'flex';
    if (thinkingText) {
        thinkingText.style.display = 'none';
        thinkingText.textContent = '';
    }
    if (finalAnswerContent) {
        finalAnswerContent.innerHTML = '';
    }
    
    // 重置进度条
    resetProgressBar();
    
    // 启动模拟进度
    startSimulatedProgress();
}

// 进度条管理
let progressInterval = null;
let currentProgress = 0;

// 进度阶段和对应消息
const progressStages = [
    { progress: 15, message: "🤔 AI正在理解您的问题..." },
    { progress: 30, message: "🧠 分析问题的关键要点..." },
    { progress: 45, message: "📚 检索相关知识和信息..." },
    { progress: 60, message: "💡 构思最佳解决方案..." },
    { progress: 75, message: "✍️ 整理回答内容..." },
    { progress: 90, message: "🔍 完善答案细节..." }
];

// 重置进度条
function resetProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const thinkingMessage = document.getElementById('thinkingMessage');
    
    currentProgress = 0;
    
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    if (progressText) {
        progressText.textContent = '0%';
    }
    if (thinkingMessage) {
        thinkingMessage.textContent = 'AI正在深度思考中...';
    }
    
    // 清除之前的定时器
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// 启动模拟进度
function startSimulatedProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const thinkingMessage = document.getElementById('thinkingMessage');
    
    if (!progressBar || !progressText || !thinkingMessage) return;
    
    let stageIndex = 0;
    
    // 每500ms增加一点进度
    progressInterval = setInterval(() => {
        // 随机增加1-3的进度
        const increment = Math.random() * 2 + 1;
        currentProgress = Math.min(currentProgress + increment, 92); // 最多到92%，留给完成时跳到100%
        
        // 更新进度条
        progressBar.style.width = currentProgress + '%';
        progressText.textContent = Math.round(currentProgress) + '%';
        
        // 检查是否到达新阶段
        if (stageIndex < progressStages.length && currentProgress >= progressStages[stageIndex].progress) {
            thinkingMessage.textContent = progressStages[stageIndex].message;
            stageIndex++;
        }
        
        // 如果接近92%，减慢速度
        if (currentProgress >= 88) {
            clearInterval(progressInterval);
            // 以更慢的速度继续
            progressInterval = setInterval(() => {
                currentProgress = Math.min(currentProgress + 0.5, 92);
                progressBar.style.width = currentProgress + '%';
                progressText.textContent = Math.round(currentProgress) + '%';
            }, 1000);
        }
    }, 500);
}

// 完成进度（跳到100%）
function completeProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const thinkingMessage = document.getElementById('thinkingMessage');
    
    // 停止模拟进度
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    // 直接跳到100%
    if (progressBar) {
        progressBar.style.width = '100%';
    }
    if (progressText) {
        progressText.textContent = '100%';
    }
    if (thinkingMessage) {
        thinkingMessage.textContent = '✅ 生成完成！';
    }
    
    currentProgress = 100;
}

// 生成快速回答
async function generateQuickAnswer(prompt) {
    try {
        console.log('开始生成快速回答:', prompt);
        
        // 调用API生成回答
        const response = await generateQuickAnswerAPI(prompt, 'deepseek-v4-flash');
        
        if (response && response.success) {
            // 完成进度条（跳到100%）
            completeProgress();
            
            // 等待一下让用户看到100%
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // 显示思维过程
            await displayThinkingProcess(response.thinking_process);
            
            // 显示最终答案
            await displayFinalAnswer(response.final_answer);
            
            // 显示操作按钮
            showActionButtons();
            
            // 存储当前回答数据
            window.currentQuickAnswer = {
                prompt: prompt,
                thinking_process: response.thinking_process,
                final_answer: response.final_answer,
                model_used: response.model_used
            };
            
        } else {
            throw new Error(response?.message || '快速回答生成失败');
        }
        
    } catch (error) {
        console.error('快速回答生成失败:', error);
        // 停止进度条
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        showQuickAnswerError(error.message || '快速回答生成失败，请稍后重试');
    }
}

// 显示思维过程
async function displayThinkingProcess(thinkingProcess) {
    const thinkingLoading = document.getElementById('thinkingLoading');
    const thinkingText = document.getElementById('thinkingText');
    
    if (!thinkingText) return;
    
    // 隐藏加载状态（包括进度条）
    if (thinkingLoading) {
        thinkingLoading.style.display = 'none';
    }
    
    // 显示思维文本区域
    thinkingText.style.display = 'block';
    
    // 直接显示完成状态，无需逐字效果
    thinkingText.textContent = thinkingProcess;
    
    // 短暂延迟后继续到下一步
    await new Promise(resolve => setTimeout(resolve, 500));
}

// 显示最终答案
async function displayFinalAnswer(finalAnswer) {
    const finalAnswerSection = document.getElementById('finalAnswerSection');
    const finalAnswerContent = document.getElementById('finalAnswerContent');
    
    if (!finalAnswerSection || !finalAnswerContent) return;
    
    // 显示最终答案区域
    finalAnswerSection.style.display = 'block';
    
    // 滚动到最终答案区域
    finalAnswerSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // 格式化并显示答案
    await displayFormattedAnswer(finalAnswerContent, finalAnswer);
}

// 格式化显示答案（支持Markdown）
async function displayFormattedAnswer(element, content) {
    try {
        // 配置marked选项
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: function(code, lang) {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {
                            console.warn('代码高亮失败:', err);
                        }
                    }
                    return code;
                },
                breaks: true,
                gfm: true
            });
            
            // 将Markdown转换为HTML
            const htmlContent = marked.parse(content);
            
            // 直接设置HTML内容
            element.innerHTML = htmlContent;
            
            // 如果有代码块，应用高亮
            if (typeof hljs !== 'undefined') {
                element.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        } else {
            // 如果marked未加载，使用基本格式化
            element.innerHTML = formatBasicText(content);
        }
    } catch (error) {
        console.error('格式化显示失败:', error);
        // 降级到纯文本显示
        element.textContent = content;
    }
}

// 基本文本格式化（当Markdown库未加载时的备用方案）
function formatBasicText(text) {
    return text
        // 将换行转换为<br>
        .replace(/\n/g, '<br>')
        // 处理代码块
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // 处理行内代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 处理粗体
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 处理斜体
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 处理链接
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

// 打字机效果
async function typeWriterEffect(element, text, speed = 50) {
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise(resolve => setTimeout(resolve, speed));
    }
}

// 显示操作按钮
function showActionButtons() {
    const downloadBtn = document.getElementById('downloadAnswerBtn');
    const copyBtn = document.getElementById('copyAnswerBtn');
    const regenerateBtn = document.getElementById('regenerateAnswerBtn');
    
    if (downloadBtn) {
        downloadBtn.style.display = 'flex';
    }
    
    if (copyBtn) {
        copyBtn.style.display = 'flex';
    }
    
    if (regenerateBtn) {
        regenerateBtn.style.display = 'flex';
    }
}

// 显示错误状态
function showQuickAnswerError(errorMessage) {
    const thinkingProcessSection = document.getElementById('thinkingProcessSection');
    const finalAnswerSection = document.getElementById('finalAnswerSection');
    const errorSection = document.getElementById('quickAnswerError');
    const errorMessageElement = document.getElementById('quickAnswerErrorMessage');
    
    // 隐藏其他区域
    if (thinkingProcessSection) thinkingProcessSection.style.display = 'none';
    if (finalAnswerSection) finalAnswerSection.style.display = 'none';
    
    // 显示错误区域
    if (errorSection) {
        errorSection.style.display = 'block';
    }
    
    // 设置错误消息
    if (errorMessageElement) {
        errorMessageElement.textContent = errorMessage;
    }
    
    // 显示重新生成按钮
    const regenerateBtn = document.getElementById('regenerateAnswerBtn');
    if (regenerateBtn) {
        regenerateBtn.style.display = 'flex';
    }
    
    // 隐藏下载和复制按钮
    const downloadBtn = document.getElementById('downloadAnswerBtn');
    const copyBtn = document.getElementById('copyAnswerBtn');
    if (downloadBtn) downloadBtn.style.display = 'none';
    if (copyBtn) copyBtn.style.display = 'none';
}

// 复制快速回答
async function copyQuickAnswer() {
    const copyBtn = document.getElementById('copyAnswerBtn');
    if (!window.currentQuickAnswer || !copyBtn) return;
    
    // 添加按钮动画
    addButtonAnimation(copyBtn);
    
    // 构建完整的回答文本（使用原始文本，不包含HTML格式）
    const fullAnswer = `思维过程：\n${window.currentQuickAnswer.thinking_process}\n\n最终回答：\n${window.currentQuickAnswer.final_answer}`;
    
    const success = await copyTextToClipboard(fullAnswer);
    
    if (success) {
        // 临时改变按钮文本
        const originalIcon = copyBtn.querySelector('.button-icon').textContent;
        const originalText = copyBtn.querySelector('.button-text').textContent;
        
        copyBtn.querySelector('.button-icon').textContent = '✅';
        copyBtn.querySelector('.button-text').textContent = '已复制!';
        
        setTimeout(() => {
            copyBtn.querySelector('.button-icon').textContent = originalIcon;
            copyBtn.querySelector('.button-text').textContent = originalText;
        }, 2000);
        
        showCustomAlert('回答已成功复制到剪贴板', 'success', 2000);
    } else {
        showCustomAlert('复制失败，请手动选择文本复制', 'error', 3000);
    }
}

// 下载快速回答为doc格式
async function downloadQuickAnswer() {
    const downloadBtn = document.getElementById('downloadAnswerBtn');
    if (!window.currentQuickAnswer || !downloadBtn) return;
    
    // 添加按钮动画
    addButtonAnimation(downloadBtn);
    
    try {
        // 临时改变按钮状态
        const originalIcon = downloadBtn.querySelector('.button-icon').textContent;
        const originalText = downloadBtn.querySelector('.button-text').textContent;
        
        downloadBtn.querySelector('.button-icon').textContent = '⏳';
        downloadBtn.querySelector('.button-text').textContent = '生成中...';
        downloadBtn.disabled = true;
        
        // 生成HTML文档内容
        const htmlContent = createWordDocument();
        
        // 创建blob（使用application/msword让Word识别）
        const blob = new Blob([htmlContent], { 
            type: 'application/msword;charset=utf-8' 
        });
        
        // 下载文档
        if (typeof saveAs !== 'undefined') {
            saveAs(blob, `AI深度回答_${new Date().toISOString().slice(0, 10)}.doc`);
        } else {
            // 备用下载方法
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `AI深度回答_${new Date().toISOString().slice(0, 10)}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        
        // 恢复按钮状态
        downloadBtn.querySelector('.button-icon').textContent = '✅';
        downloadBtn.querySelector('.button-text').textContent = '下载完成!';
        
        setTimeout(() => {
            downloadBtn.querySelector('.button-icon').textContent = originalIcon;
            downloadBtn.querySelector('.button-text').textContent = originalText;
            downloadBtn.disabled = false;
        }, 2000);
        
        showCustomAlert('文档下载成功！', 'success', 2000);
        
    } catch (error) {
        console.error('下载失败:', error);
        
        // 如果失败，提供文本下载作为备用
        await downloadAsTextFile();
        
        // 恢复按钮状态
        downloadBtn.querySelector('.button-icon').textContent = '📄';
        downloadBtn.querySelector('.button-text').textContent = '下载文档';
        downloadBtn.disabled = false;
        
        showCustomAlert('已下载为文本文件', 'info', 3000);
    }
}

// 创建Word文档HTML内容
function createWordDocument() {
    if (!window.currentQuickAnswer) return '';
    
    const currentDate = new Date().toLocaleString('zh-CN');
    
    // HTML转义函数
    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };
    
    // 格式化文本内容
    const formatContent = (content) => {
        if (!content) return '';
        
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; font-family: monospace;">$1</pre>');
    };
    
    const htmlContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <title>AI深度回答报告</title>
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotPromptForConvert/><w:DoNotShowInsertAsIcon/></w:WordDocument></xml><![endif]-->
    <style>
        body {
            font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin: 0 0 10px 0;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin: 0;
        }
        .section {
            margin: 25px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin: 20px 0 10px 0;
            padding-left: 10px;
            border-left: 4px solid #2563eb;
        }
        .content {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .thinking {
            background-color: #e8f4fd;
        }
        .answer {
            background-color: #f0f9ff;
        }
        .meta {
            font-size: 12px;
            color: #6b7280;
            text-align: right;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
        }
        p {
            margin: 12px 0;
        }
        pre {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        code {
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">🤖 AI深度回答报告</h1>
        <p class="subtitle">智优词 - AI提示词优化工具</p>
    </div>
    
    <div class="section">
        <h2 class="section-title">📝 原始问题</h2>
        <div class="content">
            <p>${escapeHtml(window.currentQuickAnswer.prompt)}</p>
        </div>
    </div>
    
    <div class="section">
        <h2 class="section-title">🧠 AI思维过程</h2>
        <div class="content thinking">
            <p>${formatContent(window.currentQuickAnswer.thinking_process)}</p>
        </div>
    </div>
    
    <div class="section">
        <h2 class="section-title">✨ 最终回答</h2>
        <div class="content answer">
            <p>${formatContent(window.currentQuickAnswer.final_answer)}</p>
        </div>
    </div>
    
    <div class="meta">
        <p>生成时间：${currentDate}</p>
        <p>生成工具：智优词 (xtang.dpdns.org)</p>
    </div>
</body>
</html>`;
    
    return htmlContent;
}

// 备用文本文件下载
async function downloadAsTextFile() {
    if (!window.currentQuickAnswer) return;
    
    const currentDate = new Date().toLocaleString('zh-CN');
    
    const textContent = `🤖 AI深度回答报告
智优词 - AI提示词优化工具

📝 原始问题
${window.currentQuickAnswer.prompt}

🧠 AI思维过程
${window.currentQuickAnswer.thinking_process}

✨ 最终回答
${window.currentQuickAnswer.final_answer}

---
生成时间：${currentDate}
生成工具：智优词 (xtang.dpdns.org)`;
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI深度回答_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


// 重新生成回答
async function regenerateQuickAnswer() {
    if (!window.currentQuickAnswer) {
        showCustomAlert('无法重新生成，请重新点击快速回答按钮', 'warning', 3000);
        return;
    }
    
    // 重置弹框状态
    resetModalState();
    
    // 重新生成
    await generateQuickAnswer(window.currentQuickAnswer.prompt);
}


// 导出函数到全局作用域
window.handleQuickAnswerClick = handleQuickAnswerClick;
window.showQuickAnswerModal = showQuickAnswerModal;
window.closeQuickAnswerModal = closeQuickAnswerModal;
window.generateQuickAnswer = generateQuickAnswer;
window.downloadQuickAnswer = downloadQuickAnswer;
window.copyQuickAnswer = copyQuickAnswer;
window.regenerateQuickAnswer = regenerateQuickAnswer;
