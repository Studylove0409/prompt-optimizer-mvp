#!/usr/bin/env python3
"""
测试快速选择选项生成API和思考模式完整流程
"""
import asyncio
import json
import aiohttp

async def test_thinking_mode_complete_flow():
    """测试思考模式完整流程：分析 -> 生成选项 -> 优化"""
    
    print("🧪 开始测试思考模式完整流程...")
    
    # 第一步：测试思考模式分析
    print("\n📋 第一步：测试思考模式分析")
    analyze_request = {
        "original_prompt": "写一个产品介绍",
        "model": "gemini-2.0-flash",
        "mode": "thinking"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                'http://localhost:8000/api/thinking/analyze',
                json=analyze_request,
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    analysis_result = await response.json()
                    print(f"✅ 分析成功，获得 {len(analysis_result['analysis_result'])} 个关键信息点:")
                    
                    # 第二步：为每个字段生成快速选项
                    print("\n🚀 第二步：为每个字段生成AI快速选项")
                    options_results = {}
                    
                    for i, item in enumerate(analysis_result['analysis_result']):
                        print(f"\n  字段 {i+1}: {item['key']}")
                        print(f"  问题: {item['question']}")
                        
                        # 生成快速选项
                        options_request = {
                            "field_key": item['key'],
                            "question": item['question'],
                            "model": "gemini-2.0-flash"
                        }
                        
                        try:
                            async with session.post(
                                'http://localhost:8000/api/generate-quick-options',
                                json=options_request,
                                headers={'Content-Type': 'application/json'}
                            ) as options_response:
                                if options_response.status == 200:
                                    options_result = await options_response.json()
                                    print(f"  ✅ 生成选项: {options_result['options']}")
                                    options_results[item['key']] = options_result['options'][0]  # 使用第一个选项
                                else:
                                    error_text = await options_response.text()
                                    print(f"  ❌ 选项生成失败 {options_response.status}: {error_text}")
                                    options_results[item['key']] = "用户需要手动输入"
                        except Exception as e:
                            print(f"  ❌ 选项生成异常: {e}")
                            options_results[item['key']] = "网络错误"
                        
                        await asyncio.sleep(0.5)  # 避免请求过快
                    
                    # 第三步：使用补充信息优化原始提示词
                    print("\n🎯 第三步：使用补充信息优化原始提示词")
                    optimize_request = {
                        "original_prompt": analyze_request["original_prompt"],
                        "additional_info": options_results,
                        "model": "gemini-2.0-flash"
                    }
                    
                    try:
                        async with session.post(
                            'http://localhost:8000/api/thinking/optimize',
                            json=optimize_request,
                            headers={'Content-Type': 'application/json'}
                        ) as optimize_response:
                            if optimize_response.status == 200:
                                optimize_result = await optimize_response.json()
                                print(f"✅ 最终优化成功!")
                                print(f"📝 原始提示词: {analyze_request['original_prompt']}")
                                print(f"📝 补充信息: {json.dumps(options_results, ensure_ascii=False, indent=2)}")
                                print(f"📝 优化后提示词: {optimize_result['optimized_prompt'][:200]}...")
                                return True
                            else:
                                error_text = await optimize_response.text()
                                print(f"❌ 最终优化失败 {optimize_response.status}: {error_text}")
                                return False
                    except Exception as e:
                        print(f"❌ 最终优化异常: {e}")
                        return False
                        
                else:
                    error_text = await response.text()
                    print(f"❌ 思考模式分析失败 {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ 思考模式分析异常: {e}")
            return False

async def test_quick_options_only():
    """测试快速选择选项生成（独立测试）"""
    print("\n🎯 独立测试快速选项生成功能...")
    
    # 测试数据
    test_cases = [
        {
            "field_key": "target_audience", 
            "question": "您的目标用户群体是什么？请描述他们的基本特征",
            "model": "gemini-2.0-flash"
        },
        {
            "field_key": "content_style", 
            "question": "您希望内容采用什么样的风格和语调？",
            "model": "gemini-2.0-flash"
        },
        {
            "field_key": "difficulty_level", 
            "question": "内容的难度级别应该如何设定？",
            "model": "gemini-2.0-flash"
        }
    ]
    
    async with aiohttp.ClientSession() as session:
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n=== 测试案例 {i} ===")
            print(f"字段：{test_case['field_key']}")
            print(f"问题：{test_case['question']}")
            
            try:
                async with session.post(
                    'http://localhost:8000/api/generate-quick-options',
                    json=test_case,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"生成的选项：{result['options']}")
                    else:
                        error_text = await response.text()
                        print(f"错误 {response.status}: {error_text}")
                        
            except Exception as e:
                print(f"请求失败: {e}")
                
            # 等待一秒避免请求过快
            await asyncio.sleep(1)

async def main():
    """主测试函数"""
    print("🚀 开始测试Gemini快速选项生成系统")
    print("=" * 60)
    
    # 测试完整流程
    success = await test_thinking_mode_complete_flow()
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 思考模式完整流程测试成功！")
    else:
        print("\n" + "=" * 60)
        print("⚠️ 思考模式流程测试失败，执行独立测试...")
        await test_quick_options_only()
    
    print("\n✅ 所有测试完成")

if __name__ == "__main__":
    asyncio.run(main())