# Prompt Optimizer MVP

一个基于FastAPI和DeepSeek API的AI提示词优化服务，提供完整的前后端解决方案，专门用于改进和优化AI提示词，使其更加清晰、具体、高效。

## 项目概述

本项目是一个提示词优化的MVP（最小可行产品），通过调用DeepSeek API来分析和优化用户提供的原始提示词。支持两种模型选择：快速响应的DeepSeek Chat和深度推理的DeepSeek Reasoner，适用于各种场景的提示词优化需求。

## 项目结构

```
prompt-optimizer-mvp/
├── README.md                 # 项目说明文档
├── .gitignore               # Git忽略文件配置
├── backend/                 # 后端服务目录
│   ├── .env                # 环境变量配置文件（包含API密钥）
│   ├── requirements.txt    # Python依赖包列表
│   └── app/               # FastAPI应用目录
│       ├── __init__.py    # Python包初始化文件
│       └── main.py        # FastAPI主应用文件
└── frontend/              # 前端目录
    ├── index.html         # 主页面HTML结构
    ├── style.css          # 样式文件
    └── script.js          # JavaScript逻辑
```

## 技术栈

### 后端技术
- **FastAPI**: 现代、快速的Python Web框架
- **Uvicorn**: ASGI服务器，支持异步处理
- **Pydantic**: 数据验证和序列化
- **OpenAI Python库**: 用于调用DeepSeek API
- **python-dotenv**: 环境变量管理
- **requests**: HTTP请求库（备用）

### 前端技术
- **HTML5**: 语义化页面结构
- **CSS3**: 现代化样式设计，支持响应式布局
- **Vanilla JavaScript**: 原生JS，无框架依赖
- **Fetch API**: 现代化的HTTP请求处理

### AI模型
- **DeepSeek Chat (V3-0324)**: 通过 `deepseek-chat` 模型调用，响应速度快
- **DeepSeek Reasoner (R1-0528)**: 通过 `deepseek-reasoner` 模型调用，推理能力强
- **API端点**: `https://api.deepseek.com/v1`

## 环境配置

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 环境变量配置

在 `backend/.env` 文件中配置：

```env
MY_LLM_API_KEY='your-deepseek-api-key-here'
```

**重要**: 
- 请将 `your-deepseek-api-key-here` 替换为你的真实DeepSeek API密钥
- `.env` 文件已添加到 `.gitignore` 中，不会被提交到Git仓库

### 3. 启动后端服务

```bash
# 方法1: 从项目根目录启动
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# 方法2: 从backend目录启动
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 启动前端

直接在浏览器中打开 `frontend/index.html` 文件，或使用本地服务器：

```bash
# 使用Python内置服务器（推荐）
cd frontend
python -m http.server 3000

# 然后访问 http://localhost:3000
```

## API文档

### 服务端点

- **服务地址**: `http://localhost:8000`
- **API文档**: `http://localhost:8000/docs` (Swagger UI)
- **ReDoc文档**: `http://localhost:8000/redoc`

### 可用端点

#### 1. 根路径
- **GET** `/`
- **描述**: 返回API基本信息
- **响应**:
  ```json
  {
    "message": "欢迎使用Prompt Optimizer API",
    "version": "1.0.0"
  }
  ```

#### 2. 健康检查
- **GET** `/api/health`
- **描述**: 检查服务运行状态
- **响应**:
  ```json
  {
    "status": "healthy"
  }
  ```

#### 3. 获取可用模型
- **GET** `/api/models`
- **描述**: 获取支持的AI模型列表
- **响应**:
  ```json
  {
    "models": [
      {
        "id": "deepseek-chat",
        "name": "DeepSeek Chat (V3-0324)",
        "description": "更快的响应速度，适合日常对话和简单任务",
        "speed": "fast"
      },
      {
        "id": "deepseek-reasoner",
        "name": "DeepSeek Reasoner (R1-0528)",
        "description": "更强的推理能力，适合复杂分析和深度思考",
        "speed": "slow"
      }
    ],
    "default": "deepseek-chat"
  }
  ```

#### 4. 提示词优化 (核心功能)
- **POST** `/api/optimize`
- **描述**: 优化用户提供的AI提示词
- **请求体**:
  ```json
  {
    "original_prompt": "你的原始提示词内容",
    "model": "deepseek-chat"
  }
  ```
