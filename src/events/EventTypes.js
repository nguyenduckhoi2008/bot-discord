const { EmbedBuilder } = require('discord.js');

class EventTypes {
  static events = [
    {
      type: 'trivia',
      name: '🧠 Ai Nhanh Tay Hơn?',
      weight: 30,
      async execute(channel, onlineMembers) {
        const questions = [
          { q: 'Thủ đô Việt Nam là gì?', a: ['hanoi', 'hà nội', 'ha noi', 'hn'] },
          { q: 'Ai là tác giả "Truyện Kiều"?', a: ['nguyễn du', 'nguyen du'] },
          { q: '1 + 1 = ?', a: ['2', 'hai'] },
          { q: 'Con vật nào là biểu tượng Việt Nam?', a: ['rồng', 'long', 'dragon'] },
          { q: 'Việt Nam có bao nhiêu tỉnh thành?', a: ['63'] }
        ];
        
        const q = questions[Math.floor(Math.random() * questions.length)];
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        
        const embed = new EmbedBuilder()
          .setTitle('🧠 AI NHANH TAY HƠN?')
          .setDescription(`${mentions}\n\n**Câu hỏi:** ${q.q}\n\n⏰ Trả lời trong 30 giây!`)
          .setColor('#FFD700')
          .setFooter({ text: 'Người đầu tiên trả lời đúng thắng! 🏆' })
          .setTimestamp();
        
        await channel.send({ embeds: [embed] });
        
        const filter = m => 
          !m.author.bot && 
          onlineMembers.includes(m.author.id) &&
          q.a.some(ans => m.content.toLowerCase().trim() === ans);
        
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
              .setTitle('🎉 CÓ NGƯỜI THẮNG RỒI!')
              .setDescription(`**${winner.author}** trả lời đúng: **${q.a[0]}**`)
              .setColor('#00FF00')]
          });
          return [winner.author.id];
        } catch {
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('⏰ HẾT GIỜ!')
              .setDescription(`Không ai trả lời đúng. Đáp án là: **${q.a[0]}**`)
              .setColor('#FF0000')]
          });
          return [];
        }
      }
    },
    {
      type: 'reaction_game',
      name: '⚡ Reaction Speed',
      weight: 25,
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
      weight: 20,
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
    },
    {
      type: 'meme_time',
      name: '😂 Meme Time',
      weight: 15,
      async execute(channel, onlineMembers) {
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        
        const embed = new EmbedBuilder()
          .setTitle('😂 MEME TIME!')
          .setDescription(`${mentions}\n\n**SPAM MEME TRONG 2 PHÚT!**\n\nMeme được react nhiều nhất thắng! 🏆`)
          .setColor('#FF6B6B')
          .setFooter({ text: 'Ready... Set... MEME!' })
          .setTimestamp();
        
        await channel.send({ embeds: [embed] });
        
        setTimeout(async () => {
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('⏰ HẾT GIỜ!')
              .setDescription('Meme time kết thúc! Check reactions để xem ai thắng 😎')
              .setColor('#FFA500')]
          });
        }, 120000);
        
        return onlineMembers;
      }
    },
    {
      type: 'word_chain',
      name: '🔗 Nối Từ',
      weight: 10,
      async execute(channel, onlineMembers) {
        const startWords = ['game', 'music', 'phone', 'book', 'food'];
        const startWord = startWords[Math.floor(Math.random() * startWords.length)];
        const mentions = onlineMembers.map(id => `<@${id}>`).join(' ');
        
        const embed = new EmbedBuilder()
          .setTitle('🔗 GAME NỐI TỪ!')
          .setDescription(`${mentions}\n\n**Từ đầu tiên:** ${startWord}\n\nNối từ bắt đầu bằng chữ cái cuối của từ trước!\n⏰ 2 phút!`)
          .setColor('#9B59B6')
          .setFooter({ text: 'Ví dụ: game → eat → tree → ...' });
        
        await channel.send({ embeds: [embed] });
        
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