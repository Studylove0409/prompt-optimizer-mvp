from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .config import get_settings
from .limiter import limiter  # 导入limiter实例
from .routers import health, models, optimize, history, debug, user, quick_answer

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
app.include_router(history.router)
app.include_router(debug.router)
app.include_router(user.router)
app.include_router(quick_answer.router)


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
