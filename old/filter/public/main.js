// 필터 기능
function toggleFilter() {
    const panel = document.getElementById('filterPanel');
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
  }
  
  // 노트 생성 폼을 보이게 하는 함수
  function showCreateForm() {
    const createForm = document.getElementById('createForm');
    createForm.style.display = createForm.style.display === 'block' ? 'none' : 'block';
  }
  
  // 노트 생성 함수
  function createNote() {
    const subject = document.getElementById('new-subject').value.trim();
    const professor = document.getElementById('new-professor').value.trim();
    const category = document.getElementById('new-category').value;
    const summary = document.getElementById('new-summary').value.trim();
  
    if (!subject || !professor || !summary) {
      alert('모든 항목을 입력하세요.');
      return;
    }
  
    const noteGrid = document.querySelector('.note-grid');
  
    const card = document.createElement('div');
    card.className = 'note-card';
    card.setAttribute('data-subject', subject);
    card.setAttribute('data-professor', professor);
    card.setAttribute('data-category', category);
  
    card.innerHTML = `
      <a href="/note_detail">
        <h3>${subject} 노트</h3>
      </a>
      <p>${summary}</p>
      <div class="note-footer">작성자: ${professor}</div>
      <button>다운로드</button>
    `;
  
    noteGrid.appendChild(card);
  
    // 입력 필드 초기화
    document.getElementById('new-subject').value = '';
    document.getElementById('new-professor').value = '';
    document.getElementById('new-category').value = '전공필수';
    document.getElementById('new-summary').value = '';
  
    // 생성 폼 숨기기
    showCreateForm();
  }
  