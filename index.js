const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const request = require('request-promise');
const app = express();
app.use(express.json());

const AUTH_TOKEN = 'your_auth_token'; // 授权令牌
const SERVER_PORT = 3002; // 服务器端口
const TEMP_DIR = 'temp'; // 临时文件夹
const serverUrl = '' //服务器url，若用非标准http端口，要加上

// 检查临时文件夹是否存在，如果不存在则创建它
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// 中间件，用于检查连接时间是否超过60分钟
app.use((req, res, next) => {
    const startTime = Date.now();
    //设置一个定时器，在60分钟后检查连接
    const timer = setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > 60 * 60 * 1000) {
            // 如果连接时间超过60分钟，发送404响应并断开连接
            res.status(404).send('Not Found');
            res.end();
        }
    }, 60 * 60 * 1000);
    // 连接关闭，清除定时器
    res.on('finish', () => {
        clearTimeout(timer);
    });

    // 继续执行下一个中间件
    next();
});

app.use('/temp', express.static(path.join(__dirname, 'temp')));
app.post('/', async (req, res) => {
    const fileUrl = req.body.url;

    if (req.headers.authorization !== `Bearer ${AUTH_TOKEN}`) {
        res.status(403).send('无效的授权令牌');
        return;
    }

    try {
        console.log(`请求下载的地址: ${fileUrl}`); // 打印请求的下载地址

        const response = await request.get(fileUrl, { encoding: null, timeout: 5000 });
        const randomPrefix = crypto.randomBytes(4).toString('hex');
        const filePath = path.join(TEMP_DIR, `${randomPrefix}_${path.basename(fileUrl)}`);

        fs.writeFileSync(filePath, response);

        console.log(`下载完成: ${serverUrl}/${filePath}`); // 打印下载完成的文件地址

        res.status(200).send({ url: `${serverUrl}/${filePath}`, message: '下载完成' });

        // 在2小时后删除文件
        setTimeout(() => {
            fs.unlink(filePath, err => {
                if (err) console.error(`无法删除文件: ${err}`);
            });
        }, 2 * 60 * 60 * 1000);
    } catch (err) {
        res.status(500).send('镜像服务器下载文件失败');
        console.error(`文件下载失败: ${err}`);
    }
});

app.listen(SERVER_PORT, () => {
    console.log(`镜像下载服务器正在监听端口${SERVER_PORT}`);
});
