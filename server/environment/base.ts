export const environment = {
  /**
   * Identify itself. Current MicroService Name and ID in Database
   */
  service: {
    _id: 'CREATORS_STUDIO',
    name: 'creators studio',
    url: '/creators-studio',
    description: 'creators-studio',
    serviceType: 'any',
    envStatus: 'ALPHA',
    iconClass: 'fa fa-comments'
  },
  /**
   * App running port
   */
  port: process.env.PORT || 3000,
  /**
   * App environment
   */
  production: false,
  /**
   * Logger
   */
  log: {
    format: process.env.LOG_FORMAT || 'combined',
    fileLogger: {
      level: 'debug',
      directoryPath: process.env.LOG_DIR_PATH || (process.cwd() + '/logs/'),
      fileName: process.env.LOG_FILE || 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  /**
   * Database connection information
   */
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost/isabel'
  },
  mailer: {
    host: 'localhost',
    port: '2525',
    from: '"DEV Isabel - FedoraLabs" <no-reply@testingdomain.io>',
    auth: {
      user: process.env.MAILER_EMAIL_ID || 'testuser',
      pass: process.env.MAILER_PASSWORD || '9j8js7pi37a4'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  authURI: `https://dev.aitheon.com/auth`,
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || `amqp://ai-rabbit:Ne&ZTeFeYCqqQRK3s7qF@localhost:5672`
  },
  gitea: {
    uri: process.env.GITEA_URI || 'https://dev.aitheon.com/git',
    token: process.env.GITEA_TOKEN || 'fd79e83c1a622fb115dcb5801012a53f51014368',
    sudo: process.env.GITEA_SUDO || 'aitheon'
  },
  sandboxTimeOfInactive: 60 * 60 * 1000, // 60 minutes in miliseconds. If no action for this time
  sandboxCleanerInterval: 5 * 60 * 1000, // each 1 minute check inactive sessions
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  },
  sandboxAuthProxyCacheSeconds: process.env.SANDBOX_AUTH_PROXY_CACHE || 300,
  sandboxAuthProxyCacheKey: process.env.SANDBOX_AUTH_PROXY_CACHE_KEY || '15dcbeYCqqQRK35801012'
};