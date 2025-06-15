#!/usr/bin/env python3
"""
测试专家模式后端支持
"""
import requests
import json
import sys

def test_expert_mode_support():
    """测试专家模式后端支持"""
    print("🔧 测试专家模式后端支持...")
    
    # 测试数据
    test_data = {
        "original_prompt": "我想学习一门新的编程语言",
        "model": "gemini-2.0-flash",
        "mode": "expert"
    }
    
    # API端点（根据你的部署环境调整）
    # 本地测试
    local_url = "http://localhost:8000/api/optimize"
    # Vercel部署测试 - 替换为你的实际域名
    # vercel_url = "https://你的域名/api/optimize"
    
    urls_to_test = [
        ("本地环境", local_url),
        # ("Vercel部署", vercel_url),  # 取消注释并替换实际URL
    ]
    
    for env_name, url in urls_to_test:
        print(f"\n📡 测试 {env_name}: {url}")
        
        try:
            response = requests.post(
                url,
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ 请求成功!")
                print(f"优化后的提示词: {result.get('optimized_prompt', '未获取到')[:100]}...")
                print(f"使用的模型: {result.get('model_used', '未知')}")
            else:
                print(f"❌ 请求失败")
                print(f"错误信息: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ 连接失败 - {env_name}服务器不可达")
        except requests.exceptions.Timeout:
            print(f"❌ 请求超时 - {env_name}响应时间过长")
        except Exception as e:
            print(f"❌ 未知错误: {str(e)}")

def test_constants():
    """测试常量文件中的expert模式支持"""
    print("\n🔧 测试常量文件中的expert模式支持...")
    
    try:
        # 添加路径以便导入backend模块
        sys.path.append('/Users/sk/Desktop/我的项目/prompt-optimizer-mvp/backend')
        from app.constants import get_prompt_template_by_mode
        
        # 测试expert模式
        expert_template = get_prompt_template_by_mode("expert")
        print(f"Expert模式模板: {expert_template}")
        
        if expert_template == "{user_input_prompt}":
            print("✅ Expert模式模板正确 - 直接返回用户输入")
        else:
            print("❌ Expert模式模板异常")
            
        # 测试其他模式是否仍然正常
        general_template = get_prompt_template_by_mode("general")
        if "{user_input_prompt}" in general_template:
            print("✅ General模式模板正常")
        else:
            print("❌ General模式模板异常")
            
    except ImportError as e:
        print(f"❌ 无法导入backend模块: {e}")
        print("请确保在正确的目录中运行此脚本")
    except Exception as e:
        print(f"❌ 测试常量时发生错误: {e}")

def main():
    print("🎯 专家模式后端支持测试")
    print("=" * 50)
    
    # 测试常量文件
    test_constants()
    
    # 测试API调用
    test_expert_mode_support()
    
    print("\n" + "=" * 50)
    print("✅ 测试完成!")
    print("\n📋 确认清单:")
    print("□ 后端constants.py支持expert模式")
    print("□ API能正确处理expert模式请求")
    print("□ 前端expertInterviewManager已初始化")
    print("□ 前端能正确调用后端API")

if __name__ == "__main__":
    main()