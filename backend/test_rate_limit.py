#!/usr/bin/env python3
"""
速率限制测试脚本
用于测试/api/optimize接口的速率限制功能
"""
import asyncio
import aiohttp
import time
import json


async def test_rate_limit():
    """测试速率限制功能"""
    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/api/optimize"
    
    # 测试数据
    test_data = {
        "original_prompt": "写一个Python函数",
        "model": "deepseek-chat"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("🚀 开始测试速率限制功能...")
    print(f"📍 测试端点: {endpoint}")
    print(f"⏱️  限制: 每分钟10次请求")
    print("-" * 50)
    
    async with aiohttp.ClientSession() as session:
        success_count = 0
        rate_limited_count = 0
        
        # 快速发送15个请求来测试速率限制
        for i in range(15):
            try:
                start_time = time.time()
                async with session.post(endpoint, json=test_data, headers=headers) as response:
                    end_time = time.time()
                    
                    if response.status == 200:
                        success_count += 1
                        print(f"✅ 请求 {i+1}: 成功 (耗时: {end_time-start_time:.2f}s)")
                    elif response.status == 429:
                        rate_limited_count += 1
                        response_text = await response.text()
                        print(f"🚫 请求 {i+1}: 速率限制 - {response.status}")
                        try:
                            error_data = json.loads(response_text)
                            print(f"   详情: {error_data.get('detail', response_text)}")
                        except:
                            print(f"   详情: {response_text}")
                    else:
                        print(f"❌ 请求 {i+1}: 错误 - {response.status}")
                        response_text = await response.text()
                        print(f"   详情: {response_text}")
                        
            except Exception as e:
                print(f"❌ 请求 {i+1}: 异常 - {e}")
            
            # 稍微延迟避免过快请求
            await asyncio.sleep(0.1)
    
    print("-" * 50)
    print(f"📊 测试结果:")
    print(f"   成功请求: {success_count}")
    print(f"   被限制请求: {rate_limited_count}")
    print(f"   总请求数: {success_count + rate_limited_count}")
    
    if rate_limited_count > 0:
        print("✅ 速率限制功能正常工作！")
    else:
        print("⚠️  未触发速率限制，可能需要检查配置")


if __name__ == "__main__":
    print("请确保FastAPI服务正在运行 (python -m uvicorn backend.app.main:app --reload)")
    print("按Enter键开始测试...")
    input()
    
    asyncio.run(test_rate_limit())
