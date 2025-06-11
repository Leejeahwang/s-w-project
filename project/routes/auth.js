const express = require('express');
const db = require('../db');
const router = express.Router();
const authController = require('../controllers/authController');

// auth.js => /auth

// 로그인 폼 (GET /auth/login)
router.get('/login', authController.login_rendering);

// 로그인 처리 (POST /auth/login)
router.post('/login', authController.login);

// 회원가입 폼 (GET /auth/signup)
router.get('/signup', authController.signup_rendering);

// 회원가입 처리 (POST /auth/signup)
router.post('/signup', authController.signup);

// 로그아웃 (GET /auth/logout)
router.get('/logout', authController.logout);

// 따로 빼는것도 나쁘지 않을듯 ? ? ?
// 카카오톡 토큰 얻기 (GET /auth/kakao/token)
router.get('/kakao/token', authController.getKakaoToken);

module.exports = router;
/*
1. 카카오디벨로퍼 가입
2. 내 애플리케이션
3. 애플리케이션 추가 -> 앱 이름과 회사명, 카테고리는 마음대로
4. 앱 키 -> REST API 값 복사해놓기 (사람마다 다른 값임)
5. 플랫폼 -> Web에서 사이트 도메인 http://localhost:3000 추가
6. 카카오 로그인 -> 활성화 설정 OFF -> ON
                    OpenID Connect 활성화 설정 OFF -> ON (딱히 상관없을거같지만 ON 추천)
                    Redirect URL -> http://localhost:3000/auth/kakao/token 추가
7. 동의항목 -> 접근권한 -> 카카오톡 메세지 전송 -> 선택동의, 동의목적: 전송되는 메세지를 받아볼 수 있습니다
8. 안되면 제 애플리케이션 초대 시켜드릴게요

// 내 rest api 키 (REST API 값은 내 고유한 값임)
KAKAO_CLIENT_ID = b79c5221c044c8b43f979e12f48efb3c // -> 사람마다 다름

// url + rest api키 -> access token과 refresh token을 받음
서버 켜둔 상태에서 client_id 뒤에 내 rest api키 넣고 돌리면 액세스 토큰이랑 리프레쉬 토큰 나와요
https://kauth.kakao.com/oauth/authorize?client_id=b79c5221c044c8b43f979e12f48efb3c&redirect_uri=http://localhost:3000/auth/kakao/token&response_type=code

access token을 .env에 저장해놔야함
project 폴더 바로 밑에 .env 파일 만들어놔야해요
파일 이름자체가 .env임

// .env
ADMIN_KAKAO_ACCESS_TOKEN=3GJfpfLVVj0vJE3QExZHmnNIO_xrd-8LAAAAAQoNIdkAAAGXOt-7Koh6dPOEuoNF
KAKAO_CLIENT_ID=b79c5221c044c8b43f979e12f48efb3c
이런식으로 만들어놔야해요

access token은 서버를 꺼도 약 6시간동안 유효해요
access token이 만료되면 다시 41번라인으로 돌아가서 직접 수정해야합니다
그러니까 다시 access token 받는거임

그리고 .env에서 access token 다시 설정해주고 서버 껐다가 실행해야 합니다
아니면 만료된 토큰값이라고 떠요
*/