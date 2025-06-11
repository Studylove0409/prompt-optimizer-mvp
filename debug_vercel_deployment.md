# Vercel部署调试指南

## 🔍 问题诊断步骤

### 1. 检查Vercel环境变量
在Vercel项目设置中添加以下环境变量：

```
SUPABASE_URL=https://njzvtxlieysctiapnpsx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qenZ0eGxpZXlzY3RpYXBucHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Mzc0OTEsImV4cCI6MjA2NTExMzQ5MX0.uECZbzE72n1rxoQRhPXe4GfdLfXgaJ853T6dh_ezL7M
SUPABASE_JWT_SECRET=bPL6DS1iWMgQaZlGlSMS3p/nSeaDxHaSwPZlLrNs8yRSHWV9n645hQNRf7Fa2Vj5pZKPQIDNY6IPfTbpNA7fbQ==
MY_LLM_API_KEY=sk-baec4afc44394432833cbe23c17dc78e
GEMINI_API_KEY=sk-0K63YAJ7FnbCXxZ56tUEPvMBEw2U8vJIbwSlhrf7Z6csKzIN
```

### 2. 检查Vercel函数日志
1. 访问Vercel Dashboard
2. 进入你的项目
3. 点击 "Functions" 标签
4. 查看函数调用日志
5. 寻找错误信息

### 3. 测试API端点
在浏览器开发者工具中测试：

```javascript
// 测试健康检查
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// 测试优化API
fetch('/api/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    original_prompt: 'Vercel测试：写一个Hello World',
    model: 'deepseek-reasoner',
    mode: 'general'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 4. 常见问题和解决方案

#### 问题1: 环境变量未设置
**症状**: API返回500错误，日志显示环境变量为None
**解决**: 在Vercel项目设置中添加所有必需的环境变量

#### 问题2: 函数超时
**症状**: API请求超时，没有响应
**解决**: 
- 升级Vercel Pro计划（支持60秒超时）
- 或者优化API响应时间

#### 问题3: 数据库连接失败
**症状**: API返回数据库连接错误
**解决**: 
- 检查Supabase URL和密钥是否正确
- 确保Supabase项目允许来自Vercel的连接

#### 问题4: CORS错误
**症状**: 浏览器控制台显示CORS错误
**解决**: 
- 检查后端CORS配置
- 确保允许Vercel域名

### 5. 调试命令

在Vercel部署后，可以通过以下方式调试：

1. **查看实时日志**:
   ```bash
   vercel logs --follow
   ```

2. **本地测试Vercel环境**:
   ```bash
   vercel dev
   ```

3. **检查部署状态**:
   ```bash
   vercel ls
   ```

### 6. 数据库调试

如果数据库无法存入数据，检查：

1. **Supabase RLS策略**: 确保匿名用户可以插入数据
2. **表权限**: 确保optimization_history表允许插入
3. **字段约束**: 确保所有必需字段都有值

### 7. 前端调试

在Vercel部署的前端中：

1. 打开浏览器开发者工具
2. 查看Console面板的错误信息
3. 查看Network面板的API请求
4. 确认API_BASE_URL是否正确（应该是'/api'）

## 🎯 快速修复步骤

1. **立即检查**: Vercel项目设置 → Environment Variables
2. **添加所有环境变量**（见上面列表）
3. **重新部署**: `vercel --prod`
4. **测试API**: 使用上面的JavaScript代码测试
5. **查看日志**: 检查Vercel函数日志中的错误信息

## 💡 提示

- Vercel免费计划函数超时限制为10秒
- 如果LLM API调用超过10秒，需要升级到Pro计划
- 或者考虑使用异步处理方式
