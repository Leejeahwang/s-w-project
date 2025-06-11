import * as pdfjsLib from '/pdfjs/pdf.mjs';

const url = window.pdfUrl;  // EJS에서 전달된 경로
// const url = '/files/프언 2014년 중간고사.pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';

pdfjsLib.getDocument(url).promise.then(function (pdfDoc) {
  return pdfDoc.getPage(1);
}).then(function (page) {
  const scale = 1.5;
  const viewport = page.getViewport({ scale });

  const canvas = document.getElementById('pdf-canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };

  page.render(renderContext);
}).catch(function (err) {
  console.error('PDF 로드 실패:', err);
});