- **响应**:
  ```json
  {
    "optimized_prompt": "优化后的提示词内容",
    "model_used": "deepseek-chat"
  }
  ```

## 核心代码说明

### 前端代码结构

#### 1. HTML结构 (`frontend/index.html`)

**主要组件**：
- **页面头部**: 标题和描述
- **输入区域**: 提示词输入框和模型选择
- **输出区域**: 优化结果显示和操作按钮
- **加载状态**: 优化过程中的加载动画

**模型选择界面**：
```html
<div class="model-selection">
    <h3>选择模型</h3>
    <div class="model-options">
        <label class="model-option">
            <input type="radio" name="model" value="deepseek-chat" checked>
            <div class="model-info">
                <span class="model-name">DeepSeek Chat (V3-0324)</span>
                <span class="model-desc">更快的响应速度，适合日常对话和简单任务</span>
                <span class="model-speed fast">快速</span>
            </div>
        </label>
        <!-- DeepSeek Reasoner 选项 -->
    </div>
</div>
```

#### 2. CSS样式 (`frontend/style.css`)

**设计特点**：
- **响应式设计**: 支持桌面和移动设备
- **现代化UI**: 渐变背景、圆角边框、阴影效果
- **交互反馈**: 悬停效果、点击动画、状态变化
- **模型选择样式**: 清晰的视觉区分和选中状态

**关键样式类**：
```css
.model-option {
    /* 模型选择项样式 */
    display: flex;
    align-items: flex-start;
    padding: 15px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.model-option:has(input[type="radio"]:checked) {
    /* 选中状态样式 */
    border-color: #667eea;
    background: #f0f4ff;
}
```

#### 3. JavaScript逻辑 (`frontend/script.js`)

**核心功能**：
- **环境检测**: 自动适配本地开发和部署环境
- **模型选择**: 获取用户选择的AI模型
- **API调用**: 与后端服务通信
- **用户交互**: 复制、清空、快捷键支持

**环境适配**：
```javascript
const API_BASE_URL = window.location.protocol === 'file:'
    ? 'http://localhost:8000/api'  // 本地开发环境
    : '/api';                      // 部署环境（相对路径）
```

**模型选择逻辑**：
```javascript
function getSelectedModel() {
    const selectedRadio = document.querySelector('input[name="model"]:checked');
    return selectedRadio ? selectedRadio.value : 'deepseek-chat';
}
```

**API请求处理**：
```javascript
async function optimizePrompt() {
    const originalPrompt = originalPromptTextarea.value.trim();
    const selectedModel = getSelectedModel();

    const response = await fetch(`${API_BASE_URL}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            original_prompt: originalPrompt,
            model: selectedModel
        })
    });

    const data = await response.json();
    showResult(data.optimized_prompt, data.model_used);
}
```

### 后端代码结构

#### 1. 主应用文件 (`backend/app/main.py`)

**导入和配置**：
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
import openai
```

**环境变量加载**：
```python
# 加载环境变量，指定.env文件路径
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# 获取API密钥
LLM_API_KEY = os.getenv("MY_LLM_API_KEY")
```

**元提示词模板**：
项目使用通用的元提示词模板 (`META_PROMPT_TEMPLATE`)，包含：
- **角色定义**: AI提示词工程与优化大师
- **优化准则**: 8个黄金准则，覆盖各种应用场景
- **通用适用**: 不限于编程，支持各领域提示词优化
- **输出要求**: 直接输出优化结果，无额外解释

**FastAPI应用配置**：
```python
app = FastAPI(
    title="Prompt Optimizer API",
    description="一个用于优化提示词的API服务",
    version="1.0.0"
)

# CORS配置 - 允许所有来源（开发环境）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**数据模型**：
```python
class PromptRequest(BaseModel):
    original_prompt: str
    model: str = "deepseek-chat"  # 默认使用更快的模型

class PromptResponse(BaseModel):
    optimized_prompt: str
    model_used: str
```

**核心优化逻辑**：
```python
@app.post("/api/optimize", response_model=PromptResponse)
async def optimize_prompt(request_body: PromptRequest):
    # 1. API密钥验证
    # 2. 模型选择验证
    # 3. 格式化元提示词模板
    # 4. 初始化DeepSeek客户端
    # 5. 构建messages列表
    # 6. 调用DeepSeek API（使用用户选择的模型）
    # 7. 处理响应和错误
