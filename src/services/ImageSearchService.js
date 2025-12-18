const axios = require('axios');
const cheerio = require('cheerio');

class ImageSearchService {
  async searchImage(keyword) {
    try {
      // Sử dụng Unsplash (free, không cần API key)
      const response = await axios.get(`https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)}`);
      return response.request.res.responseUrl;
    } catch (error) {
      // Fallback: Picsum (random images)
      return `https://picsum.photos/seed/${keyword}/800/600`;
    }
  }

  async getRandomImageChallenge() {
    const challenges = [
      { keyword: 'cat', hint: '🐱', answer: ['mèo', 'cat', 'con mèo'] },
      { keyword: 'dog', hint: '🐶', answer: ['chó', 'dog', 'con chó'] },
      { keyword: 'mountain', hint: '⛰️', answer: ['núi', 'mountain', 'đỉnh núi'] },
      { keyword: 'beach', hint: '🏖️', answer: ['biển', 'beach', 'bãi biển'] },
      { keyword: 'coffee', hint: '☕', answer: ['cà phê', 'coffee', 'cafe'] },
      { keyword: 'sunset', hint: '🌅', answer: ['hoàng hôn', 'sunset', 'bình minh'] },
      { keyword: 'flower', hint: '🌸', answer: ['hoa', 'flower'] },
      { keyword: 'car', hint: '🚗', answer: ['xe', 'car', 'ô tô', 'xe hơi'] },
      { keyword: 'book', hint: '📚', answer: ['sách', 'book'] },
      { keyword: 'pizza', hint: '🍕', answer: ['pizza', 'bánh pizza'] }
    ];

    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    const imageUrl = await this.searchImage(challenge.keyword);
    
    return {
      imageUrl,
      hint: challenge.hint,
      answers: challenge.answer
    };
  }
}

module.exports = new ImageSearchService();