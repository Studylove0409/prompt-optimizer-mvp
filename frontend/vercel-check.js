/**
 * Vercel部署检查工具
 * 用于验证所有必要的文件是否正确部署到Vercel
 */

// 需要检查的文件列表
const requiredFiles = [
    // CSS文件
    '/style.css',
    '/modal-styles.css', 
    '/auth-success.css',
    '/history-modal.css',
    
    // JavaScript文件
    '/script.js',
    '/utils.js',
    '/api.js',
    '/ui.js',
    '/auth.js',
    '/modals.js',
    '/history.js',
    '/debug-history.js',
    '/particles.js',
    
    // HTML文件
    '/reset-password.html',
    
    // 图片文件
    '/img/raphael-ai.jpeg'
];

// API端点列表
const apiEndpoints = [
    '/api/optimize-prompt',
    '/api/history'
];

// 检查文件是否存在
async function checkFile(filePath) {
    try {
        const response = await fetch(filePath, { method: 'HEAD' });
        return {
            path: filePath,
            exists: response.ok,
            status: response.status,
            size: response.headers.get('content-length') || 'unknown'
        };
    } catch (error) {
        return {
            path: filePath,
            exists: false,
            status: 'error',
            error: error.message
        };
    }
}

// 检查API端点
async function checkAPI(endpoint) {
    try {
        const response = await fetch(endpoint);
        return {
            endpoint: endpoint,
            available: response.status !== 404,
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        return {
            endpoint: endpoint,
            available: false,
            status: 'error',
            error: error.message
        };
    }
}

// 运行完整检查
async function runVercelCheck() {
    console.log('🔍 开始Vercel部署检查...');
    console.log('当前域名:', window.location.host);
    console.log('协议:', window.location.protocol);
    
    const results = {
        files: [],
        apis: [],
        summary: {
            totalFiles: requiredFiles.length,
            existingFiles: 0,
            missingFiles: 0,
            totalAPIs: apiEndpoints.length,
            availableAPIs: 0,
            unavailableAPIs: 0
        }
    };

    // 检查文件
    console.log('\n📁 检查静态文件...');
    for (const filePath of requiredFiles) {
        const result = await checkFile(filePath);
        results.files.push(result);
        
        if (result.exists) {
            results.summary.existingFiles++;
            console.log(`✅ ${filePath} - ${result.size} bytes`);
        } else {
            results.summary.missingFiles++;
            console.log(`❌ ${filePath} - 状态: ${result.status}`);
        }
    }

    // 检查API
    console.log('\n🔌 检查API端点...');
    for (const endpoint of apiEndpoints) {
        const result = await checkAPI(endpoint);
        results.apis.push(result);
        
        if (result.available) {
            results.summary.availableAPIs++;
            console.log(`✅ ${endpoint} - 状态: ${result.status}`);
        } else {
            results.summary.unavailableAPIs++;
            console.log(`❌ ${endpoint} - 状态: ${result.status}`);
        }
    }

    // 显示总结
    console.log('\n📊 检查总结:');
    console.log(`文件: ${results.summary.existingFiles}/${results.summary.totalFiles} 可用`);
    console.log(`API: ${results.summary.availableAPIs}/${results.summary.totalAPIs} 可用`);
    
    if (results.summary.missingFiles > 0) {
        console.log(`\n⚠️ 发现 ${results.summary.missingFiles} 个缺失文件`);
        console.log('这可能导致功能异常，请检查vercel.json配置');
    }
    
    if (results.summary.unavailableAPIs > 0) {
        console.log(`\n⚠️ 发现 ${results.summary.unavailableAPIs} 个不可用API`);
        console.log('这可能导致后端功能异常，请检查后端部署');
    }

    if (results.summary.missingFiles === 0 && results.summary.unavailableAPIs === 0) {
        console.log('\n🎉 所有文件和API都正常！');
    }

    return results;
}

// 检查历史记录功能的特定依赖
async function checkHistoryFeature() {
    console.log('\n🔍 检查历史记录功能依赖...');
    
    const historyDeps = [
        '/history.js',
        '/history-modal.css',
        '/debug-history.js'
    ];

    let allGood = true;
    
    for (const dep of historyDeps) {
        const result = await checkFile(dep);
        if (result.exists) {
            console.log(`✅ ${dep} - 已部署`);
        } else {
            console.log(`❌ ${dep} - 缺失`);
            allGood = false;
        }
    }

    // 检查DOM元素
    const historyButton = document.getElementById('historyButton');
    const historyModal = document.getElementById('historyModal');
    
    console.log(`历史记录按钮: ${historyButton ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`历史记录模态框: ${historyModal ? '✅ 存在' : '❌ 缺失'}`);
    
    if (!historyButton || !historyModal) {
        allGood = false;
    }

    // 检查JavaScript对象
    console.log(`历史记录管理器: ${window.historyManager ? '✅ 已初始化' : '❌ 未初始化'}`);
    console.log(`Supabase客户端: ${window.supabaseClient ? '✅ 可用' : '❌ 不可用'}`);
    
    if (!window.historyManager || !window.supabaseClient) {
        allGood = false;
    }

    if (allGood) {
        console.log('🎉 历史记录功能依赖检查通过！');
    } else {
        console.log('⚠️ 历史记录功能存在问题，请检查上述缺失项');
    }

    return allGood;
}

// 生成修复建议
function generateFixSuggestions(results) {
    console.log('\n🔧 修复建议:');
    
    if (results.summary.missingFiles > 0) {
        console.log('\n📁 缺失文件修复:');
        console.log('1. 检查vercel.json中是否包含所有文件路由');
        console.log('2. 确认文件在frontend目录中存在');
        console.log('3. 重新部署到Vercel');
        
        const missingFiles = results.files.filter(f => !f.exists);
        console.log('缺失的文件:', missingFiles.map(f => f.path));
    }
    
    if (results.summary.unavailableAPIs > 0) {
        console.log('\n🔌 API问题修复:');
        console.log('1. 检查后端代码是否正确部署');
        console.log('2. 验证vercel.json中的API路由配置');
        console.log('3. 检查环境变量是否正确设置');
        
        const unavailableAPIs = results.apis.filter(a => !a.available);
        console.log('不可用的API:', unavailableAPIs.map(a => a.endpoint));
    }
}

// 导出到全局
window.vercelCheck = {
    run: runVercelCheck,
    checkHistory: checkHistoryFeature,
    checkFile: checkFile,
    checkAPI: checkAPI,
    generateFix: generateFixSuggestions
};

// 自动运行检查（仅在非localhost环境）
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // 页面加载完成后自动检查
    window.addEventListener('load', async () => {
        console.log('%cVercel部署检查工具', 'color: #0070f3; font-size: 16px; font-weight: bold;');
        console.log('运行 vercelCheck.run() 进行完整检查');
        console.log('运行 vercelCheck.checkHistory() 检查历史记录功能');
        
        // 延迟3秒后自动运行基本检查
        setTimeout(async () => {
            console.log('\n🚀 自动运行基本检查...');
            await checkHistoryFeature();
        }, 3000);
    });
}
