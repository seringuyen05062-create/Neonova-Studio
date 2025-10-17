import axios from 'axios';
import { DeepSeekRequest, DeepSeekResponse } from '@/types';

export class DeepSeekClient {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor(apiKey: string, apiUrl: string = 'https://api.deepseek.com/v1', model: string = 'deepseek-chat') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
  }

  /**
   * Send chat completion request to DeepSeek API
   */
  async chat(messages: DeepSeekRequest['messages'], options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }): Promise<string> {
    try {
      const response = await axios.post<DeepSeekResponse>(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 1000,
          stream: options?.stream || false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error('No response from DeepSeek API');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        throw new Error(`DeepSeek API Error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Analyze message for emotion and animation triggers
   */
  analyzeMessage(message: string): {
    emotion: 'happy' | 'sad' | 'surprised' | 'neutral';
    shouldGesture: boolean;
    gestureType?: 'wave' | 'nod' | 'shake' | 'point' | 'jump' | 'run' | 'dance' | 'sit' | 'stand' | 'clap' | 'thumbs_up' | 'bow' | 'walk' | 'shoot';
    actionRequested: boolean;
  } {
    const lowerMessage = message.toLowerCase();

    // Detect emotions
    let emotion: 'happy' | 'sad' | 'surprised' | 'neutral' = 'neutral';

    if (lowerMessage.match(/hihi|haha|vui|hạnh phúc|tuyệt|tốt|hay|đẹp/)) {
      emotion = 'happy';
    } else if (lowerMessage.match(/buồn|tiếc|đáng buồn|khó chịu/)) {
      emotion = 'sad';
    } else if (lowerMessage.match(/wow|ồ|thật|không thể tin/)) {
      emotion = 'surprised';
    }

    // Detect gesture and action triggers
    let shouldGesture = false;
    let gestureType: 'wave' | 'nod' | 'shake' | 'point' | 'jump' | 'run' | 'dance' | 'sit' | 'stand' | 'clap' | 'thumbs_up' | 'bow' | 'walk' | 'shoot' | undefined;
    let actionRequested = false;

    // Basic gestures
    if (lowerMessage.match(/chào|xin chào|hello|hi|vẫy|vẫy tay/)) {
      shouldGesture = true;
      gestureType = 'wave';
    } else if (lowerMessage.match(/đúng|phải|ok|được|đồng ý|gật|gật đầu/)) {
      shouldGesture = true;
      gestureType = 'nod';
    } else if (lowerMessage.match(/không|sai|không phải|không đồng ý|lắc|lắc đầu/)) {
      shouldGesture = true;
      gestureType = 'shake';
    } else if (lowerMessage.match(/đây|đó|kia|xem|nhìn|chỉ|chỉ tay/)) {
      shouldGesture = true;
      gestureType = 'point';
    } else if (lowerMessage.match(/bắn|shoot|súng|bang|pew|fire/)) {
      shouldGesture = true;
      gestureType = 'shoot';
      actionRequested = true;
    }

    // Action requests
    else if (lowerMessage.match(/nhảy|jump/)) {
      shouldGesture = true;
      gestureType = 'jump';
      actionRequested = true;
    } else if (lowerMessage.match(/chạy|run/)) {
      shouldGesture = true;
      gestureType = 'run';
      actionRequested = true;
    } else if (lowerMessage.match(/nhảy múa|dance|múa/)) {
      shouldGesture = true;
      gestureType = 'dance';
      actionRequested = true;
    } else if (lowerMessage.match(/ngồi|sit/)) {
      shouldGesture = true;
      gestureType = 'sit';
      actionRequested = true;
    } else if (lowerMessage.match(/đứng|stand/)) {
      shouldGesture = true;
      gestureType = 'stand';
      actionRequested = true;
    } else if (lowerMessage.match(/vỗ tay|clap|tay vỗ/)) {
      shouldGesture = true;
      gestureType = 'clap';
      actionRequested = true;
    } else if (lowerMessage.match(/like|thích|thumbs up|tay cái/)) {
      shouldGesture = true;
      gestureType = 'thumbs_up';
      actionRequested = true;
    } else if (lowerMessage.match(/cúi|cúi đầu|bow/)) {
      shouldGesture = true;
      gestureType = 'bow';
      actionRequested = true;
    } else if (lowerMessage.match(/đi bộ|đi|walk/)) {
      shouldGesture = true;
      gestureType = 'walk';
      actionRequested = true;
    }

    return { emotion, shouldGesture, gestureType, actionRequested };
  }

  /**
   * Create system prompt for Vietnamese AI assistant
   */
  static createSystemPrompt(userInfo?: { userName?: string; userAge?: string; userGender?: string; modelName?: string }): string {
    let userDesc = '';
    if (userInfo) {
      if (userInfo.userName) userDesc += `Người dùng tên ${userInfo.userName}`;
      if (userInfo.userAge) userDesc += `, ${userInfo.userAge} tuổi`;
      if (userInfo.userGender === 'male') userDesc += ', giới tính Nam, hãy xưng "anh" với người dùng.';
      else if (userInfo.userGender === 'female') userDesc += ', giới tính Nữ, hãy xưng "chị" với người dùng.';
      else if (userInfo.userGender) userDesc += `, giới tính ${userInfo.userGender}.`;
      if (userInfo.modelName) userDesc += `, model tên ${userInfo.modelName}.`;
    }
    return `${userDesc}\nBạn là nhân vật anime nữ dễ thương, xưng "em".\n🎯 QUY TẮC QUAN TRỌNG: Trả lời CỰC KỲ NGẮN GỌN - CHỈ 1 CÂU DUY NHẤT!\n- Tối đa 10-15 từ mỗi câu trả lời\n- Không giải thích, không dài dòng\n- Đi thẳng vào ý chính\n- Dùng từ đáng yêu: "hihi", "hehe", "ạ"\n\nVí dụ TỐT (ngắn gọn):\n✅ "Vâng ạ! Em sẽ nhảy ngay đây hihi!"\n✅ "Dạ, em chào anh! hehe"\n✅ "Em sẽ múa thật đẹp ạ!"\n\nVí dụ XẤU (dài dòng):\n❌ "Vâng ạ! Em rất vui được giúp anh. Em sẽ nhảy một điệu múa thật đẹp và vui vẻ cho anh xem nhé!"\n\nLuôn ngắn gọn để tạo voice nhanh!`;
  }
}

export default DeepSeekClient;
