from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
from fastapi_limiter import FastAPILimiter

from .config import get_settings
from .routers import health, models, optimize

# 获取配置
settings = get_settings()

# 创建FastAPI应用
app = FastAPI(
    title=settings.app_title,
    description=settings.app_description,
    version=settings.app_version
)


@app.on_event("startup")
async def startup():
    """应用启动时初始化Redis连接和速率限制器"""
    try:
        # 创建Redis连接
        redis_client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)

        # 初始化FastAPILimiter
        await FastAPILimiter.init(redis_client)
        print(f"✅ 速率限制器初始化成功，Redis连接: {settings.redis_url}")
    except Exception as e:
        print(f"❌ 速率限制器初始化失败: {e}")
        # 在生产环境中，您可能希望在这里抛出异常来阻止应用启动
        # raise e


@app.on_event("shutdown")
async def shutdown():
    """应用关闭时清理资源"""
    try:
        await FastAPILimiter.close()
        print("✅ 速率限制器已关闭")
    except Exception as e:
        print(f"❌ 关闭速率限制器时出错: {e}")

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
