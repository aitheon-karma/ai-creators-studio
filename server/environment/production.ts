export const environment = {
  production: true,
  mailer: {
    host: 'ai-mail.ai-mail.svc.cluster.local',
    port: '25',
    from: process.env.MAILER_FROM || '"Aitheon" <no-reply@aitheon.com>',
    auth: {
      user: process.env.MAILER_EMAIL_ID || 'testuser',
      pass: process.env.MAILER_PASSWORD || '9j8js7pi37a4'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  authURI: `http://ai-auth.ai-auth.svc.cluster.local:${ process.env.AI_AUTH_SERVICE_PORT || 3000 }`,
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || `amqp://ai-rabbit:Ne&ZTeFeYCqqQRK3s7qF@ai-rabbitmq.ai-rabbitmq.svc.cluster.local:5672`
  },
  gitea: {
    uri: process.env.GITEA_URI || 'http://gitea.gitea.svc.cluster.local:3000',
    token: process.env.GITEA_TOKEN || 'fd79e83c1a622fb115dcb5801012a53f51014368',
    sudo: process.env.GITEA_SUDO || 'aitheon'
  },
  redis: {
    host: process.env.REDIS_HOST || 'ai-redis.ai-redis.svc.cluster.local',
    port: process.env.REDIS_PORT || 6379
  },
};