create database myboard;

drop table if exists users;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `studentId` varchar(50) DEFAULT NULL,
  `grade` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
);

DROP TABLE IF EXISTS notes;
CREATE TABLE `notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `summary` text NOT NULL,
  `subject` varchar(255) NOT NULL,
  `professor` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `year` varchar(10) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

drop table if exists comments;
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,          -- 어떤 노트에 달린 댓글인지 (notes 테이블의 id 참조)
  user_id varchar(50) DEFAULT NULL,          -- 댓글 작성자 ID (users 테이블의 id 참조)
  content TEXT NOT NULL,         -- 댓글 내용
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE, -- 노트 삭제 시 관련 댓글도 삭제
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE  -- 사용자 탈퇴 시 관련 댓글도 (선택적으로) 삭제 또는 NULL 처리
);

CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
);

delete from categories;

insert into categories (name) values("교양필수");
insert into categories (name) values("공학교양");
insert into categories (name) values("기초과학및수학");
insert into categories (name) values("전공기초");
insert into categories (name) values("전공필수");
insert into categories (name) values("전공선택");
insert into categories (name) values("기타");

CREATE TABLE `semesters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
);

select * from semesters;

insert into semesters (name) values("2022년-1학기"); -- 1학년
insert into semesters (name) values("2022년-2학기"); -- 1학년
insert into semesters (name) values("2023년-1학기"); -- 2학년
insert into semesters (name) values("2023년-2학기"); -- 2학년
insert into semesters (name) values("2024년-1학기"); -- 3학년
insert into semesters (name) values("2024년-2학기"); -- 3학년
insert into semesters (name) values("2025년-1학기"); -- 4학년
insert into semesters (name) values("2025년-2학기"); -- 4학년
insert into semesters (name) values("기타"); -- 그외


CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
);

select * from subjects;
insert into subjects (name) values("자료구조");
insert into subjects (name) values("운영체제");
insert into subjects (name) values("알고리즘");
insert into subjects (name) values("컴파일러");
insert into subjects (name) values("수치해석");

CREATE TABLE `years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
);

select * from years;
insert into years (name) values("1학년");
insert into years (name) values("2학년");
insert into years (name) values("3학년");
insert into years (name) values("4학년");
insert into years (name) values("기타");

-- semesters, subjects, years라는 테이블로 이런식으로 존재함
-- file 테이블 추가
CREATE TABLE `files` (
  `id` INT NOT NULL AUTO_INCREMENT primary key,
  `note_id` INT NOT NULL,                      	-- 연결된 노트 ID
  `file_name` VARCHAR(255) NOT NULL,           	-- 원래 파일 이름
  `file_path` VARCHAR(255) NOT NULL,           	-- 실제 저장 경로
  `file_size` VARCHAR(50),                     	-- 용량 (예: '1.2MB')
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE
);

ALTER TABLE files
MODIFY COLUMN file_size INT;

select * from categories;
select * from semesters;
select * from subjects;
select * from years;
select * from note_likes;
select * from users;
select * from notes;
select * from files;
select * from note_downloads;
select * from comments;

delete from comments;

SELECT id, title, like_count
FROM notes
ORDER BY like_count DESC
LIMIT 5;

SELECT COUNT(*) FROM comments WHERE user_id='admin' AND DATE(created_at) = CURDATE();

ALTER TABLE users
  ADD COLUMN point INT;

delete from notes where id = 32;

SELECT note_id FROM files WHERE note_id = 23;
INSERT INTO note_downloads (note_id, user_id, downloaded_at) VALUES (?, ?, NOW());

ALTER TABLE notes
ADD COLUMN like_count INT DEFAULT 0,
ADD COLUMN download_count INT DEFAULT 0;

CREATE TABLE note_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (note_id, user_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE note_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (note_id, user_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE note_downloads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE files
  ADD COLUMN stored_name VARCHAR(255) AFTER file_name;
  
delete from notes where id = 22;

DROP TABLE IF EXISTS note_downloads;

ALTER TABLE users ADD point INT DEFAULT 0; -- user 가입 시 point 부여

insert into semesters (name) values("2022년-계절학기(하계)"); -- 22 계절(하계)
insert into semesters (name) values("2022년-계절학기(동계)"); -- 22 계절(동계)
insert into semesters (name) values("2023년-계절학기(하계)"); -- 23 계절(하계)
insert into semesters (name) values("2023년-계절학기(동계)"); -- 23 계절(동계)
insert into semesters (name) values("2024년-계절학기(하계)"); -- 24 계절(하계)
insert into semesters (name) values("2024년-계절학기(동계)"); -- 24 계절(동계)
insert into semesters (name) values("2025년-계절학기(하계)"); -- 25 계절(하계)
insert into semesters (name) values("2025년-계절학기(동계)"); -- 25 계절(동계)
