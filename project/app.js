const fs = require('fs');
const http = require('http');

const sever = http.createServer((req, res) => {
    if(req.url === '/' && req.method === 'GET') {
        fs.readFile('./index.html', (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(err ? '페이지 로드 오류' : data);
        });
    }

    else if(req.url === '/note_detail' && req.method === 'GET') {
        fs.readFile('./note_detail.html', (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(err ? '페이지 로드 오류' : data);
        });
    }
});

sever.listen(3000, () => {
    console.log('http://localhost:3000 에서 서버 실행 중');
});