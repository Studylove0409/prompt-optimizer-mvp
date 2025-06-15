#!/usr/bin/env python3
"""
智能访谈模式快速测试脚本
用于验证API端点是否正常工作
"""

import json
import requests
import time

# 配置
API_BASE_URL = "http://localhost:8000/api"
TEST_CASES = [
    "帮我写个市场分析报告",
    "创建一个创业项目的商业计划书", 
    "设计一个在线教育平台",
    "写一篇关于人工智能的学术论文",
    "制定数字营销策略"
]

def test_analyze_api(idea):
    """测试分析器API"""
    print(f"\n🔍 测试分析器API: {idea}")
    
    payload = {
        "original_idea": idea,
        "model": "gemini-2.0-flash"
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{API_BASE_URL}/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        end_time = time.time()
        
        print(f"⏱️ 响应时间: {end_time - start_time:.2f}秒")
        print(f"📊 HTTP状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            questions = data.get("questions", [])
            summary = data.get("summary", "")
            
            print(f"✅ 分析成功！")
            print(f"📝 生成问题数: {len(questions)}")
            print(f"📄 总结: {summary[:100]}...")
            
            # 显示问题列表
            for i, q in enumerate(questions):
                print(f"   {i+1}. {q.get('question', 'N/A')}")
            
            return data
        else:
            print(f"❌ 分析失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("⏰ 请求超时")
        return None
    except requests.exceptions.ConnectionError:
        print("🔌 连接失败 - 请确认后端服务正在运行")
        return None
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
        return None

def test_synthesize_api(idea, analysis_data):
    """测试合成器API"""
    print(f"\n🔧 测试合成器API...")
    
    # 生成模拟用户答案
    questions = analysis_data.get("questions", [])
    user_answers = {}
    
    for q in questions:
        key = q.get("key", "")
        if "target" in key or "market" in key:
            user_answers[key] = "中国一线城市的25-35岁白领群体"
        elif "goal" in key or "objective" in key:
            user_answers[key] = "提高市场竞争力和用户满意度"
        elif "business" in key or "type" in key:
            user_answers[key] = "科技创新类项目"
        else:
            user_answers[key] = "这是一个测试回答，用于验证系统功能"
    
    payload = {
        "original_idea": idea,
        "user_answers": user_answers,
        "model": "gemini-2.0-flash"
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{API_BASE_URL}/synthesize",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        end_time = time.time()
        
        print(f"⏱️ 响应时间: {end_time - start_time:.2f}秒")
        print(f"📊 HTTP状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            optimized_prompt = data.get("optimized_prompt", "")
            
            print(f"✅ 合成成功！")
            print(f"📏 提示词长度: {len(optimized_prompt)} 字符")
            print(f"📝 提示词预览: {optimized_prompt[:200]}...")
            
            return data
        else:
            print(f"❌ 合成失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("⏰ 请求超时")
        return None
    except requests.exceptions.ConnectionError:
        print("🔌 连接失败")
        return None
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
        return None

def test_full_flow(idea):
    """测试完整流程"""
    print(f"\n🚀 测试完整流程: {idea}")
    print("=" * 50)
    
    # 第一阶段：分析
    analysis_data = test_analyze_api(idea)
    if not analysis_data:
        print("❌ 分析阶段失败，终止测试")
        return False
    
    time.sleep(1)  # 短暂延迟
    
    # 第三阶段：合成
    synthesis_data = test_synthesize_api(idea, analysis_data)
    if not synthesis_data:
        print("❌ 合成阶段失败")
        return False
    
    print("\n✅ 完整流程测试成功！")
    return True

def main():
    """主测试函数"""
    print("🧠 智能访谈模式 - 快速测试工具")
    print("=" * 60)
    
    # 检查服务器连接
    try:
        response = requests.get(f"{API_BASE_URL.replace('/api', '')}/", timeout=5)
        print(f"🌐 服务器连接: ✅ (状态码: {response.status_code})")
    except:
        print("🌐 服务器连接: ❌")
        print("请确认后端服务正在运行在 http://localhost:8000")
        return
    
    # 运行测试用例
    success_count = 0
    total_count = len(TEST_CASES)
    
    for i, test_case in enumerate(TEST_CASES):
        print(f"\n📋 测试用例 {i+1}/{total_count}")
        success = test_full_flow(test_case)
        if success:
            success_count += 1
        
        if i < total_count - 1:
            print("\n⏳ 等待3秒后继续下个测试...")
            time.sleep(3)
    
    # 输出结果统计
    print("\n" + "=" * 60)
    print(f"📊 测试结果统计:")
    print(f"   成功: {success_count}/{total_count}")
    print(f"   成功率: {success_count/total_count*100:.1f}%")
    
    if success_count == total_count:
        print("🎉 所有测试通过！智能访谈模式工作正常")
    else:
        print("⚠️ 部分测试失败，请检查错误信息")

if __name__ == "__main__":
    main()