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

insert into categories (name) values("전공필수");
insert into categories (name) values("전공선택");
insert into categories (name) values("교양");
insert into categories (name) values("기타");

CREATE TABLE `semesters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
);

select * from semesters;

insert into semesteres (name) values("2024-1학기");
insert into semesteres (name) values("2024-2학기");
insert into semesteres (name) values("2025-1학기");


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

-- semesters, subjects, years라는 테이블로 이런식으로 존재함