```

### DeepSeek API集成

#### 客户端初始化
```python
client = OpenAI(
    api_key=LLM_API_KEY,
    base_url="https://api.deepseek.com/v1"
)
```

**API调用配置**：
```python
response = client.chat.completions.create(
    model=request_body.model,  # 用户选择的模型
    messages=messages,
    stream=False,
    temperature=0.5,
    max_tokens=2000
)
```

**异常处理**：
项目实现了完整的异常处理机制：
- `openai.APIConnectionError`: API连接失败
- `openai.RateLimitError`: API速率限制
- `openai.APIStatusError`: API状态错误
- `Exception`: 通用异常处理

## 功能特性

### 🎯 核心功能
- **智能提示词优化**: 基于专业模板的AI提示词改进
- **双模型支持**: 快速响应 vs 深度推理，满足不同需求
- **实时优化**: 即时获取优化结果
- **一键复制**: 便捷的结果复制功能

### 🎨 用户体验
- **响应式设计**: 完美适配桌面和移动设备
- **直观界面**: 清晰的模型选择和状态反馈
- **快捷操作**: 支持 Ctrl+Enter 快捷键优化
- **加载动画**: 优雅的等待体验

### 🔧 技术特性
- **环境自适应**: 自动检测开发/生产环境
- **CORS支持**: 跨域请求处理
- **错误处理**: 完善的异常捕获和用户提示
- **API文档**: 自动生成的Swagger文档

### 🛡️ 安全特性
- **环境变量**: API密钥安全存储
- **输入验证**: Pydantic数据验证
- **错误隐藏**: 不暴露敏感信息

## 开发指南

### 本地开发流程
1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd prompt-optimizer-mvp
   ```

2. **配置环境变量**
   ```bash
   # 创建 backend/.env 文件
   echo "MY_LLM_API_KEY='your-deepseek-api-key'" > backend/.env
   ```

3. **安装后端依赖**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **启动后端服务**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **启动前端**
   ```bash
   # 直接打开文件
   open frontend/index.html

   # 或使用本地服务器
   cd frontend
   python -m http.server 3000
   ```

6. **访问应用**
   - 前端: `http://localhost:3000` 或直接打开 HTML 文件
   - API文档: `http://localhost:8000/docs`

### 代码修改指南

#### 前端修改
- **样式调整**: 编辑 `frontend/style.css`
- **交互逻辑**: 修改 `frontend/script.js`
- **页面结构**: 更新 `frontend/index.html`
- **API地址**: 修改 `script.js` 中的 `API_BASE_URL`

#### 后端修改
- **元提示词**: 编辑 `META_PROMPT_TEMPLATE` 变量
- **模型配置**: 修改 `model` 参数和可用模型列表
- **API参数**: 调整 `temperature`、`max_tokens` 等参数
- **新增端点**: 在 `main.py` 中添加新的路由

### 部署准备
- **环境变量**: 确保生产环境正确配置 API 密钥
- **CORS设置**: 生产环境中限制允许的来源
- **相对路径**: 前端已配置自动适配部署环境
- **依赖管理**: 确保 `requirements.txt` 包含所有依赖

### 安全注意事项
- ✅ API密钥存储在 `.env` 文件中，已添加到 `.gitignore`
- ⚠️ 生产环境中应限制CORS来源
- ⚠️ 考虑添加API访问限制和认证
- ⚠️ 定期轮换API密钥

## 故障排除

### 常见问题

#### 1. **API密钥相关**
- **问题**: API密钥错误或未设置
- **解决**:
  - 检查 `backend/.env` 文件是否存在
  - 确认格式: `MY_LLM_API_KEY='your-key-here'`
  - 验证API密钥有效性

#### 2. **依赖安装问题**
- **问题**: Python包安装失败
- **解决**:
  - 确保Python版本 >= 3.8
  - 升级pip: `pip install --upgrade pip`
  - 使用虚拟环境: `python -m venv venv`

#### 3. **服务启动问题**
- **问题**: 后端服务无法启动
- **解决**:
  - 检查端口8000是否被占用
  - 查看详细错误日志
  - 确认所有依赖已正确安装

