// 필터 패널 토글 함수
function toggleFilter() {
  const panel = document.getElementById('filterPanel');
  if (panel) {
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
  }
}

// 노트 생성 폼 토글 함수
function showCreateForm() {
  const createForm = document.getElementById('createForm');
  if (createForm) {
    // 실제로는 로그인 상태를 확인하고, 비로그인 시 로그인 페이지로 유도할 수 있습니다.
    // 현재 controller.js의 /check-login API를 호출하여 로그인 여부를 확인하고,
    // 로그인이 안되어 있다면 alert을 띄우거나 로그인 페이지로 리다이렉트 하는 로직 추가 가능
    createForm.style.display = createForm.style.display === 'block' ? 'none' : 'block';
  }
}

// 새 노트 생성 함수 (서버 연동)
async function createNote() { // async 키워드 추가
  const subject = document.getElementById('new-subject')?.value.trim();
  const professor = document.getElementById('new-professor')?.value.trim();
  const category = document.getElementById('new-category')?.value;
  const summary = document.getElementById('new-summary')?.value.trim();

  if (!subject || !summary) { // 교수명은 필수가 아닐 수 있으므로, 교과명과 요약만 필수로 체크 (정책에 따라 변경)
    alert('교과명과 요약 내용은 필수입니다.');
    return;
  }

  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject, professor, category, summary }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '노트 생성에 실패했습니다. 로그인 상태를 확인해주세요.');
    }

    const newNote = await response.json(); // 서버에서 반환된 노트 정보 (id 포함)
    console.log('서버에 노트 생성 성공:', newNote);

    alert('노트가 성공적으로 등록되었습니다.');
    loadInitialNotes(); // 노트 목록을 다시 로드하여 새 노트를 포함하여 화면 갱신

    // 입력 필드 초기화
    document.getElementById('new-subject').value = '';
    document.getElementById('new-professor').value = '';
    document.getElementById('new-category').value = '전공필수'; // 기본값
    document.getElementById('new-summary').value = '';

    showCreateForm(); // 생성 폼 숨기기

  } catch (error) {
    console.error('Error creating note:', error);
    alert(error.message);
  }
}

// DOM에 노트 카드를 추가하는 함수 (상세 페이지 링크에 ID 포함)
function addNoteToDOM(note) {
  const noteGrid = document.querySelector('.note-grid');
  if (!noteGrid) {
    console.error('.note-grid 요소를 찾을 수 없습니다.');
    return;
  }

  const card = document.createElement('div');
  card.className = 'note-card';
  card.setAttribute('data-note-id', note.id); // 서버에서 받은 note.id
  card.setAttribute('data-subject', (note.subject || '').toLowerCase());
  card.setAttribute('data-professor', (note.professor || '').toLowerCase());
  card.setAttribute('data-category', note.category || '');

  // 노트 카드 내부 HTML 구성
  card.innerHTML = `
    <a href="/note_detail.html?id=${note.id}"> <!-- 상세 페이지 링크에 note.id 전달 -->
      <h3>${note.subject || '제목 없음'} 노트</h3>
    </a>
    <p>${note.summary || '내용 없음'}</p>
    <div class="note-footer">
      작성자: ${note.authorName || '정보 없음'} | 
      이수구분: ${note.category || '정보 없음'}
    </div>
    <button onclick="location.href='/note_detail.html?id=${note.id}'">상세보기</button>
  `;
  // 다운로드 버튼은 현재 기능이 없으므로, 상세보기 버튼으로 대체하거나 필요시 별도 구현

  noteGrid.appendChild(card);
}

