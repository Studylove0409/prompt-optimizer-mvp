#!/usr/bin/env python3
"""
测试级联问答API的脚本
"""
import asyncio
import json
from backend.app.services.cascading_question_service import CascadingQuestionService
from backend.app.models import ConversationHistoryItem

async def test_cascading_question_service():
    """测试级联问题服务"""
    print("🧪 测试级联问题服务...")
    
    service = CascadingQuestionService()
    
    # 测试1: 分析简单提示词需要的信息
    print("\n📝 测试1: 分析提示词需要的信息")
    original_prompt = "帮我写一个产品介绍"
    needed_info = service.analyze_prompt_needs(original_prompt)
    print(f"原始提示词: {original_prompt}")
    print(f"需要补充的信息: {needed_info}")
    
    # 测试2: 获取第一个问题
    print("\n❓ 测试2: 获取第一个问题")
    response = service.get_next_question(original_prompt, [])
    print(f"有下一个问题: {response.has_next_question}")
    if response.question:
        print(f"问题: {response.question.question}")
        print(f"类型: {response.question.type}")
        print(f"重要性: {response.question.importance}")
        if response.question.options:
            print(f"选项: {response.question.options}")
    print(f"进度: {response.progress}")
    print(f"可以完成: {response.can_finalize}")
    print(f"AI推理: {response.reasoning}")
    
    # 测试3: 模拟回答并获取下一个问题
    print("\n💬 测试3: 模拟对话流程")
    conversation_history = []
    
    # 第一个回答
    conversation_history.append(ConversationHistoryItem(
        question="你希望这个提示词主要面向什么类型的用户？",
        answer="开发者/程序员",
        importance="high"
    ))
    
    response2 = service.get_next_question(original_prompt, conversation_history)
    print(f"回答后，有下一个问题: {response2.has_next_question}")
    if response2.question:
        print(f"下一个问题: {response2.question.question}")
        print(f"类型: {response2.question.type}")
    print(f"进度: {response2.progress}")
    print(f"可以完成: {response2.can_finalize}")
    
    # 第二个回答
    conversation_history.append(ConversationHistoryItem(
        question="你希望通过这个提示词实现什么核心目标？",
        answer="创建一个吸引人的产品描述来提高销售转化率",
        importance="high"
    ))
    
    response3 = service.get_next_question(original_prompt, conversation_history)
    print(f"第二次回答后，有下一个问题: {response3.has_next_question}")
    if response3.question:
        print(f"第三个问题: {response3.question.question}")
    print(f"进度: {response3.progress}")
    print(f"可以完成: {response3.can_finalize}")
    
    print("\n✅ 级联问题服务测试完成!")

def test_question_bank():
    """测试问题库"""
    print("\n📚 测试问题库...")
    
    service = CascadingQuestionService()
    
    print(f"问题库中有 {len(service.question_bank)} 个问题:")
    for key, question in service.question_bank.items():
        print(f"  - {key}: {question.question[:50]}...")
        print(f"    类型: {question.type}, 重要性: {question.importance}")
        if question.options:
            print(f"    选项数: {len(question.options)}")
    
    print("\n✅ 问题库测试完成!")

def test_dependencies():
    """测试问题依赖关系"""
    print("\n🔗 测试问题依赖关系...")
    
    service = CascadingQuestionService()
    
    print("依赖关系:")
    for parent, children in service.question_dependencies.items():
        print(f"  {parent}:")
        for condition, follow_ups in children.items():
            print(f"    如果回答 '{condition}' -> 追问: {follow_ups}")
    
    print("\n✅ 依赖关系测试完成!")

if __name__ == "__main__":
    print("🚀 开始测试级联问答系统...")
    
    test_question_bank()
    test_dependencies()
    asyncio.run(test_cascading_question_service())
    
    print("\n🎉 所有测试完成!")