#### 4. **前端API调用失败**
- **问题**: 前端无法连接后端
- **解决**:
  - 确认后端服务正在运行
  - 检查浏览器控制台错误信息
  - 验证API地址配置

#### 5. **CORS错误**
- **问题**: 跨域请求被阻止
- **解决**:
  - 确认后端CORS配置正确
  - 使用本地服务器而非直接打开HTML文件

### 调试技巧
- **后端调试**: 查看终端输出和API文档 (`/docs`)
- **前端调试**: 使用浏览器开发者工具
- **API测试**: 使用Postman或curl测试端点

## 项目路线图

### ✅ 已完成功能
- [x] 基础前后端架构
- [x] DeepSeek API集成
- [x] 双模型支持（Chat + Reasoner）
- [x] 响应式前端界面
- [x] 环境自适应配置
- [x] 完整的错误处理

### 🚧 下一步开发计划
- [ ] 用户认证系统
- [ ] 提示词历史记录
- [ ] 批量优化功能
- [ ] 提示词模板库
- [ ] 优化结果评分
- [ ] 导出功能（PDF/Word）
- [ ] 多语言支持
- [ ] 暗色主题
- [ ] API访问限制和配额管理
- [ ] 更多AI模型支持（GPT、Claude等）

## 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

### 贡献流程
1. **Fork项目** 到你的GitHub账户
2. **创建功能分支** `git checkout -b feature/amazing-feature`
3. **提交更改** `git commit -m 'Add some amazing feature'`
4. **推送分支** `git push origin feature/amazing-feature`
5. **创建Pull Request**

### 代码规范
- **Python**: 遵循PEP 8规范
- **JavaScript**: 使用ES6+语法
- **CSS**: 使用BEM命名规范
- **提交信息**: 使用清晰的提交信息

### 测试要求
- 确保所有现有功能正常工作
- 为新功能添加适当的测试
- 更新相关文档

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - 现代Python Web框架
- [DeepSeek](https://www.deepseek.com/) - 提供强大的AI模型API
- [OpenAI Python库](https://github.com/openai/openai-python) - API客户端

## 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/prompt-optimizer-mvp/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/prompt-optimizer-mvp/discussions)

---

**项目状态**: 🚀 活跃开发中
**版本**: v1.0.0
**创建时间**: 2025年6月
**最后更新**: 2025年6月5日

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！

## 速率限制功能

本项目实现了基于IP的速率限制功能，可以防止API滥用，提高服务的稳定性，特别优化了Vercel部署环境。

### 速率限制规则

默认配置的速率限制如下：
- 根路径 (`/`): 20次/分钟
- 健康检查 (`/api/health`): 30次/分钟
- 模型列表 (`/api/models`): 15次/分钟
- 提示词优化 (`/api/optimize`): 10次/分钟

### 速率限制设计

本项目使用基于内存的轻量级速率限制实现，特别适用于Vercel的Serverless环境：

1. **内置内存存储**：
   - 无需额外服务，开箱即用
   - 完全基于内存，适用于所有部署环境
   - 自动检测Vercel环境并使用优化配置

2. **自优化特性**：
   - 定期清理过期记录，防止内存泄漏
   - 自动调整记录保留时间，节省内存
   - 时间窗口精确计算，确保限制准确

3. **自定义配置**：
   - 通过环境变量控制速率限制
   - 不同API路径可设置不同限制规则
   - 在`vercel.json`中预设了合理的默认值

### Vercel部署

当项目部署在Vercel上时，速率限制功能自动启用：

1. **无缝集成**：
   - 通过`VERCEL=1`环境变量自动检测
   - 项目已预配置`vercel.json`文件
   - 无需额外设置即可使用

2. **配置方式**：
   - 可在Vercel控制台调整环境变量来修改限制规则
   - 支持通过`RATE_LIMIT_*`环境变量自定义限制
   - 修改环境变量无需重新部署代码

### 速率限制响应

当客户端请求超过限制时，API会返回以下响应：

```json
{
  "detail": "请求速率超过限制，请稍后重试",
  "limit": "10/minute",
  "retry_after": "42"
}
```

前端会显示友好的提示信息，告知用户需要等待多长时间。