// 페이지 로드 시 서버에서 노트 목록을 불러와 표시하는 함수
async function loadInitialNotes() {
  const noteGrid = document.querySelector('.note-grid');
  if (!noteGrid) {
    console.error('.note-grid 요소를 찾을 수 없습니다.');
    return;
  }

  try {
    const response = await fetch('/api/notes'); // controller.js에 정의된 API 호출
    if (!response.ok) {
      throw new Error(`노트 목록 로드 실패: ${response.statusText}`);
    }
    const notes = await response.json();

    noteGrid.innerHTML = ''; // 기존 노트 목록 초기화 (예시 HTML 카드 제거)

    if (notes.length === 0) {
      noteGrid.innerHTML = '<p>표시할 노트가 없습니다. 새 노트를 추가해보세요!</p>';
    } else {
      notes.forEach(note => {
        addNoteToDOM(note); // 각 노트를 DOM에 추가
      });
    }
  } catch (error) {
    console.error('Error loading initial notes:', error);
    noteGrid.innerHTML = `<p>노트 목록을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
  }
}

// 필터 적용 함수 (클라이언트 측 필터링 예시 - 필요시 서버 측 필터링으로 개선)
function applyFilter() {
  console.log('Applying client-side filter...'); // 디버깅 로그 추가
  const filterSubjectValue = document.getElementById('filter-subject')?.value.toLowerCase().trim(); // 'filter-subject'로 수정
  const filterProfessorValue = document.getElementById('filter-professor')?.value.toLowerCase().trim(); // 'filter-professor'로 수정
  const filterCategoryValue = document.getElementById('filter-category')?.value.toLowerCase(); // 'filter-category'로 수정하고, 비교를 위해 소문자 처리

  console.log('Filter values:', { filterSubjectValue, filterProfessorValue, filterCategoryValue }); // 입력값 확인 로그

  const noteCards = document.querySelectorAll('.note-grid .note-card');

  noteCards.forEach(card => {
    const subject = card.getAttribute('data-subject') || ''; // data-subject는 이미 소문자로 저장되어 있다고 가정
    const professor = card.getAttribute('data-professor') || ''; // data-professor도 소문자로 저장
    const category = card.getAttribute('data-category') || ''; // data-category도 소문자로 저장 (addNoteToDOM 수정 필요할 수 있음)

    let subjectMatch = true;
    if (filterSubjectValue) {
      subjectMatch = subject.includes(filterSubjectValue);
    }

    let professorMatch = true;
    if (filterProfessorValue) {
      professorMatch = professor.includes(filterProfessorValue);
    }

    let categoryMatch = true;
    if (filterCategoryValue && filterCategoryValue !== "") { // "전체" (value="")가 아닌 경우에만 비교
      categoryMatch = category === filterCategoryValue;
    }

    console.log('Card data:', { subject, professor, category }, 'Matches:', { subjectMatch, professorMatch, categoryMatch }); // 각 카드 필터링 결과 로그

    if (subjectMatch && professorMatch && categoryMatch) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// (선택적) 메인 검색창 실시간 필터링 (간단 예시)
const mainSearchInput = document.querySelector('.search-bar input[type="text"]'); // index.html의 검색창 선택자 확인
if (mainSearchInput) {
  mainSearchInput.addEventListener('input', () => {
    const searchTerm = mainSearchInput.value.toLowerCase().trim();
    const noteCards = document.querySelectorAll('.note-grid .note-card');

    noteCards.forEach(card => {
      const subject = card.getAttribute('data-subject') || '';
      const professor = card.getAttribute('data-professor') || '';
      const summary = card.querySelector('p')?.textContent.toLowerCase() || '';

      if (subject.includes(searchTerm) || professor.includes(searchTerm) || summary.includes(searchTerm)) {
        card.style.display = 'flex'; // 또는 'block'
      } else {
        card.style.display = 'none';
      }
    });
  });
}


// 페이지 로드 완료 시 초기 작업 실행
// 이 부분은 index.html 파일의 <script> 태그 내에서 DOMContentLoaded 이벤트 리스너를 사용하는 것이 더 일반적입니다.
// 하지만 main.js 파일 최하단에 두면 대부분의 경우 DOM 로드 후 실행됩니다.
// 확실하게 하려면 index.html에서 호출하는 것이 좋습니다.
// 예:
// window.addEventListener('DOMContentLoaded', () => {
//   loadInitialNotes();
//   // 기타 초기화 함수들...
// });
// 여기서는 main.js가 로드된 후 바로 실행되도록 합니다.
loadInitialNotes();