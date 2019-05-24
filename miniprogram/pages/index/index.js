//初始化数据库
const db = wx.cloud.database({})
const getmlist = db.collection('musiclist')
Page({
  data: {
    item: 0,
    tab: 0,
    //playlist
    playlist: [{
      _id: '',
      cover: '',
      singer: '',
      title: '',
      src: '',
    }],
    state: 'paused',
    playIndex: 0,
    play: {
      currentTime: '00:00',
      duration: '00:00',
      percent: 0,
      title: '',
      singer: '',
      cover: '',
    }
  },
  //页面切换
  changeItem: function(e) {
    this.setData({
      item: e.target.dataset.item
    })
  },
  changeTab: function(e) {
    this.setData({
      tab: e.detail.current
    })
  },
  //从云开发数据库里get列表
  getList() {
    let that = this;
    wx.cloud.callFunction({
      name: 'getmlist',
      success: res => {
        wx.stopPullDownRefresh()
        if (res.result) {
          let playlist = res.result.data
          console.log({
            playlist
          })
          if (playlist == undefined || playlist.length == 0) {
            wx.showToast({
              title: 'no data',
            })
          } else {
            that.setData({
              isShowArtcle: true,
              playlist: playlist
            }, function() {
              this.setMusic(0)
            })
          }
        }
      },
      fail: err => {
        wx.stopPullDownRefresh()
        wx.showToast({
          title: 'no data',
        })
      }
    })
  },
  onLoad: function(options) {
    this.getList()
  },
  audioCtx: null,
  onReady: function() {
    //创建InnerAudioComtext实例
    this.audioCtx = wx.createInnerAudioContext()
    var that = this
    //播放失败检测
    this.audioCtx.onError(function() {
      console.log('播放失败：' + that.audioCtx.src)
    })
    //播放完自动换下一曲
    this.audioCtx.onEnded(function() {
      that.next()
    })
    //自动更新播放进度
    this.audioCtx.onPlay(function() {})
    this.audioCtx.onTimeUpdate(function() {
      that.setData({
        'play.duration': formatTime(that.audioCtx.duration),
        'play.currentTime': formatTime(that.audioCtx.currentTime),
        'play.percent': that.audioCtx.currentTime / that.audioCtx.duration * 100
      })
    })
    //格式化时间
    function formatTime(time) {
      var minute = Math.floor(time / 60) % 60;
      var second = Math.floor(time) % 60
      return (minute < 10 ? +minute : minute) + ':' + (second < 10 ? '0' + second : second)
    }
  },
  setMusic: function(index) {
    var music = this.data.playlist[index]
    console.log(music.src)
    this.audioCtx.src = music.src
    this.setData({
      playIndex: index,
      play: {
        title: music.title,
        singer: music.singer,
        cover: music.cover,
        currentTime: '00:00',
        duration: '00:00',
        percent: 0
      }
    })
    console.log(this.audioCtx.src)
    this.play()
    console.log(this.audioCtx.src)
  },
  // 播放与暂停
  play: function() {
    console.log(this.audioCtx.src)
    this.audioCtx.play()
    this.setData({
      state: "running"
    })
  },
  pause: function() {
    this.audioCtx.pause()
    this.setData({
      state: "paused"
    })
  },
  // 下一首
  next: function() {
    this.pause()
    var index = this.data.playIndex >= this.data.playlist.length - 1 ?
      0 : this.data.playIndex + 1
    this.setMusic(index)
    // this.play()
  },
  sliderChange: function(e) {
    var second = e.detail.value * this.audioCtx.duration / 100
    this.audioCtx.seek(second)
  },
  //换歌
  change: function(e) {
    this.setMusic(e.currentTarget.dataset.index)
    this.play()
  },
  onShow: function() {
    this.getList();
  },
  onPullDownRefresh: function() {
    this.getList();
  }
})