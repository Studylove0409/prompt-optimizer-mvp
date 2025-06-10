# Supabase 用户认证设置指南

## 第一步：创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册账号
2. 创建新项目
3. 等待项目初始化完成

## 第二步：获取项目配置信息

1. 在 Supabase 项目仪表板中，点击左侧菜单的 **Settings** (设置)
2. 选择 **API** 选项卡
3. 复制以下信息：
   - **Project URL**: 形如 `https://你的项目ID.supabase.co`
   - **anon public key**: 公开的匿名密钥

## 第三步：配置前端项目

1. 打开 `frontend/index.html` 文件
2. 找到 Supabase 客户端初始化部分（在文件底部的 `<script>` 标签中）
3. 将以下占位符替换为你的实际配置：

```javascript
// 替换这两行
const SUPABASE_URL = 'https://你的项目ID.supabase.co';
const SUPABASE_ANON_KEY = '你的anon_public密钥';

// 替换为实际值，例如：
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## 第四步：配置 Supabase 认证设置

1. 在 Supabase 项目仪表板中，点击 **Authentication** (认证)
2. 点击 **Settings** 选项卡
3. 在 **Site URL** 中添加你的网站域名：
   - 本地开发：`http://localhost:3000` 或 `http://127.0.0.1:5500`
   - 生产环境：你的实际域名，如 `https://yourdomain.com`

## 第五步：启用邮箱认证

1. 在 **Authentication** > **Providers** 中
2. 确保 **Email** 提供商已启用
3. 可以自定义邮件模板（可选）

## 功能说明

### 已实现的功能

1. **用户注册**
   - 邮箱 + 密码注册
   - 自动发送验证邮件
   - 密码强度验证（最少6位）

2. **用户登录**
   - 邮箱 + 密码登录
   - 错误处理和用户友好提示

3. **用户登出**
   - 一键登出功能
   - 清除用户会话

4. **认证状态管理**
   - 自动检测用户登录状态
   - 实时更新UI界面
   - 页面刷新后保持登录状态

5. **响应式设计**
   - 支持桌面端和移动端
   - 优雅的弹窗设计
   - Apple风格的UI

### UI 组件

- **导航栏认证按钮**: 显示登录/注册或用户信息
- **认证弹窗**: 包含登录和注册表单
- **用户菜单**: 显示用户邮箱和登出选项

### 安全特性

- 使用 Supabase 的安全认证系统
- API 密钥通过环境变量管理
- 支持邮箱验证
- 密码加密存储

## 测试步骤

1. 打开网站
2. 点击右上角的"登录/注册"按钮
3. 尝试注册新账号
4. 检查邮箱验证邮件
5. 验证邮箱后尝试登录
6. 测试登出功能

## 故障排除

### 常见问题

1. **认证功能不可用**
   - 检查 `index.html` 中的 Supabase 配置是否正确
   - 确保 Supabase CDN 库正确加载
   - 验证网络连接是否正常

2. **登录失败**
   - 检查邮箱是否已验证
   - 确认密码是否正确
   - 确保邮箱格式正确

3. **注册失败**
   - 检查邮箱格式是否正确
   - 确认密码长度至少6位
   - 检查网络连接

4. **邮件未收到**
   - 检查垃圾邮件文件夹
   - 确认 Supabase 邮件设置正确
   - 可能需要等待几分钟

### 调试技巧

1. 打开浏览器开发者工具
2. 检查 Network 选项卡的网络请求
3. 在 Supabase 仪表板查看认证日志
4. 确认项目配置正确

## 下一步扩展

可以考虑添加以下功能：

1. **社交登录**: Google、GitHub 等
2. **用户资料管理**: 头像、昵称等
3. **密码重置**: 忘记密码功能
4. **多因素认证**: 增强安全性
5. **用户权限管理**: 不同用户角色

## 注意事项

- anon public 密钥可以安全地暴露在前端代码中
- 确保在生产环境中正确配置 Site URL
- 定期检查 Supabase 项目的使用量和限制
- 建议启用 RLS (Row Level Security) 保护数据安全
