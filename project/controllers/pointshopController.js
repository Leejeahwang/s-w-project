const db = require('../db');
const axios = require('axios');
// const { link } = require('../routes/pointshop');

// 포인트샵 페이지 렌더링 (GET /pointshop)
exports.getPointshop = async (req, res) => {
    const sessionUser = req.session.user;
    if(!sessionUser) return res.redirect('/auth/login');

    const [[user]] = await db.promise().query(
        'SELECT id, user_id, point FROM users WHERE user_id = ?', [sessionUser.user_id]
    );

    res.render('pointshop', { user });
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

        if(kind === 'cafe_coupon') {    // 학교 카페 쿠폰
            if(point < 300) {
                return res.send(`<script>alert('포인트가 부족합니다.'); window.history.back();</script>`);
            }
            point -= 300;

            await db.promise().query(
                'UPDATE users SET point = point - 300 WHERE user_id=?', [user_id]
            );
            
            kind_value = '학교 카페 쿠폰';
        }
        else if(kind === 'meal_coupon') {   // 학식 쿠폰
            if(point < 400) {
                return res.send(`<script>alert('포인트가 부족합니다.'); window.history.back();</script>`);
            }
            point -= 400;

            await db.promise().query(
                'UPDATE users SET point = point - 400 WHERE user_id=?', [user_id]
            );

            kind_value = '학식 쿠폰';
        }
        else {  // 기프티콘 쿠폰
            if(point < 500) {
                return res.send(`<script>alert('포인트가 부족합니다.'); window.history.back();</script>`);
            }
            point -= 500;

            await db.promise().query(
                'UPDATE users SET point = point - 500 WHERE user_id=?', [user_id]
            );

            kind_value = '기프티콘 쿠폰';
        }

        const accessToken = process.env.ADMIN_KAKAO_ACCESS_TOKEN;
        const message = `${req.session.user.user_id}님이 상품을 구매했습니다.\n구매 상품: ${kind_value}\n포인트 잔액: ${point}P`;

        await axios.post('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
            template_object: JSON.stringify({
                object_type: 'text',
                text: message,
                link: {
                    web_url: 'http://localhost:3000/pointshop',
                    mobile_web_url: 'http://localhost:3000/pointshop'
                },
                button_title: '상점 보기'
            })
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        res.send(`<script>alert('관리자에게 ${kind_value} 요청 완료!'); location.href='/pointshop';</script>`)
    } catch(e) {
        console.log(e);
        return;
    }
}