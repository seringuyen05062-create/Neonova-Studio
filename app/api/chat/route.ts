import { NextRequest, NextResponse } from 'next/server';
import { DeepSeekClient } from '@/lib/deepseek-client';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    const client = new DeepSeekClient(apiKey);

    // Add system prompt if not present
    const messagesWithSystem = messages[0]?.role === 'system' 
      ? messages 
      : [
          { role: 'system', content: DeepSeekClient.createSystemPrompt() },
          ...messages
        ];

    const response = await client.chat(messagesWithSystem, {
      temperature: 0.7,
      max_tokens: 150, // Giảm xuống 150 để câu trả lời ngắn gọn hơn, tạo voice nhanh hơn
    });

    // Analyze response for animations
    const analysis = client.analyzeMessage(response);

    return NextResponse.json({
      message: response,
      analysis,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
