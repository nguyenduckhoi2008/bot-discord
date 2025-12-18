class MusicService {
  constructor() {
    // Database nhạc Việt (có thể mở rộng)
    this.songs = [
      {
        name: 'Lạc Trôi',
        artist: 'Sơn Tùng MTP',
        youtubeId: 'DrY_K0mT-As',
        answers: ['lạc trôi', 'lac troi']
      },
      {
        name: 'Chúng Ta Của Hiện Tại',
        artist: 'Sơn Tùng MTP',
        youtubeId: 'psZ1g9fMfeo',
        answers: ['chúng ta của hiện tại', 'chung ta cua hien tai', 'ctcht']
      },
      {
        name: 'Nơi Này Có Anh',
        artist: 'Sơn Tùng MTP',
        youtubeId: 'FN7ALfpGxiI',
        answers: ['nơi này có anh', 'noi nay co anh', 'nnca']
      },
      {
        name: 'Anh Đang Ở Đâu Đấy Anh',
        artist: 'Hương Giang',
        youtubeId: 'r-hfw-5OKfI',
        answers: ['anh đang ở đâu đấy anh', 'anh dang o dau day anh', 'adodda']
      },
      {
        name: 'Có Chắc Yêu Là Đây',
        artist: 'Sơn Tùng MTP',
        youtubeId: 'knW7-x7Y7RE',
        answers: ['có chắc yêu là đây', 'co chac yeu la day', 'ccyld']
      }
    ];
  }

  getRandomSong() {
    return this.songs[Math.floor(Math.random() * this.songs.length)];
  }

  getSongUrl(youtubeId) {
    return `https://www.youtube.com/watch?v=${youtubeId}`;
  }
}

module.exports = new MusicService();