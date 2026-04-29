"""
快速回答API路由
处理基于优化提示词的快速回答请求
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import json

from ..config import get_settings
from ..models import QuickAnswerRequest, QuickAnswerResponse
from ..services.quick_answer_service import QuickAnswerService

# 创建路由器
router = APIRouter(prefix="/api/quick-answer", tags=["quick-answer"])


@router.post("/", response_model=QuickAnswerResponse)
async def generate_quick_answer(
    request: QuickAnswerRequest,
    settings = Depends(get_settings)
) -> QuickAnswerResponse:
    """
    基于优化后的提示词生成快速回答
    
    Args:
        request: 快速回答请求数据
        settings: 应用配置
    
    Returns:
        包含思维过程和最终答案的响应
    """
    try:
        # 创建快速回答服务实例
        quick_answer_service = QuickAnswerService(settings)
        
        # 生成快速回答
        result = await quick_answer_service.generate_answer(
            prompt=request.prompt,
            model=request.model or "deepseek-v4-flash"
        )
        
        return QuickAnswerResponse(
            thinking_process=result["thinking_process"],
            final_answer=result["final_answer"],
            model_used=result["model_used"],
            success=True
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"快速回答生成错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"快速回答生成失败: {str(e)}"
        )


@router.get("/models")
async def get_supported_models() -> Dict[str, Any]:
    """
    获取快速回答支持的模型列表
    
    Returns:
        支持的模型信息
    """
    return {
        "supported_models": [
            {
                "id": "deepseek-v4-flash",
                "name": "DeepSeek V4 Flash",
                "description": "DeepSeek最新极速模型，快速响应与高质量输出并存",
                "features": ["极速响应", "高效推理", "优质回答"]
            }
        ],
        "default_model": "deepseek-v4-flash"
    }
