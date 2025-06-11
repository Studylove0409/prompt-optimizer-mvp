"""
用户认证模块
处理JWT令牌验证和用户身份提取
"""
import jwt
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any

from .config import get_settings, Settings


# HTTP Bearer认证方案
security = HTTPBearer(auto_error=False)


class User:
    """用户信息类"""
    def __init__(self, user_data: Dict[str, Any]):
        self.id = user_data.get("sub")  # Supabase用户ID
        self.email = user_data.get("email")
        self.aud = user_data.get("aud")
        self.role = user_data.get("role")
        self.raw_data = user_data


def verify_jwt_token(token: str, settings: Settings) -> Dict[str, Any]:
    """验证JWT令牌并返回用户信息"""
    try:
        # 解码JWT令牌
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="令牌已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的令牌")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"令牌验证失败: {str(e)}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    settings: Settings = Depends(get_settings)
) -> User:
    """获取当前认证用户"""
    if not credentials:
        raise HTTPException(status_code=401, detail="缺少认证令牌")
    
    # 验证令牌
    user_data = verify_jwt_token(credentials.credentials, settings)
    
    # 创建用户对象
    return User(user_data)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    settings: Settings = Depends(get_settings)
) -> Optional[User]:
    """获取可选的当前用户（不强制要求认证）"""
    if not credentials:
        return None

    try:
        # 验证令牌
        user_data = verify_jwt_token(credentials.credentials, settings)
        return User(user_data)
    except HTTPException:
        # 如果令牌无效，返回None而不是抛出异常
        return None
