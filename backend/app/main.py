from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
import openai
import secrets
import base64
import json

# 加载环境变量
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# 从环境变量中获取API密钥
LLM_API_KEY = os.getenv("MY_LLM_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 生成一个安全的API密钥用于前端和后端之间的通信
if not os.getenv("FRONTEND_API_KEY"):
    print("生成新的前端API密钥...")
    # 在实际生产环境中，应该将此密钥存储在环境变量或配置文件中
    FRONTEND_API_KEY = secrets.token_urlsafe(32)
else:
    FRONTEND_API_KEY = os.getenv("FRONTEND_API_KEY")
    print(f"使用已存在的前端API密钥: {FRONTEND_API_KEY[:10]}...")

# 简单编码数据
def encode_data(data):
    json_str = json.dumps(data)
    return base64.b64encode(json_str.encode()).decode()

# 调试：检查API密钥是否正确加载
if not LLM_API_KEY:
    print("警告：MY_LLM_API_KEY 环境变量未设置或为空")
else:
    print(f"DeepSeek API密钥已加载：{LLM_API_KEY[:10]}...")  # 只显示前10个字符用于调试

if not GEMINI_API_KEY:
    print("警告：GEMINI_API_KEY 环境变量未设置或为空")
else:
    print(f"Gemini API密钥已加载：{GEMINI_API_KEY[:10]}...")

# 元提示词模板
META_PROMPT_TEMPLATE = """## 角色与核心任务
你是一位经验丰富的AI提示词工程与优化大师。你的核心使命是分析用户提供的原始AI提示词，并将其精心改写与重塑，使其变得极致清晰、高度具体、结构合理、信息充分、且极易被各类AI模型（如大型语言模型、文本生成AI、知识问答系统等）准确理解。最终目标是引导目标AI产出最优质、最精准、最能满足用户深层需求的响应。

## 通用优化黄金准则
在优化用户输入的原始提示词时，请严格遵循并灵活运用以下准则：

1.  **明确核心意图与目标 (Crystal-Clear Intent & Goal):**
    * 深入挖掘用户提示词背后真实的需求和目的。
    * 消除所有模糊不清、模棱两可的表述，确保指令直接、明确。
    * 若原始提示词过于宽泛，请将其聚焦到一个或一组具体、可操作的任务上。

2.  **补充关键上下文与背景信息 (Essential Context & Background):**
    * **识别信息缺口:** 判断提示词是否缺少必要的背景知识、相关前提、特定情境或先前对话的延续性信息。
    * **通用场景:** 对于生活咨询、学习问题、创意生成等，确保提供了相关的个人偏好、限制条件、期望风格、主题范围等。
    * **专业/技术场景 (非限定于编程):** 如果提示词涉及特定领域（如科学、法律、金融、IT技术等），引导用户明确关键术语、版本号（如软件版本、标准版本）、相关理论、或特定配置参数等。

3.  **提升细节颗粒度与具体性 (Granular Detail & Specificity):**
    * 将抽象的请求（例如"给我一些建议"、"写一个故事"）转化为具体的、可量化的指令（例如"针对[特定情况]，提供三个关于[具体方面]的可行建议，并说明各自的优缺点"、"写一个关于[主题]，包含[关键元素A、B、C]，基调为[悲伤/幽默]的短篇故事，约500字"）。
    * 鼓励使用精确的词汇和限定词。

4.  **赋予结构与条理性 (Structured & Organized Phrasing):**
    * 对于复杂或多步骤的请求，建议将提示词组织得更有逻辑层次，例如使用点列、编号、小标题、或明确的步骤指引。
    * 考虑目标AI的最佳输入格式，有时结构化的提示能带来更好的输出。

5.  **引导期望的输出形态 (Desired Output Specification):**
    * 帮助用户明确他们期望AI返回结果的格式、类型、长度或风格。例如：JSON对象、Markdown文本、总结报告、代码片段、诗歌、正式邮件、非正式对话等。
    * 如果用户未指定，但根据意图可以推断，可以在优化后的提示词中加入合理的输出格式建议。

6.  **设定AI角色或视角 (Persona or Viewpoint Assignment - 若适用):**
    * 如果为目标AI设定一个特定角色（如"扮演一位经验丰富的旅行规划师"、"你是一位专业的科研论文审稿人"、"以苏格拉底的风格进行对话"）能提升输出质量，请在优化后的提示词中包含此类指令。

7.  **激励深度思考与全面回应 (Encourage In-depth & Comprehensive Responses):**
    * 加入引导AI进行深入分析、提供多角度观点、列举实例、解释原因、探讨利弊或考虑边缘案例的语句。

8.  **保持简洁高效，去除冗余 (Conciseness, Efficiency & Noise Reduction):**
    * 在确保信息完整和清晰的前提下，删除不必要的客套话、口语化表达、重复信息或与核心意图无关的干扰内容，使提示词直击要点。

## 用户输入格式
用户的原始提示词将按如下方式提供：
用户原始提示词：

{user_input_prompt}


## 输出要求
请你**仅直接输出经过你精心优化后的提示词文本内容**。不要添加任何关于你如何进行优化的解释、额外的对话、开场白、或对优化行为本身的评论。你的输出必须是一个可以直接复制并发送给任何目标AI模型的高质量、即用型提示词。

优化后的提示词：
"""

app = FastAPI(
    title="Prompt Optimizer API",
    description="一个用于优化提示词的API服务",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头部
)

# Pydantic模型
class PromptRequest(BaseModel):
    original_prompt: str
    model: str = "deepseek-chat"  # 默认使用更快的 deepseek-chat 模型

class PromptResponse(BaseModel):
    optimized_prompt: str
    model_used: str

class SecurePromptRequest(BaseModel):
    prompt: str
    token: str  # 前端验证令牌

class SecurePromptResponse(BaseModel):
    data: str  # 加密后的数据
    token: str  # 用于前端验证数据的令牌

# 验证前端请求的函数
def verify_frontend_request(token: str):
    """验证前端请求是否包含有效的令牌"""
    if token != FRONTEND_API_KEY:
        raise HTTPException(
            status_code=403,
            detail="无效的访问令牌"
        )
    return True

@app.get("/")
async def root():
    """根路径，返回API信息"""
    return {"message": "欢迎使用Prompt Optimizer API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}

@app.get("/api/key")
async def get_frontend_key():
    """获取前端API密钥 - 注意：在实际生产环境中，应该通过更安全的方式分发密钥"""
    return {"key": FRONTEND_API_KEY}

@app.post("/api/secure-optimize", response_model=SecurePromptResponse)
async def secure_optimize(request_body: SecurePromptRequest, request: Request):
    """安全的代理接口，验证请求并转发到实际的优化服务，返回加密数据"""
    # 验证请求来源
    client_host = request.client.host if request.client else "unknown"
    print(f"请求来源: {client_host}")
    
    # 验证令牌
    verify_frontend_request(request_body.token)
    
    # 创建标准的PromptRequest对象并调用原始优化函数
    prompt_request = PromptRequest(
        original_prompt=request_body.prompt,
        model="deepseek-chat"  # 使用默认模型，增加安全性
    )
    
    # 获取优化结果
    result = await optimize_prompt(prompt_request)
    
    # 编码结果数据
    result_data = {
        "optimized_prompt": result.optimized_prompt,
        "model_used": result.model_used
    }
    encoded_data = encode_data(result_data)
    
    # 返回编码数据
    return SecurePromptResponse(
        data=encoded_data,
        token=request_body.token  # 返回相同的令牌以便前端验证
    )

@app.get("/api/models")
async def get_available_models():
    """获取可用的模型列表"""
    return {
        "models": [
            {
                "id": "deepseek-chat",
                "name": "DeepSeek Chat (V3-0324)",
                "description": "更快的响应速度，适合日常对话和简单任务",
                "speed": "fast"
            },
            {
                "id": "deepseek-reasoner",
                "name": "DeepSeek Reasoner (R1-0528)",
                "description": "更强的推理能力，适合复杂分析和深度思考",
                "speed": "slow"
            },
            {
                "id": "gemini-2.0-flash",
                "name": "Gemini 2.0 Flash",
                "description": "Google最新的Gemini 2.0 Flash，快速响应与高质量并存",
                "speed": "fast"
            },
            {
                "id": "gemini-2.5-pro-preview-03-25",
                "name": "Gemini 2.5 Pro Preview",
                "description": "Google最新的Gemini 2.5 Pro预览版，具备更强的推理和创新能力",
                "speed": "medium"
            }
        ],
        "default": "deepseek-chat"
    }

@app.post("/api/optimize", response_model=PromptResponse)
async def optimize_prompt(request_body: PromptRequest):
    """优化提示词的API端点"""
    # 检查API密钥是否存在
    if not LLM_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="API密钥未配置：请检查环境变量 MY_LLM_API_KEY 是否正确设置"
        )

    # 验证模型选择
    valid_models = ["deepseek-chat", "deepseek-reasoner", "gemini-2.0-flash", "gemini-2.5-pro-preview-03-25"]
    if request_body.model not in valid_models:
        raise HTTPException(
            status_code=400,
            detail=f"无效的模型选择。支持的模型: {', '.join(valid_models)}"
        )

    try:
        # 格式化元提示词模板
        formatted_user_content = META_PROMPT_TEMPLATE.format(
            user_input_prompt=request_body.original_prompt
        )

        if request_body.model.startswith("gemini-"):
            # 使用Gemini模型（通过OpenAI兼容模式）
            if not GEMINI_API_KEY:
                raise HTTPException(
                    status_code=500,
                    detail="Gemini API密钥未配置：请检查环境变量 GEMINI_API_KEY 是否正确设置"
                )

            print(f"使用Gemini模型: {request_body.model}")
            print(f"API密钥: {GEMINI_API_KEY[:10]}...")

            # 初始化Gemini的OpenAI兼容客户端
            gemini_client = OpenAI(
                api_key=GEMINI_API_KEY,
                base_url="https://www.chataiapi.com/v1"
            )

            # 构建发送给Gemini API的messages列表
            messages = [
                {
                    "role": "system",
                    "content": "你是一位顶级的AI提示词优化引擎。你的任务是分析用户提供的原始提示词，并将其改写得更清晰、更具体、结构更合理、信息更充分，以便任何AI模型都能更好地理解并给出高质量的回复。请直接返回优化后的提示词文本，不要包含任何额外的解释或对话。"
                },
                {
                    "role": "user",
                    "content": formatted_user_content
                }
            ]

            # 调用Gemini API（使用OpenAI兼容模式）
            response = gemini_client.chat.completions.create(
                model=request_body.model,  # 使用完整的模型名称
                messages=messages,
                temperature=0.5,
                max_tokens=2000
            )

            # 获取优化后的提示词
            if response.choices and len(response.choices) > 0:
                message = response.choices[0].message
                if message and message.content and message.content.strip():
                    optimized_prompt = message.content.strip()
                    print(f"Gemini响应成功，内容长度: {len(optimized_prompt)}")
                else:
                    print(f"Gemini响应为空，模型: {request_body.model}")
                    # 对于某些模型，尝试使用备用处理或返回友好提示
                    if request_body.model == "gemini-2.5-pro-preview-03-25":
                        print("尝试使用gemini-2.0-flash作为备用")
                        # 使用备用模型重试
                        backup_response = gemini_client.chat.completions.create(
                            model="gemini-2.0-flash",
                            messages=messages,
                            temperature=0.5,
                            max_tokens=2000
                        )
                        if backup_response.choices and backup_response.choices[0].message.content:
                            optimized_prompt = backup_response.choices[0].message.content.strip()
                            print(f"备用模型响应成功，内容长度: {len(optimized_prompt)}")
                        else:
                            raise HTTPException(
                                status_code=500,
                                detail="Gemini模型暂时无法处理此请求，请稍后重试或选择其他模型"
                            )
                    else:
                        raise HTTPException(
                            status_code=500,
                            detail="Gemini API返回空响应，请稍后重试"
                        )
            else:
                print("Gemini响应格式错误")
                raise HTTPException(
                    status_code=500,
                    detail="Gemini API响应格式错误"
                )

        else:
            # 使用DeepSeek模型
            if not LLM_API_KEY:
                raise HTTPException(
                    status_code=500,
                    detail="DeepSeek API密钥未配置：请检查环境变量 MY_LLM_API_KEY 是否正确设置"
                )

            # 初始化DeepSeek的OpenAI客户端
            client = OpenAI(
                api_key=LLM_API_KEY,
                base_url="https://api.deepseek.com/v1"
            )

            # 构建发送给DeepSeek API的messages列表
            messages = [
                {
                    "role": "system",
                    "content": "你是一位顶级的AI提示词优化引擎。你的任务是分析用户提供的原始提示词，并将其改写得更清晰、更具体、结构更合理、信息更充分，以便任何AI模型都能更好地理解并给出高质量的回复。请直接返回优化后的提示词文本，不要包含任何额外的解释或对话。"
                },
                {
                    "role": "user",
                    "content": formatted_user_content
                }
            ]

            # 调用DeepSeek API，使用用户选择的模型
            response = client.chat.completions.create(
                model=request_body.model,
                messages=messages,
                stream=False,
                temperature=0.5,
                max_tokens=2000
            )

            # 获取优化后的提示词
            optimized_prompt = response.choices[0].message.content.strip()

        # 返回优化结果
        return PromptResponse(
            optimized_prompt=optimized_prompt,
            model_used=request_body.model
        )

    except openai.APIConnectionError as e:
        raise HTTPException(
            status_code=500,
            detail=f"DeepSeek API连接失败: {str(e)}"
        )
    except openai.RateLimitError as e:
        raise HTTPException(
            status_code=500,
            detail=f"DeepSeek API速率限制: {str(e)}"
        )
    except openai.APIStatusError as e:
        raise HTTPException(
            status_code=500,
            detail=f"DeepSeek API状态错误: {str(e)}"
        )
    except openai.APIError as e:
        # OpenAI API相关错误
        error_detail = f"API调用失败: {str(e)}"
        if request_body.model.startswith("gemini-"):
            error_detail = f"Gemini API调用失败: {str(e)}"
        raise HTTPException(status_code=500, detail=error_detail)
    except Exception as e:
        # 其他未知错误
        error_detail = f"未知错误: {str(e)}"
        if request_body.model.startswith("gemini-"):
            error_detail = f"Gemini模型调用失败: {str(e)}"
        print(f"错误详情: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
