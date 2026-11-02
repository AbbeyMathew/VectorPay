require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const flag = (value) => ['1', 'true', 'yes'].includes(String(value || '').toLowerCase());

const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  cookieSecure: flag(process.env.COOKIE_SECURE),
  trustProxy: flag(process.env.TRUST_PROXY),
  mail: {
    transport: process.env.MAIL_TRANSPORT || '',
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"VectorPay" <no-reply@vectorpay.test>',
  },
};

env.assertRuntime = function assertRuntime() {
  const problems = [];
  if (!env.mongoUri) problems.push('MONGO_URI is not set');
  if (!env.jwtSecret) problems.push('JWT_SECRET is not set');
  else if (env.isProd && env.jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters in production');
  }
  if (problems.length) throw new Error(`Invalid environment:\n - ${problems.join('\n - ')}`);
};

module.exports = env;
