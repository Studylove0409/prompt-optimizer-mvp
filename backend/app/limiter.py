"""
速率限制器模块
"""
from fastapi import Request
from slowapi import Limiter

# 根据 Vercel 和 Cloudflare 的文档，从 "x-forwarded-for" 获取真实 IP
def get_real_ip(request: Request) -> str:
    # 'x-forwarded-for' 报头是一个逗号分隔的 IP 列表，第一个是原始客户端 IP
    if "x-forwarded-for" in request.headers:
        return request.headers["x-forwarded-for"].split(',')[0].strip()
    return request.client.host

# 初始化 Limiter
limiter = Limiter(key_func=get_real_ip) 