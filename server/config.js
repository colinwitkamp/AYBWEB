const config = {
  mongoURL: process.env.MONGO_URL || 'mongodb://localhost:27017/mern-starter',
  port: process.env.PORT || 8000,
  checkFrontURL: process.env.CHECKFRONT_URL || 'https://areyouboredco.checkfront.com',
  API_URL: process.env.API_URL || '/api/3.0',
  API_KEY: process.env.API_KEY ||'14025b298c74c072d8290c5ff4ece38d805b1aae',
  API_SECRET: process.env.API_SECRET || '849a096f5c044a16de601d0ffe2c0d61d27bfbec2a79d887bda18d216b2c5dc8'
};

export default config;
