const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const AIService = require('../services/AIService');
const ImageSearchService = require('../services/ImageSearchService');
const MusicService = require('../services/MusicService');

class EventTypes {
  static events = [
    {
      type: 'ai_trivia',
      name: '🤖 AI Trivia Quiz',
      weight: 25,
      async execute(channel, onlineMembers) {
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        
        const embed = new EmbedBuilder()
          .setTitle('🤖 AI ĐANG TẠO CÂU HỎI...')
          .setDescription(`${mentions}\n\n⏳ Chờ chút nhé...`)
          .setColor('#FFD700');
        
        const msg = await channel.send({ embeds: [embed] });
        
        // AI tạo câu hỏi
        const question = await AIService.generateTriviaQuestion('Việt Nam');
        
        const questionEmbed = new EmbedBuilder()
          .setTitle('🤖 AI TRIVIA QUIZ!')
          .setDescription(`${mentions}\n\n**Câu hỏi:** ${question.question}\n\n⏰ Trả lời trong 30 giây!`)
          .setColor('#00FF00')
          .setFooter({ text: 'Được tạo bởi AI ✨' });
        
        await msg.edit({ embeds: [questionEmbed] });
        
        const filter = m => 
          !m.author.bot && 
          onlineMembers.includes(m.author.id) &&
          question.answers.some(ans => 
            m.content.toLowerCase().includes(ans.toLowerCase())
          );
        
        try {
          const collected = await channel.awaitMessages({ 
            filter, 
            max: 1, 
            time: 30000, 
            errors: ['time'] 
          });
          
          const winner = collected.first();
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('🎉 ĐÚNG RỒI!')
              .setDescription(`**${winner.author}** trả lời đúng!\n\n💡 Đáp án: **${question.correctAnswer}**`)
              .setColor('#00FF00')]
          });
          return [winner.author.id];
        } catch {
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('⏰ HẾT GIỜ!')
              .setDescription(`Đáp án đúng là: **${question.correctAnswer}**`)
              .setColor('#FF0000')]
          });
          return [];
        }
      }
    },

    {
      type: 'image_guess',
      name: '🖼️ Đoán Ảnh',
      weight: 20,
      async execute(channel, onlineMembers) {
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        
        const loadingEmbed = new EmbedBuilder()
          .setTitle('🖼️ ĐANG TẢI ẢNH...')
          .setDescription(`${mentions}\n\n⏳ Đợi tí nhé...`)
          .setColor('#3498DB');
        
        const msg = await channel.send({ embeds: [loadingEmbed] });
        
        // Lấy ảnh challenge
        const challenge = await ImageSearchService.getRandomImageChallenge();
        
        const embed = new EmbedBuilder()
          .setTitle('🖼️ ĐOÁN ẢNH NÀY LÀ GÌ?')
          .setDescription(`${mentions}\n\n**Gợi ý:** ${challenge.hint}\n\n⏰ 45 giây để đoán!`)
          .setImage(challenge.imageUrl)
          .setColor('#E74C3C')
          .setFooter({ text: 'Nhìn kỹ và đoán nhé! 👀' });
        
        await msg.edit({ embeds: [embed] });
        
        const filter = m => 
          !m.author.bot && 
          onlineMembers.includes(m.author.id) &&
          challenge.answers.some(ans => 
            m.content.toLowerCase().includes(ans.toLowerCase())
          );
        
        try {
          const collected = await channel.awaitMessages({ 
            filter, 
            max: 1, 
            time: 45000, 
            errors: ['time'] 
          });
          
          const winner = collected.first();
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('🎉 ĐÚNG RỒI!')
              .setDescription(`**${winner.author}** đoán đúng rồi!\n\n✅ Đáp án: **${challenge.answers[0]}**`)
              .setColor('#00FF00')
              .setThumbnail(challenge.imageUrl)]
          });
          return [winner.author.id];
        } catch {
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('⏰ HẾT GIỜ!')
              .setDescription(`Đáp án đúng là: **${challenge.answers[0]}** ${challenge.hint}`)
              .setColor('#FF0000')]
          });
          return [];
        }
      }
    },

    {
      type: 'music_guess',
      name: '🎵 Đoán Bài Hát',
      weight: 20,
      async execute(channel, onlineMembers) {
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        const song = MusicService.getRandomSong();
        const songUrl = MusicService.getSongUrl(song.youtubeId);
        
        const embed = new EmbedBuilder()
          .setTitle('🎵 ĐOÁN BÀI HÁT!')
          .setDescription(`${mentions}\n\n🎧 Nghe đoạn nhạc dưới đây và đoán tên bài hát!\n\n[▶️ CLICK ĐỂ NGHE](${songUrl})\n\n⏰ 60 giây để đoán!`)
          .setColor('#9B59B6')
          .setFooter({ text: `Ca sĩ: ${song.artist} 🎤` })
          .setThumbnail('https://i.imgur.com/5KwAqYm.png');
        
        await channel.send({ embeds: [embed] });
        
        const filter = m => 
          !m.author.bot && 
          onlineMembers.includes(m.author.id) &&
          song.answers.some(ans => 
            m.content.toLowerCase().includes(ans.toLowerCase())
          );
        
        try {
          const collected = await channel.awaitMessages({ 
            filter, 
            max: 1, 
            time: 60000, 
            errors: ['time'] 
          });
          
          const winner = collected.first();
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('🎉 ĐÚNG RỒI!')
              .setDescription(`**${winner.author}** đoán đúng!\n\n🎵 Bài hát: **${song.name}**\n🎤 Ca sĩ: **${song.artist}**`)
              .setColor('#00FF00')
              .setURL(songUrl)]
          });
          return [winner.author.id];
        } catch {
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('⏰ HẾT GIỜ!')
              .setDescription(`Đáp án: **${song.name}** - ${song.artist}\n\n[🎵 Nghe lại](${songUrl})`)
              .setColor('#FF0000')]
          });
          return [];
        }
      }
    },

    {
      type: 'ai_word_chain',
      name: '🔗 Nối Từ vs AI',
      weight: 15,
      async execute(channel, onlineMembers) {
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        let currentWord = 'game';
        let usedWords = new Set([currentWord]);
        let players = new Map();
        
        const embed = new EmbedBuilder()
          .setTitle('🔗 NỐI TỪ vs AI!')
          .setDescription(`${mentions}\n\n**Từ đầu tiên:** ${currentWord}\n\nNối từ bắt đầu bằng chữ "${currentWord.slice(-1)}"!\n⏰ 2 phút! AI sẽ chơi cùng!`)
          .setColor('#9B59B6')
          .setFooter({ text: 'Không được lặp từ đã nói!' });
        
        await channel.send({ embeds: [embed] });
        
        const filter = m => !m.author.bot && onlineMembers.includes(m.author.id);
        const collector = channel.createMessageCollector({ filter, time: 120000 });
        
        collector.on('collect', async (m) => {
          const word = m.content.trim().toLowerCase();
          const lastChar = currentWord.slice(-1);
          
          if (!word.startsWith(lastChar)) {
            return m.react('❌');
          }
          
          if (usedWords.has(word)) {
            return m.react('🔁');
          }
          
          usedWords.add(word);
          players.set(m.author.id, (players.get(m.author.id) || 0) + 1);
          currentWord = word;
          await m.react('✅');
          
          // AI chơi sau 2-3 giây
          setTimeout(async () => {
            const aiWord = await AIService.generateWordChainWord(currentWord);
            if (!usedWords.has(aiWord.toLowerCase())) {
              usedWords.add(aiWord.toLowerCase());
              currentWord = aiWord.toLowerCase();
              await channel.send(`🤖 AI: **${aiWord}**`);
            }
          }, 2000 + Math.random() * 1000);
        });
        
        collector.on('end', async () => {
          const rankings = Array.from(players.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
          
          const resultEmbed = new EmbedBuilder()
            .setTitle('🏆 KẾT QUẢ NỐI TỪ!')
            .setDescription(
              rankings.length > 0
                ? rankings.map((([id, count], i) => `${i + 1}. <@${id}>: **${count}** từ`)).join('\n')
                : 'Không ai chơi!'
            )
            .setColor('#FFD700')
            .setFooter({ text: `Tổng ${usedWords.size} từ đã dùng` });
          
          await channel.send({ embeds: [resultEmbed] });
        });
        
        return Array.from(players.keys());
      }
    },

    {
      type: 'reaction_game',
      name: '⚡ Reaction Speed',
      weight: 15,
      async execute(channel, onlineMembers) {
        const emojis = ['🍕', '🎮', '🎵', '⚽', '🎨', '🚀', '💎', '🔥'];
        const targetEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        
        const embed = new EmbedBuilder()
          .setTitle('⚡ REACTION SPEED GAME!')
          .setDescription(`${mentions}\n\nReact với ${targetEmoji} NHANH NHẤT có thể!\n\n⏰ Bắt đầu sau 3 giây...`)
          .setColor('#FF6B6B');
        
        const msg = await channel.send({ embeds: [embed] });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const startEmbed = new EmbedBuilder()
          .setTitle('⚡ BẮT ĐẦU! REACT NGAY!')
          .setDescription(`React với ${targetEmoji}`)
          .setColor('#00FF00');
        
        await msg.edit({ embeds: [startEmbed] });
        await msg.react(targetEmoji);
        
        const startTime = Date.now();
        
        const filter = (reaction, user) => 
          reaction.emoji.name === targetEmoji && 
          !user.bot &&
          onlineMembers.includes(user.id);
        
        try {
          const collected = await msg.awaitReactions({ 
            filter, 
            max: 1, 
            time: 10000, 
            errors: ['time'] 
          });
          
          const winner = collected.first().users.cache.filter(u => !u.bot).first();
          const reactionTime = Date.now() - startTime;
          
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('🏆 NGƯỜI THẮNG!')
              .setDescription(`**${winner}** phản ứng trong **${reactionTime}ms**!`)
              .setColor('#FFD700')]
          });
          return [winner.id];
        } catch {
          await channel.send('⏰ Không ai react kịp!');
          return [];
        }
      }
    },

    {
      type: 'poll',
      name: '📊 Poll Nhanh',
      weight: 10,
      async execute(channel, onlineMembers) {
        const polls = [
          { q: 'Hôm nay làm gì?', opts: ['🎮 Chơi game', '📺 Xem phim', '💤 Ngủ', '📚 Học'] },
          { q: 'Đồ uống yêu thích?', opts: ['☕ Cà phê', '🍵 Trà', '🥤 Nước ngọt', '🧃 Nước ép'] },
          { q: 'Thể loại nhạc ưa thích?', opts: ['🎸 Rock', '🎵 Pop', '🎹 EDM', '🎤 Rap'] }
        ];
        
        const poll = polls[Math.floor(Math.random() * polls.length)];
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        
        const embed = new EmbedBuilder()
          .setTitle('📊 ' + poll.q)
          .setDescription(`${mentions}\n\n${poll.opts.join('\n')}\n\n⏰ Vote trong 60 giây!`)
          .setColor('#3498DB')
          .setFooter({ text: 'React với số tương ứng!' });
        
        const msg = await channel.send({ embeds: [embed] });
        
        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
        for (let i = 0; i < poll.opts.length; i++) {
          await msg.react(reactions[i]);
        }
        
        setTimeout(async () => {
          const fetched = await msg.fetch();
          const results = [];
          
          for (let i = 0; i < poll.opts.length; i++) {
            const reaction = fetched.reactions.cache.get(reactions[i]);
            const count = reaction ? reaction.count - 1 : 0;
            results.push({ option: poll.opts[i], count });
          }
          
          results.sort((a, b) => b.count - a.count);
          
          const resultEmbed = new EmbedBuilder()
            .setTitle('📊 KẾT QUẢ POLL')
            .setDescription(results.map((r, i) => `${i + 1}. ${r.option}: **${r.count}** votes`).join('\n'))
            .setColor('#2ECC71');
          
          await channel.send({ embeds: [resultEmbed] });
        }, 60000);
        
        return onlineMembers;
      }
    }
  ];

  static selectEvent() {
    const totalWeight = this.events.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const event of this.events) {
      random -= event.weight;
      if (random <= 0) return event;
    }
    
    return this.events[0];
  }
}

module.exports = EventTypes;