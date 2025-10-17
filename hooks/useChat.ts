'use client';

import { useState, useCallback } from 'react';
import { Message } from '@/types';
import axios from 'axios';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return null;

    // Add user message
    addMessage('user', content);
    setIsLoading(true);

    // Lấy thông tin user từ localStorage
    let userInfo = {};
    try {
      const info = localStorage.getItem('userInfo');
      if (info) userInfo = JSON.parse(info);
    } catch {}

    try {
      // Send to API
      const response = await axios.post('/api/chat', {
        messages: [
          {
            role: 'system',
            content: require('@/lib/deepseek-client').DeepSeekClient.createSystemPrompt(userInfo),
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ],
      });

      const { message, analysis } = response.data;

      // Add assistant message
      const assistantMessage = addMessage('assistant', message);

      return {
        message: assistantMessage,
        analysis,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('assistant', 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
