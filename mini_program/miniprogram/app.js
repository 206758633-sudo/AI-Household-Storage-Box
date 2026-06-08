const { ENV_CONFIG } = require('./config/env');

App({
  onLaunch() {
    if (ENV_CONFIG.useLocalMode) {
      this.globalData.cloudReady = false;
      return;
    }

    if (!wx.cloud) {
      wx.showToast({ title: '请使用云开发基础库', icon: 'none' });
      return;
    }

    wx.cloud.init({
      env: ENV_CONFIG.cloudEnvId,
      traceUser: true
    });
    this.globalData.cloudReady = true;
  },

  globalData: {
    appName: ENV_CONFIG.appName,
    cloudReady: false
  }
});
