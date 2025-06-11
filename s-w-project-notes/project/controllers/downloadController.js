const db = require('../db');
const path = require('path');
const fs = require('fs');
const express = require('express');

// 다운로드 기록 및 카운트 증가 (POST /files/download-log/:noteId)
exports.updateDownload_log = async (req, res) => {
    // 로그인 확인 여부
    if(!req.session.user) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const noteId = req.params.noteId;
    const userId = req.session.user.user_id;

    try {
        const [rows] = await db.promise().query('SELECT note_id FROM files WHERE note_id = ?', [noteId]);
        if(rows.length === 0) return res.status(404).json({ message: "해당 파일이 존재하지 않음" });

        await db.promise().query('INSERT INTO note_downloads (note_id, user_id, downloaded_at) VALUES (?, ?, NOW())', [noteId, userId]);
        await db.promise().query('UPDATE notes SET download_count = download_count + 1 WHERE id = ?', [noteId]);

        res.json({ message: "다운로드 기록 완료 "});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message: "다운로드 기록 오류 "});
    }
}

// 파일 다운로드 (GET /files/download/:stored_name)
exports.getFile = (req, res) => {
    const stored_name = req.params.stored_name;
    const filePath = path.join(__dirname, '..', 'public', 'files', stored_name);

    // console.log("요청된 파일 이름:", stored_name);
    // console.log("실제 경로:", filePath);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("파일 없음");
    }

    res.download(filePath, stored_name, err => {
        if (err) {
            console.error("파일 다운로드 오류:", err);
            res.status(404).send("파일을 찾을 수 없습니다.");
        }
    });
};