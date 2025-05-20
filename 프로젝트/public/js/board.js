const noteId = 1; // 디버깅용

// 다운로드 수 버튼, 좋아요 수 버튼 누르면 +1 되는 JS
let likeCount = 0;
let downloadCount = 0;

document.getElementById("likeBtn").addEventListener("click", async function() {
    likeCount++;
    document.getElementById("likeCount").textContent = likeCount;

    await fetch(`/notes/${noteId}/like`, { method: 'POST' });

    const res = await fetch(`/notes/${noteId}`);
    const note = await res.json();
    document.getElementById("likeCount").textContent = note.like_count;
});

document.querySelector('.download-btn').addEventListener('click', async function () {
    downloadCount++;
    document.getElementById('downloadCount').textContent = downloadCount;

    await fetch(`/notes/${noteId}/download`, { method: 'POST' });

    const res = await fetch(`/notes/${noteId}`);
    const note = await res.json();
    document.getElementById("downloadCount").textContent = note.download_count;
});

// 댓글 등록 JS
document.getElementById('commentSubmitBtn').addEventListener('click', async () => {
  const content = document.getElementById('commentInput').value;
  const noteId = 1; // 임시 ID (서버에서 받아올 수 있음)

  if (!content.trim()) {
    return alert('댓글을 입력하세요!');
  }

  const res = await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId, content })
  });

  const result = await res.json();

  if (res.ok) {
    const commentList = document.getElementById('commentList');
    const newComment = document.createElement('div');
    newComment.className = 'comment';
    newComment.innerHTML = `<strong>${result.username}:</strong> ${result.content}`;
    commentList.appendChild(newComment);
    document.getElementById('commentInput').value = '';
  } else {
    alert(result.message || '댓글 등록 실패');
  }
});

// 댓글 목록 불러오기
fetch(`/comments?noteId=${noteId}`)
  .then(res => res.json())
  .then(comments => {
    const commentList = document.getElementById("commentList");
    commentList.innerHTML = '';

    comments.forEach(comment => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.innerHTML = `<strong>${comment.username}: </strong> ${comment.content}`;
      commentList.appendChild(commentDiv);
    });
  })
  .catch(err => console.error("댓글 불러오기 실패:", err));

// 노트 설명 기능 JS
// pdf 다운로드 링크, 파일 정보, 다운로드 수, 좋아요 수 불러오기

fetch(`/notes/${noteId}`)
    .then(res => res.json())
    .then(note => {
        // 노트 제목
        document.getElementById("noteTitle").textContent = note.title;

        // 노트 설명
        const descDiv = document.getElementById('noteDescription');

        descDiv.innerHTML = `
            <h3>노트 설명</h3>
            <p>${note.description}</p>
        `;

        // PDF 다운로드 링크
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = note.file_path; // 예: '/files/data_structure_mid_summary.pdf'

        // 파일 정보
        const fileInfo = document.getElementById('fileInfo');
        fileInfo.innerHTML = `
          파일명: ${note.file_name}<br>
          용량: ${note.file_size}<br>
          업로드: ${note.upload_date}
        `;
        
        // 좋아요 & 다운로드 수
        document.getElementById('likeCount').textContent = note.like_count;
        document.getElementById('downloadCount').textContent = note.download_count;
    })
    .catch(err => {
        console.error('노트 불러오기 실패:', err);
    });