// server.js - Updated with correct imports and error handling
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const i18n = require('./middleware/i18n');
const { authenticate, optionalAuthenticate } = require('./middleware/auth');
const ensureDirectories = require('./scripts/ensureDirectories');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');

// 检查JWT Secret
if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET not set in environment. Using default secret for development.');
    process.env.JWT_SECRET = 'vision-pro-dev-secret-key';
}

// 确保必要的目录存在
ensureDirectories();

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 为Stripe webhook配置原始body解析
app.use('/api/payment/callback/stripe', bodyParser.raw({ type: 'application/json' }));

app.use(i18n.middleware());

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visionpro', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 基础路由
app.get('/', (req, res) => {
    res.json({ 
        message: req.__('welcome'),
        version: '1.0.0',
        status: 'running',
        language: req.locale
    });
});

// 健康检查路由
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API路由
const userRoutes = require('./routes/userRoutes');
const contentRoutes = require('./routes/contentRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const creatorRoutes = require('./routes/creatorRoutes');
const mediaRoutes = require('./routes/mediaRoutes'); // 媒体路由
const fusionRoutes = require('./routes/fusionRoutes'); // 融合内容路由
const recommendationRoutes = require('./routes/recommendationRoutes');

app.use('/api/users', userRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creator', creatorRoutes); 
app.use('/api/media', mediaRoutes);
app.use('/api/fusions', fusionRoutes);
app.use('/api/recommendations', recommendationRoutes);

// 静态文件服务
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// 404处理中间件
app.use(notFoundHandler);

// 错误处理中间件
app.use(errorHandler);

// 启动定时任务
const ScheduledTasks = require('./services/scheduledTasks');
ScheduledTasks.initScheduledTasks();

// 启动服务器
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
});