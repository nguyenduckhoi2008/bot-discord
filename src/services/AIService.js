const Groq = require('groq-sdk');
const config = require('../config/config');

class AIService {
  constructor() {
    this.groq = new Groq({
      apiKey: config.GROQ_API_KEY
    });
  }

  async generateTriviaQuestion(topic = 'general') {
    try {
      const prompt = `Tạo một câu đố vui bằng tiếng Việt về chủ đề ${topic}. 
      Trả về JSON với format:
      {
        "question": "câu hỏi",
        "answers": ["đáp án 1", "đáp án 2", "đáp án 3"],
        "correctAnswer": "đáp án đúng"
      }
      Chỉ trả về JSON, không thêm gì khác.`;

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-70b-versatile',
        temperature: 0.8,
        max_tokens: 500
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const cleanContent = content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('AI Error:', error);
      return {
        question: 'Thủ đô của Việt Nam là gì?',
        answers: ['hanoi', 'hà nội', 'ha noi'],
        correctAnswer: 'Hà Nội'
      };
    }
  }

  async generateWordChainWord(previousWord) {
    try {
      const lastChar = previousWord.slice(-1);
      const prompt = `Cho từ tiếng Việt bắt đầu bằng chữ "${lastChar}". Chỉ trả về MỘT từ duy nhất, không giải thích.`;

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 50
      });

      return completion.choices[0]?.message?.content.trim() || 'con';
    } catch (error) {
      console.error('AI Word Chain Error:', error);
      return 'con';
    }
  }

  async evaluateCreativeAnswer(question, answer) {
    try {
      const prompt = `Đánh giá câu trả lời sáng tạo (0-10 điểm):
      Câu hỏi: ${question}
      Trả lời: ${answer}
      Chỉ trả về số điểm, không giải thích.`;

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 10
      });

      const score = parseInt(completion.choices[0]?.message?.content.trim());
      return isNaN(score) ? 5 : Math.min(Math.max(score, 0), 10);
    } catch (error) {
      return 5;
    }
  }
}

module.exports = new AIService();