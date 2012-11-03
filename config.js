var mode = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var config = {
    development: {
        baseUrl: 'http://127.0.0.1:3000',
        mongohq: {
            host: '127.0.0.1/MustacheMonitorTest?auto_reconnect=true'
        }
    },
    production:  {
        baseUrl: 'http://mustachemonitor.com',
        mongohq: {
            host: process.env.MONGO_HOST + '@alex.mongohq.com:10096/MustacheMonitor?auto_reconnect=true'
        }
    }
};

exports.config = config[mode];
