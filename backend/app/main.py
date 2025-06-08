from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .config import get_settings
from .routers import health, models, optimize

# 根据 Vercel 和 Cloudflare 的文档，从 "x-forwarded-for" 获取真实 IP
def get_real_ip(request: Request) -> str:
    # 'x-forwarded-for' 报头是一个逗号分隔的 IP 列表，第一个是原始客户端 IP
    if "x-forwarded-for" in request.headers:
        return request.headers["x-forwarded-for"].split(',')[0].strip()
    return request.client.host

# 初始化 Limiter
limiter = Limiter(key_func=get_real_ip)


# 获取配置
settings = get_settings()

# 创建FastAPI应用
app = FastAPI(
    title=settings.app_title,
    description=settings.app_description,
    version=settings.app_version
)

# 将 limiter 添加到应用状态
app.state.limiter = limiter

# 添加错误处理器
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# 添加中间件
app.add_middleware(SlowAPIMiddleware)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

# 包含路由
app.include_router(health.router)
app.include_router(models.router)
app.include_router(optimize.router)


@app.get("/")
async def root():
    """根路径，返回API信息"""
    return {
        "message": f"欢迎使用{settings.app_title}",
        "version": settings.app_version
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
