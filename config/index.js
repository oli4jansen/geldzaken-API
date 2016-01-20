var config = {
  port: 8080,
  clientUrl: 'http://oli4jansen.github.io/geldzaken-client/#',
  publicPrefix: '',
  privatePrefix: '/private',
  viewsDir: '/views',
  viewEngine: 'jade',
  // For all logger options, see morgan docs
  logger: 'dev',
  // For all mailer config options, see express-mailer docs
  mailer: {
    from: 'Geldzaken <oli4jansen@gmail.com>',
    host: 'smtp.gmail.com',
    port: 465,
    secureConnection: true,
    transportMethod: 'SMTP',
    auth: {
      user: 'oli4jansen@gmail.com',
      pass: 'reivilonesnaj'
    }
  },
};

module.exports = config;
