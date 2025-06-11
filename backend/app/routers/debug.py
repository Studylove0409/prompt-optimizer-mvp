"""
调试路由 - 用于Vercel部署调试
"""
import os
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/debug", tags=["debug"])

@router.get("/env-check")
async def check_environment_variables() -> Dict[str, Any]:
    """检查环境变量是否正确设置"""
    
    env_vars = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY")[:20] + "..." if os.getenv("SUPABASE_ANON_KEY") else None,
        "SUPABASE_JWT_SECRET": "已设置" if os.getenv("SUPABASE_JWT_SECRET") else "未设置",
        "MY_LLM_API_KEY": "已设置" if os.getenv("MY_LLM_API_KEY") else "未设置",
        "GEMINI_API_KEY": "已设置" if os.getenv("GEMINI_API_KEY") else "未设置",
    }
    
    missing_vars = [key for key, value in env_vars.items() if not value or value == "未设置"]
    
    return {
        "status": "success" if not missing_vars else "warning",
        "environment_variables": env_vars,
        "missing_variables": missing_vars,
        "message": "所有环境变量已正确设置" if not missing_vars else f"缺少环境变量: {', '.join(missing_vars)}"
    }

@router.get("/db-test")
async def test_database_connection() -> Dict[str, Any]:
    """测试数据库连接"""
    try:
        from ..services.supabase_service import SupabaseService
        
        supabase_service = SupabaseService()
        
        # 尝试查询数据库
        result = supabase_service.supabase.table("optimization_history").select("count").execute()
        
        return {
            "status": "success",
            "message": "数据库连接正常",
            "connection": "已连接",
            "query_result": "查询成功"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"数据库连接失败: {str(e)}",
            "connection": "失败",
            "error": str(e)
        }

@router.post("/test-save")
async def test_save_record() -> Dict[str, Any]:
    """测试保存记录到数据库"""
    try:
        from ..services.supabase_service import SupabaseService
        import time
        
        supabase_service = SupabaseService()
        
        # 创建测试记录
        test_record = {
            "original_prompt": f"Vercel部署测试 {int(time.time())}",
            "optimized_prompt": "这是一个测试优化结果",
            "mode": "general",
            "user_type": "anonymous",
            "session_id": f"test_vercel_{int(time.time())}"
        }
        
        # 尝试保存
        result = supabase_service.save_optimization_history(
            user_id=None,
            original_prompt=test_record["original_prompt"],
            optimized_prompt=test_record["optimized_prompt"],
            mode=test_record["mode"],
            session_id=test_record["session_id"]
        )
        
        return {
            "status": "success",
            "message": "测试记录保存成功",
            "result": result,
            "test_record": test_record
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"保存测试记录失败: {str(e)}",
            "error": str(e)
        }
