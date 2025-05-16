import * as pdfjsLib from '../pdfjs/pdf.mjs';

const url = './files/data_structure_mid_summary.pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.mjs';

pdfjsLib.getDocument(url).promise.then(function (pdfDoc) {
    return pdfDoc.getPage(1);
}).then(function (page) {
    const scale = 1.5;
    const viewport = page.getViewport({ scale: scale });

    const canvas = document.getElementById('pdf-canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    page.render(renderContext);
});