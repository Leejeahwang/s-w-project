const fs = require('fs');
const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        fs.readFile('./index.html', (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(err ? '페이지 로드 오류' : data);
        });
    }

    else if (req.url === '/note_detail' && req.method === 'GET') {
        fs.readFile('./note_detail.html', (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(err ? '페이지 로드 오류' : data);
        });
    }

    else if (req.url === '/signup.html' && req.method === 'GET') {
        fs.readFile('./signup.html', (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(err ? '페이지 로드 오류' : data);
        });
    }

    else if (req.url === '/login.html' && req.method === 'GET') {
        fs.readFile('./login.html', (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(err ? '페이지 로드 오류' : data);
        });
    }

    else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('페이지를 찾을 수 없습니다.');
    }
});

server.listen(3000, () => {
    console.log('http://localhost:3000 에서 서버 실행 중');
});
