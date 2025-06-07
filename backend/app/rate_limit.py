"""
速率限制配置模块
"""
from fastapi import HTTPException
from fastapi_limiter.depends import RateLimiter


def get_optimize_rate_limiter():
    """
    获取优化接口的速率限制器
    每分钟最多10次请求
    """
    return RateLimiter(times=10, seconds=60)


def handle_rate_limit_error(e: Exception):
    """
    处理速率限制错误
    """
    if "rate limit" in str(e).lower() or "too many requests" in str(e).lower():
        raise HTTPException(
            status_code=429,
            detail={
                "error": "请求过于频繁",
                "message": "您的请求过于频繁，请稍后再试",
                "limit": "每分钟最多允许10次请求",
                "retry_after": 60
            }
        )
    # 其他错误继续抛出
    raise e
