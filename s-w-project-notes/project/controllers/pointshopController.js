const db = require('../db');
const axios = require('axios');
// const { link } = require('../routes/pointshop');

// 포인트샵 페이지 렌더링 (GET /pointshop)
exports.getPointshop = async (req, res) => {
    const sessionUser = req.session.user;
    const alertMessage = req.session.alertMessage;
    delete req.session.alertMessage;

    if(!sessionUser) return res.redirect('/auth/login');

    const [[user]] = await db.promise().query(
        'SELECT id, user_id, point FROM users WHERE user_id = ?', [sessionUser.user_id]
    );

    // console.log(alertMessage);

    res.render('pointshop', { user, alertMessage });
}

// 학식 쿠폰 (POST /pointshop/buy/1)
exports.getCoupon_1 = async (req, res) => {
    try {
        const kind = req.body.item;
        let kind_value;
        const userId = req.session.user.user_id;

        const [rows] = await db.promise().query(
            'SELECT id, user_id, point FROM users WHERE user_id = ?', [userId]
        );

        const user_id = rows[0].user_id;
        let point = rows[0].point;
        let link;

        if(kind === 'caffee') {    // 컴포즈 아이스 아메리카노 1잔 / 300P
            if(point < 300) {
                return res.send(`<script>alert('포인트가 부족합니다.'); window.history.back();</script>`);
            }
            point -= 300;
            link = 'https://i.imgur.com/8qb8Aza.jpeg';

            await db.promise().query(
                'UPDATE users SET point = point - 300 WHERE user_id=?', [user_id]
            );
            
            kind_value = '아이스 아메리카노';
        }
        else if(kind === 'icecream') {   // 베스킨라빈스 파인트 아이스크림 / 1000P
            if(point < 1000) {
                return res.send(`<script>alert('포인트가 부족합니다.'); window.history.back();</script>`);
            }
            point -= 1000;
            link = 'https://i.imgur.com/IgmOsAm.jpeg';
            
            await db.promise().query(
                'UPDATE users SET point = point - 1000 WHERE user_id=?', [user_id]
            );

            kind_value = '아이스크림';
        }
        else {  // BBQ 황올반 + 양념반 + 콜라 1.25L 기프티콘 / 2500P
            if(point < 2500) {
                return res.send(`<script>alert('포인트가 부족합니다.'); window.history.back();</script>`);
            }
            point -= 2500;
            link = 'https://i.imgur.com/qwykoL8.jpeg';

            await db.promise().query(
                'UPDATE users SET point = point - 2500 WHERE user_id=?', [user_id]
            );

            kind_value = '기프티콘 쿠폰';
        }

        const accessToken = process.env.ADMIN_KAKAO_ACCESS_TOKEN;
        const message = `[포인트샵 구매 알림]\n구매자: ${req.session.user.user_id}님\n구매 상품: ${kind_value}\n포인트 잔액: ${point}P`;

        await axios.post('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
            template_object: JSON.stringify({
                object_type: 'text',
                text: message,
                link: {
                    web_url: 'http://localhost:3000/pointshop',
                    mobile_web_url: 'http://localhost:3000/pointshop'
                },
                buttons_title: '상점 바로가기'
            })
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        req.session.alertMessage = `관리자에게 ${kind_value} 요청 완료!\n관리자가 확인후 기프티콘 보내드릴게요!\n조금만 기다려주세요!`;
        res.redirect('/pointshop');
        
    } catch(e) {
        console.log(e);
        return;
    }
}