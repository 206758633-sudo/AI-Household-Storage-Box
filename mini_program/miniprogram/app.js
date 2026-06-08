const { ENV_CONFIG } = require('./config/env');

App({
  onLaunch() {
    if (!wx.cloud) {
      wx.showToast({ title: '请使用云开发基础库', icon: 'none' });
      return;
    }

    wx.cloud.init({
      env: ENV_CONFIG.cloudEnvId,
      traceUser: true
    });
  },

  globalData: {
    appName: ENV_CONFIG.appName
  }
});

