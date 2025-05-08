const fs = require('fs');
const http = require('http');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',    // 너의 MySQL 유저명
    password: '1234', // 너의 MySQL 비번
    database: 'userdb' // 사용할 데이터베이스 이름
});

// 연결 확인
db.connect((err) => {
    if (err) {
        console.error('DB 연결 실패:', err);
        return;
    }
    console.log('DB 연결 성공!');
});

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

    else if (req.url === '/signup' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
    
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const username = params.get('id');
            const password = params.get('pw');
            const name = params.get('name');
            const studentId = params.get('studentId');
            const grade = params.get('grade');
    
            db.query('INSERT INTO users (username, password, name, studentId, grade) VALUES (?, ?, ?, ?, ?)',
                [username, password, name, studentId, grade],
                (err, results) => {
                    if (err) {
                        console.error('회원가입 실패:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('회원가입 실패');
                        return;
                    }
                    res.writeHead(302, { Location: '/' });
                    res.end();
                }
            );
        });
    }

    else if (req.url === '/login' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
    
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const username = params.get('id');
            const password = params.get('pw');
    
            db.query('SELECT * FROM users WHERE username = ? AND password = ?', 
                [username, password], 
                (err, results) => {
                    if (err) {
                        console.error('로그인 실패:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('로그인 실패');
                        return;
                    }
    
                    if (results.length > 0) {
                        res.writeHead(302, { Location: '/' });
                        res.end();
                    } else {
                        res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('로그인 실패: 아이디 또는 비밀번호 불일치');
                    }
                }
            );
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
