
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());

const AUTH_TOKEN = 'your_auth_token'; // 你的授权令牌
const serverUrl = 'http://mirror.mslmc.cn'
const port = '3002'

// 生成随机8位数字/小写字母的函数
function generatePrefix() {
    return crypto.randomBytes(4).toString('hex');
}
// 记录请求信息的中间件
app.use((req, res, next) => {
    const now = new Date();
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`Time: ${now.toISOString()}, IP: ${ip}, URL: ${req.originalUrl}`);
    next();
});

app.post('/', async (req, res) => {
    const authToken = req.headers.authorization && req.headers.authorization.split(' ')[1];
    const url = req.body.url;
    const filename = generatePrefix() + originalFilename;
    const tempDir = path.resolve(__dirname, 'temp');
    const filepath = path.resolve(tempDir, filename);

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    if (authToken !== AUTH_TOKEN) {
        return res.sendStatus(403); // Forbidden
    }

    const writer = fs.createWriteStream(filepath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    writer.on('finish', () => {
        res.json({ url: `${serverUrl}:${port}/temp/${filename}` });
        // 设置1小时后删除文件
        setTimeout(() => {
            fs.unlink(filepath, err => {
                if (err) console.error('删除文件失败:', err);
            });
        }, 60 * 60 * 1000); // 1小时
    });

    writer.on('error', (err) => {
        fs.unlinkSync(filepath);
        res.status(500).json({ error: err.message });
    });
});

app.use('/temp', express.static(path.resolve(__dirname, 'temp')));

app.listen(port, () => console.log(`下载服务正在监听${port}端口`));

