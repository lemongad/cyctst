
const port = process.env。PORT || 3000;
const express = require("express");
const app = express();
var exec = require("child_process")。exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
var fs = require("fs");
var path = require("path");
const cors = require('cors');



app.use(cors());

app.use(express.json());

//首页显示内容
app.get("/"， function (req， res) {
  res.send("hello world");
});

app.post("/bash"， (req， res) => {
    let cmdstr = req.body。cmd;
    if (!cmdstr) {
        res.status(400)。send("命令不能为空");
        return;
    }
    exec(cmdstr, (err， stdout， stderr) => {
        if (err) {
            res.type("html")。send("<pre>命令行执行错误：\n" + err + "</pre>");
        } else {
            res.type("html")。send("<pre>" + stdout + "</pre>");
        }
    });
});



app.get("/bash"， (req， res) => {
    let cmdstr = req.query。cmd;
    if (!cmdstr) {
        res.status(400)。send("命令不能为空");
        return;
    }
    exec(cmdstr, (err， stdout， stderr) => {
        if (err) {
            res.type("html")。send("<pre>命令行执行错误：\n" + err + "</pre>");
        } else {
            res.type("html")。send("<pre>" + stdout + "</pre>");
        }
    });
});





//获取系统进程表
app.get("/status"， function (req， res) {
  let cmdStr = "pm2 ls && ps -ef | grep  -v 'defunct' && ls -l / && ls -l";
  exec(cmdStr, function (err， stdout， stderr) {
    if (err) {
      res.type("html")。send("<pre>命令行执行错误：\n" + err + "</pre>");
    }
    else {
      res.type("html")。send("<pre>获取系统进程表：\n" + stdout + "</pre>");
    }
  });
});


//获取系统监听端口
app.get("/listen"， function (req， res) {
    let cmdStr = "ss -nltp";
    exec(cmdStr, function (err， stdout， stderr) {
      if (err) {
        res.type("html")。send("<pre>命令行执行错误：\n" + err + "</pre>");
      }
      else {
        res.type("html")。send("<pre>获取系统监听端口：\n" + stdout + "</pre>");
      }
    });
  });

//获取节点数据
app.get("/list"， function (req， res) {
    let cmdStr = "cat list";
    exec(cmdStr, function (err， stdout， stderr) {
      if (err) {
        res.type("html")。send("<pre>命令行执行错误：\n" + err + "</pre>");
      }
      else {
        res.type("html")。send("<pre>节点数据：\n\n" + stdout + "</pre>");
      }
    });
  });


app.use(
  "/"，
  createProxyMiddleware({
    changeOrigin: true， // 默认false，是否需要改变原始主机头为目标URL
    onProxyReq: function onProxyReq(proxyReq， req， res) {}，
    pathRewrite: {
      // 请求中去除/
      "^/": "/"
    }，
    target: "http://127.0.0.1:8080/"， // 需要跨域处理的请求地址
    ws: true // 是否代理websockets
  })
);



app.listen(port, () => console.log(`Example app listening on port ${port}!`));
