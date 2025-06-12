/**
 * 历史记录功能调试工具
 * 用于在Vercel生产环境中诊断问题
 */

// 创建调试面板
function createDebugPanel() {
    // 检查是否已存在调试面板
    if (document.getElementById('historyDebugPanel')) {
        return;
    }

    const panel = document.createElement('div');
    panel.id = 'historyDebugPanel';
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 300px;
        max-height: 400px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        overflow-y: auto;
        display: none;
    `;

    panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong>历史记录调试</strong>
            <button onclick="closeDebugPanel()" style="background: #ff4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">×</button>
        </div>
        <div id="debugContent"></div>
        <div style="margin-top: 10px;">
            <button onclick="runDiagnostics()" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">运行诊断</button>
            <button onclick="testHistoryFunction()" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">测试功能</button>
        </div>
    `;

    document.body.appendChild(panel);
}

// 显示调试面板
function showDebugPanel() {
    createDebugPanel();
    document.getElementById('historyDebugPanel').style.display = 'block';
}

// 关闭调试面板
function closeDebugPanel() {
    const panel = document.getElementById('historyDebugPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// 添加调试信息
function addDebugInfo(message, type = 'info') {
    const content = document.getElementById('debugContent');
    if (!content) return;

    const colors = {
        info: '#ffffff',
        success: '#4CAF50',
        warning: '#ff9800',
        error: '#f44336'
    };

    const div = document.createElement('div');
    div.style.color = colors[type] || colors.info;
    div.style.marginBottom = '5px';
    div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    content.appendChild(div);
    content.scrollTop = content.scrollHeight;
}

// 运行完整诊断
function runDiagnostics() {
    const content = document.getElementById('debugContent');
    if (content) {
        content.innerHTML = '';
    }

    addDebugInfo('开始运行诊断...', 'info');

    // 1. 检查环境信息
    addDebugInfo('=== 环境信息 ===', 'info');
    addDebugInfo(`协议: ${window.location.protocol}`, 'info');
    addDebugInfo(`主机: ${window.location.host}`, 'info');
    addDebugInfo(`路径: ${window.location.pathname}`, 'info');
    addDebugInfo(`完整URL: ${window.location.href}`, 'info');

    // 2. 检查DOM状态
    addDebugInfo('=== DOM状态 ===', 'info');
    addDebugInfo(`DOM状态: ${document.readyState}`, 'info');
    
    const historyButton = document.getElementById('historyButton');
    addDebugInfo(`历史记录按钮: ${historyButton ? '✅ 存在' : '❌ 不存在'}`, historyButton ? 'success' : 'error');
    
    const historyModal = document.getElementById('historyModal');
    addDebugInfo(`历史记录模态框: ${historyModal ? '✅ 存在' : '❌ 不存在'}`, historyModal ? 'success' : 'error');

    // 3. 检查JavaScript对象
    addDebugInfo('=== JavaScript对象 ===', 'info');
    addDebugInfo(`Supabase库: ${typeof window.supabase !== 'undefined' ? '✅ 已加载' : '❌ 未加载'}`, typeof window.supabase !== 'undefined' ? 'success' : 'error');
    addDebugInfo(`Supabase客户端: ${window.supabaseClient ? '✅ 已初始化' : '❌ 未初始化'}`, window.supabaseClient ? 'success' : 'error');
    addDebugInfo(`历史记录管理器: ${window.historyManager ? '✅ 已初始化' : '❌ 未初始化'}`, window.historyManager ? 'success' : 'error');

    // 4. 检查工具函数
    addDebugInfo('=== 工具函数 ===', 'info');
    addDebugInfo(`showCustomAlert: ${typeof showCustomAlert === 'function' ? '✅ 可用' : '❌ 不可用'}`, typeof showCustomAlert === 'function' ? 'success' : 'error');
    addDebugInfo(`copyTextToClipboard: ${typeof copyTextToClipboard === 'function' ? '✅ 可用' : '❌ 不可用'}`, typeof copyTextToClipboard === 'function' ? 'success' : 'error');

    // 5. 检查用户认证状态
    addDebugInfo('=== 用户认证 ===', 'info');
    if (window.supabaseClient) {
        window.supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                addDebugInfo(`认证错误: ${error.message}`, 'error');
            } else if (session) {
                addDebugInfo(`用户已登录: ${session.user.email}`, 'success');
                addDebugInfo(`访问令牌长度: ${session.access_token.length}`, 'info');
            } else {
                addDebugInfo('用户未登录', 'warning');
            }
        }).catch(err => {
            addDebugInfo(`获取会话失败: ${err.message}`, 'error');
        });
    } else {
        addDebugInfo('无法检查认证状态（Supabase客户端不可用）', 'error');
    }

    addDebugInfo('诊断完成', 'success');
}

// 测试历史记录功能
function testHistoryFunction() {
    addDebugInfo('=== 测试历史记录功能 ===', 'info');

    if (!window.historyManager) {
        addDebugInfo('历史记录管理器不可用', 'error');
        return;
    }

    try {
        addDebugInfo('尝试打开历史记录模态框...', 'info');
        window.historyManager.openHistoryModal();
        addDebugInfo('历史记录功能调用成功', 'success');
    } catch (error) {
        addDebugInfo(`历史记录功能调用失败: ${error.message}`, 'error');
        console.error('历史记录功能测试失败:', error);
    }
}

// 添加快捷键支持（Ctrl+Shift+D）
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        showDebugPanel();
        runDiagnostics();
    }
});

// 在控制台中提供调试函数
window.debugHistory = {
    show: showDebugPanel,
    hide: closeDebugPanel,
    diagnose: runDiagnostics,
    test: testHistoryFunction,
    info: addDebugInfo
};

// 自动检测问题并显示调试面板
function autoDetectIssues() {
    // 如果在生产环境且历史记录管理器未初始化，显示调试面板
    if (window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' && 
        !window.historyManager) {
        
        setTimeout(() => {
            if (!window.historyManager) {
                console.warn('检测到历史记录功能可能存在问题，按 Ctrl+Shift+D 打开调试面板');
                
                // 在控制台显示调试提示
                console.log('%c历史记录调试工具', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
                console.log('使用以下命令进行调试:');
                console.log('debugHistory.show() - 显示调试面板');
                console.log('debugHistory.diagnose() - 运行诊断');
                console.log('debugHistory.test() - 测试功能');
            }
        }, 3000);
    }
}

// 页面加载完成后自动检测
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoDetectIssues);
} else {
    autoDetectIssues();
}
