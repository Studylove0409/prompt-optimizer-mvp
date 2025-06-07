# 后端代码重构说明

## 重构概述

原来的代码全部集中在 `main.py` 文件中，包含了配置、模型定义、业务逻辑和路由处理，代码结构混乱，难以维护和扩展。

经过重构，现在的代码按照功能模块进行了合理的分离，采用了清晰的分层架构。

## 新的目录结构

```
backend/app/
├── __init__.py
├── main.py              # 应用入口和配置
├── config.py            # 配置管理
├── constants.py         # 常量定义
├── models.py            # Pydantic数据模型
├── services/            # 业务逻辑服务层
│   ├── __init__.py
│   ├── llm_service.py   # LLM API调用服务
│   └── prompt_service.py # 提示词优化服务
└── routers/             # API路由层
    ├── __init__.py
    ├── health.py        # 健康检查路由
    ├── models.py        # 模型相关路由
    └── optimize.py      # 优化相关路由
```

## 各模块职责

### 1. `main.py` - 应用入口
- 创建FastAPI应用实例
- 配置CORS中间件
- 注册路由
- 提供根路径端点

### 2. `config.py` - 配置管理
- 环境变量加载
- 应用配置定义
- API密钥管理
- 单例模式配置获取

### 3. `constants.py` - 常量定义
- 支持的模型列表
- 模型信息配置
- 元提示词模板
- API调用参数

### 4. `models.py` - 数据模型
- 请求/响应的Pydantic模型
- 数据验证和序列化
- 类型安全保证

### 5. `services/` - 服务层

#### `llm_service.py` - LLM API服务
- 统一的LLM API调用接口
- DeepSeek和Gemini客户端管理
- 错误处理和重试逻辑
- 消息格式化

#### `prompt_service.py` - 提示词服务
- 提示词优化业务逻辑
- 模型验证
- 模板格式化
- 服务编排

### 6. `routers/` - 路由层

#### `health.py` - 健康检查
- `/api/health` 端点
- 服务状态检查

#### `models.py` - 模型管理
- `/api/models` 端点
- 可用模型列表

#### `optimize.py` - 优化功能
- `/api/optimize` 端点
- 提示词优化处理

## 重构优势

### 1. **代码组织清晰**
- 按功能模块分离
- 单一职责原则
- 易于理解和维护

### 2. **可扩展性强**
- 新增模型只需修改constants.py
- 新增服务只需在services/目录添加
- 新增路由只需在routers/目录添加

### 3. **测试友好**
- 各模块独立，便于单元测试
- 依赖注入，便于mock
- 业务逻辑与框架解耦

### 4. **错误处理统一**
- 集中的异常处理
- 一致的错误响应格式
- 详细的错误日志

### 5. **配置管理规范**
- 环境变量统一管理
- 配置与代码分离
- 支持不同环境配置

## 使用方式

### 启动服务
```bash
cd backend
python -m app.main
```

### API端点
- `GET /` - 根路径信息
- `GET /api/health` - 健康检查
- `GET /api/models` - 获取模型列表
- `POST /api/optimize` - 优化提示词

### 环境变量
```
MY_LLM_API_KEY=your_deepseek_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## 后续优化建议

1. **添加日志系统** - 使用structlog或loguru
2. **添加缓存机制** - Redis缓存常用优化结果
3. **添加限流功能** - 防止API滥用
4. **添加监控指标** - Prometheus metrics
5. **添加数据库支持** - 存储优化历史
6. **添加用户认证** - JWT token认证
7. **添加API文档** - 自动生成OpenAPI文档
8. **添加单元测试** - pytest测试覆盖
9. **添加Docker支持** - 容器化部署
10. **添加CI/CD流程** - 自动化部署
