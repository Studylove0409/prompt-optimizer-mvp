#!/usr/bin/env python3
"""
测试新的级联问答API端点
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_next_question_endpoint():
    """测试获取下一个问题的API端点"""
    print("🔗 测试 /thinking/next-question 端点...")
    
    # 测试数据
    test_data = {
        "original_prompt": "帮我写一个产品介绍",
        "conversation_history": [],
        "model": "deepseek-chat"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/thinking/next-question", 
                               json=test_data, 
                               headers={"Content-Type": "application/json"})
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API调用成功!")
            print(f"有下一个问题: {data['has_next_question']}")
            if data['question']:
                print(f"问题: {data['question']['question']}")
                print(f"类型: {data['question']['type']}")
                print(f"重要性: {data['question']['importance']}")
                if data['question']['options']:
                    print(f"选项: {data['question']['options']}")
            print(f"进度: {data['progress']}")
            print(f"可以完成: {data['can_finalize']}")
            
            return data
        else:
            print(f"❌ API调用失败: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 请求错误: {e}")
        return None

def test_next_question_with_history():
    """测试有对话历史的情况"""
    print("\n🔗 测试带对话历史的 /thinking/next-question 端点...")
    
    # 测试数据 - 包含对话历史
    test_data = {
        "original_prompt": "帮我写一个产品介绍",
        "conversation_history": [
            {
                "question": "你希望这个提示词主要面向什么类型的用户？",
                "answer": "商务人士",
                "importance": "high"
            }
        ],
        "model": "deepseek-chat"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/thinking/next-question", 
                               json=test_data, 
                               headers={"Content-Type": "application/json"})
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API调用成功!")
            print(f"有下一个问题: {data['has_next_question']}")
            if data['question']:
                print(f"问题: {data['question']['question']}")
                print(f"类型: {data['question']['type']}")
            print(f"进度: {data['progress']}")
            print(f"可以完成: {data['can_finalize']}")
            
            return data
        else:
            print(f"❌ API调用失败: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 请求错误: {e}")
        return None

def test_finalize_endpoint():
    """测试完成优化的API端点"""
    print("\n🔗 测试 /thinking/finalize 端点...")
    
    # 测试数据 - 完整的对话历史
    test_data = {
        "original_prompt": "帮我写一个产品介绍",
        "conversation_history": [
            {
                "question": "你希望这个提示词主要面向什么类型的用户？",
                "answer": "商务人士",
                "importance": "high"
            },
            {
                "question": "你希望通过这个提示词实现什么核心目标？",
                "answer": "创建一个吸引人的产品描述来提高销售转化率",
                "importance": "high"
            }
        ],
        "model": "deepseek-chat"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/thinking/finalize", 
                               json=test_data, 
                               headers={"Content-Type": "application/json"})
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API调用成功!")
            print(f"使用的模型: {data['model_used']}")
            print(f"优化后的提示词 (前100字符): {data['optimized_prompt'][:100]}...")
            
            return data
        else:
            print(f"❌ API调用失败: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 请求错误: {e}")
        return None

def test_models_endpoint():
    """测试模型列表端点"""
    print("\n🔗 测试 /models 端点...")
    
    try:
        response = requests.get(f"{BASE_URL}/models")
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 模型列表获取成功!")
            print(f"可用模型数: {len(data['models'])}")
            print(f"默认模型: {data['default']}")
            
            return data
        else:
            print(f"❌ 获取模型列表失败: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 请求错误: {e}")
        return None

if __name__ == "__main__":
    print("🚀 开始测试级联问答API端点...")
    
    # 测试模型列表
    test_models_endpoint()
    
    # 测试获取第一个问题
    first_response = test_next_question_endpoint()
    
    # 测试带历史的问题获取
    second_response = test_next_question_with_history()
    
    # 测试完成优化
    final_response = test_finalize_endpoint()
    
    print("\n🎉 API端点测试完成!")
    
    if all([first_response, second_response, final_response]):
        print("✅ 所有测试通过!")
    else:
        print("❌ 部分测试失败，请检查服务器日志")