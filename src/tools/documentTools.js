import { PDFDocument } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker path to CDN to avoid bundler setup issues
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export function initDocumentTool(toolId, container, helpers) {
  container.innerHTML = '';
  
  switch (toolId) {
    case 'pdf-merger':
      renderPdfMerger(container, helpers);
      break;
    case 'pdf-splitter':
      renderPdfSplitter(container, helpers);
      break;
    case 'pdf-compressor':
      renderPdfCompressor(container, helpers);
      break;
    case 'pdf-to-image':
      renderPdfToImage(container, helpers);
      break;
    case 'image-to-pdf':
      renderImageToPdf(container, helpers);
      break;
    case 'pdf-protector':
      renderPdfProtector(container, helpers);
      break;
    case 'pdf-unlocker':
      renderPdfUnlocker(container, helpers);
      break;
    default:
      container.innerHTML = `<p>Tool "${toolId}" is under construction.</p>`;
  }
}

// 1. PDF Merger
function renderPdfMerger(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="pdfDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        <span class="dropzone-text">Drag & drop multiple PDF files or click to upload</span>
        <span class="dropzone-subtext">Merge them in the order they are listed</span>
        <input type="file" id="pdfFileInput" class="file-input" accept="application/pdf" multiple />
      </div>
      <div class="file-list" id="pdfFileList"></div>
      <div class="control-group" style="display: none;" id="mergerActions">
        <button class="action-btn" id="mergeBtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V12h10"/><path d="M12 2v10H2"/><path d="m17 7-5 5-5-5"/></svg>
          Merge PDFs
        </button>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#pdfDropzone');
  const fileInput = container.querySelector('#pdfFileInput');
  const fileList = container.querySelector('#pdfFileList');
  const mergerActions = container.querySelector('#mergerActions');
  const mergeBtn = container.querySelector('#mergeBtn');
  
  let filesArr = [];

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      helpers.showToast('Please select valid PDF files.', 'warning');
      return;
    }
    
    filesArr = [...filesArr, ...pdfFiles];
    renderFiles();
  });

  function renderFiles() {
    fileList.innerHTML = '';
    if (filesArr.length > 0) {
      mergerActions.style.display = 'block';
      filesArr.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <div class="file-info">
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${helpers.formatBytes(file.size)})</span>
          </div>
          <div class="file-actions">
            <button class="btn-icon move-up" title="Move Up" ${index === 0 ? 'disabled' : ''}>▲</button>
            <button class="btn-icon move-down" title="Move Down" ${index === filesArr.length - 1 ? 'disabled' : ''}>▼</button>
            <button class="btn-icon delete" title="Remove">✕</button>
          </div>
        `;

        item.querySelector('.move-up').onclick = () => {
          if (index > 0) {
            const temp = filesArr[index];
            filesArr[index] = filesArr[index - 1];
            filesArr[index - 1] = temp;
            renderFiles();
          }
        };

        item.querySelector('.move-down').onclick = () => {
          if (index < filesArr.length - 1) {
            const temp = filesArr[index];
            filesArr[index] = filesArr[index + 1];
            filesArr[index + 1] = temp;
            renderFiles();
          }
        };

        item.querySelector('.delete').onclick = () => {
          filesArr.splice(index, 1);
          renderFiles();
        };

        fileList.appendChild(item);
      });
    } else {
      mergerActions.style.display = 'none';
    }
  }

  mergeBtn.onclick = async () => {
    if (filesArr.length < 2) {
      helpers.showToast('Select at least 2 PDF files to merge.', 'warning');
      return;
    }

    helpers.showProgress(10);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < filesArr.length; i++) {
        const file = filesArr[i];
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        
        helpers.showProgress(Math.floor(10 + (80 * (i + 1) / filesArr.length)));
      }

      const mergedPdfBytes = await mergedPdf.save();
      helpers.downloadFile(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'merged.pdf');
      helpers.showToast('PDFs merged successfully!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Error merging PDFs: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };
}

// 2. PDF Splitter
function renderPdfSplitter(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="splitDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="12" y2="12"/></svg>
        <span class="dropzone-text">Upload a PDF file to split</span>
        <input type="file" id="splitFileInput" class="file-input" accept="application/pdf" />
      </div>
      <div id="splitterConfig" style="display: none; margin-top: 20px;">
        <div class="file-item">
          <div class="file-info">
            <span class="file-name" id="splitFileName"></span>
            <span class="file-size" id="splitFilePages"></span>
          </div>
          <button class="btn-icon delete" id="clearSplitFile">✕</button>
        </div>
        
        <div class="control-group">
          <div class="control-row">
            <div class="control-item">
              <label>Split Method</label>
              <select class="input-select" id="splitMethod">
                <option value="all">Extract all pages (Separate files)</option>
                <option value="range">Extract page range</option>
              </select>
            </div>
            <div class="control-item" id="rangeInputs" style="display: none;">
              <label>Page Range (e.g. 1-3, 5)</label>
              <input type="text" class="input-text" id="pageRange" placeholder="e.g. 1-3, 5" />
            </div>
          </div>
          <button class="action-btn" id="splitBtn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V12h10"/><path d="M12 2v10H2"/></svg>
            Split PDF
          </button>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#splitDropzone');
  const fileInput = container.querySelector('#splitFileInput');
  const configSection = container.querySelector('#splitterConfig');
  const fileNameSpan = container.querySelector('#splitFileName');
  const filePagesSpan = container.querySelector('#splitFilePages');
  const clearBtn = container.querySelector('#clearSplitFile');
  const splitMethod = container.querySelector('#splitMethod');
  const rangeInputs = container.querySelector('#rangeInputs');
  const pageRange = container.querySelector('#pageRange');
  const splitBtn = container.querySelector('#splitBtn');

  let activeFile = null;
  let pageCount = 0;

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type === 'application/pdf') {
      activeFile = files[0];
      try {
        const bytes = await activeFile.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        pageCount = pdf.getPageCount();
        
        dropzone.style.display = 'none';
        configSection.style.display = 'block';
        fileNameSpan.textContent = activeFile.name;
        filePagesSpan.textContent = `(${pageCount} pages, ${helpers.formatBytes(activeFile.size)})`;
      } catch (err) {
        helpers.showToast('Could not load PDF file: ' + err.message, 'error');
      }
    } else {
      helpers.showToast('Select a valid PDF file.', 'warning');
    }
  });

  splitMethod.onchange = () => {
    rangeInputs.style.display = splitMethod.value === 'range' ? 'flex' : 'none';
  };

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    configSection.style.display = 'none';
    fileInput.value = '';
  };

  splitBtn.onclick = async () => {
    if (!activeFile) return;
    helpers.showProgress(20);
    
    try {
      const bytes = await activeFile.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);

      if (splitMethod.value === 'range') {
        const rangeText = pageRange.value.trim();
        if (!rangeText) {
          helpers.showToast('Please specify a page range.', 'warning');
          helpers.hideProgress();
          return;
        }

        const pagesToExtract = parsePageRange(rangeText, pageCount);
        if (pagesToExtract.length === 0) {
          helpers.showToast('Invalid page range specified.', 'error');
          helpers.hideProgress();
          return;
        }

        const newPdf = await PDFDocument.create();
        // Pages are 0-indexed in pdf-lib
        const copiedPages = await newPdf.copyPages(srcPdf, pagesToExtract.map(p => p - 1));
        copiedPages.forEach(p => newPdf.addPage(p));

        const outBytes = await newPdf.save();
        helpers.downloadFile(new Blob([outBytes], { type: 'application/pdf' }), `extracted_${activeFile.name}`);
        helpers.showToast('Range extracted successfully!');
      } else {
        // Extract all pages as zip/multiple files (since zip library adds overhead, we can download pages one by one or create individual downloads)
        // Let's trigger a batch of individual downloads, informing the user.
        helpers.showToast('Splitting and downloading pages...');
        for (let i = 0; i < pageCount; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
          newPdf.addPage(copiedPage);
          const outBytes = await newPdf.save();
          helpers.downloadFile(new Blob([outBytes], { type: 'application/pdf' }), `${activeFile.name.replace('.pdf', '')}_page_${i + 1}.pdf`);
          
          helpers.showProgress(Math.floor(20 + (80 * (i + 1) / pageCount)));
        }
      }
    } catch (err) {
      console.error(err);
      helpers.showToast('Error splitting PDF: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };

  function parsePageRange(text, maxPages) {
    const pages = new Set();
    const parts = text.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const range = trimmed.split('-');
        const start = parseInt(range[0]);
        const end = parseInt(range[1]);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= maxPages) pages.add(i);
          }
        }
      } else {
        const p = parseInt(trimmed);
        if (!isNaN(p) && p >= 1 && p <= maxPages) {
          pages.add(p);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  }
}

// 3. PDF Compressor
function renderPdfCompressor(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="compressDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        <span class="dropzone-text">Upload PDF to compress</span>
        <input type="file" id="compressFileInput" class="file-input" accept="application/pdf" />
      </div>
      <div id="compressorConfig" style="display: none; margin-top: 20px;">
        <div class="file-item">
          <div class="file-info">
            <span class="file-name" id="compressFileName"></span>
            <span class="file-size" id="compressFileSize"></span>
          </div>
          <button class="btn-icon delete" id="clearCompressFile">✕</button>
        </div>
        
        <div class="control-group">
          <div class="control-item">
            <label>Compression Level (Live Preview size adjusts based on quality)</label>
            <div class="slider-container">
              <input type="range" class="range-slider" id="compressionQuality" min="10" max="100" value="70" />
              <span class="slider-val" id="qualityVal">70%</span>
            </div>
            <span class="dropzone-subtext" style="margin-top: 4px;">Lower quality creates smaller file sizes by re-rendering pages onto dynamic high-compression canvases.</span>
          </div>
          <button class="action-btn" id="compressBtn">
            Compress & Download
          </button>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#compressDropzone');
  const fileInput = container.querySelector('#compressFileInput');
  const configSection = container.querySelector('#compressorConfig');
  const fileNameSpan = container.querySelector('#compressFileName');
  const fileSizeSpan = container.querySelector('#compressFileSize');
  const clearBtn = container.querySelector('#clearCompressFile');
  const qualitySlider = container.querySelector('#compressionQuality');
  const qualityVal = container.querySelector('#qualityVal');
  const compressBtn = container.querySelector('#compressBtn');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0 && files[0].type === 'application/pdf') {
      activeFile = files[0];
      dropzone.style.display = 'none';
      configSection.style.display = 'block';
      fileNameSpan.textContent = activeFile.name;
      fileSizeSpan.textContent = `(${helpers.formatBytes(activeFile.size)})`;
    }
  });

  qualitySlider.oninput = () => {
    qualityVal.textContent = `${qualitySlider.value}%`;
  };

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    configSection.style.display = 'none';
    fileInput.value = '';
  };

  compressBtn.onclick = async () => {
    if (!activeFile) return;
    helpers.showProgress(10);
    
    try {
      const fileBytes = await activeFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileBytes }).promise;
      const numPages = pdf.numPages;
      const quality = parseInt(qualitySlider.value) / 100;
      
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'px',
        compress: true // Enables internal PDF compression stream
      });

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        // Base compression scale on quality slider
        const viewport = page.getViewport({ scale: quality * 2.0 }); 
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        // Output compressed JPEG
        const imgData = canvas.toDataURL('image/jpeg', quality);
        
        if (i > 1) {
          doc.addPage([viewport.width, viewport.height]);
        } else {
          doc.deletePage(1); // Default page
          doc.addPage([viewport.width, viewport.height]);
        }
        
        doc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height, undefined, 'FAST');
        
        helpers.showProgress(Math.floor(10 + (90 * i / numPages)));
      }

      const compressedBlob = doc.output('blob');
      helpers.downloadFile(compressedBlob, `compressed_${activeFile.name}`);
      helpers.showToast(`Compressed! Final size: ${helpers.formatBytes(compressedBlob.size)} (Saved ${Math.floor(100 - (100 * compressedBlob.size / activeFile.size))}%!)`);
    } catch (err) {
      console.error(err);
      helpers.showToast('Error compressing PDF: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };
}

// 4. PDF to Image
function renderPdfToImage(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="pdf2ImgDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><rect width="12" height="12" x="2" y="2" rx="2"/><circle cx="6" cy="6" r="1"/><path d="m14 14-3.086-3.086a2 2 0 0 0-2.828 0L3 16"/></svg>
        <span class="dropzone-text">Upload PDF to convert pages to images</span>
        <input type="file" id="pdf2ImgFileInput" class="file-input" accept="application/pdf" />
      </div>
      <div id="pdf2ImgConfig" style="display: none; margin-top: 20px;">
        <div class="file-item">
          <div class="file-info">
            <span class="file-name" id="pdf2ImgFileName"></span>
            <span class="file-size" id="pdf2ImgPages"></span>
          </div>
          <button class="btn-icon delete" id="clearPdf2Img">✕</button>
        </div>
        
        <div class="control-group">
          <div class="control-row">
            <div class="control-item">
              <label>Export Format</label>
              <select class="input-select" id="imgFormat">
                <option value="png">PNG (Lossless)</option>
                <option value="jpeg">JPEG (Smaller file size)</option>
              </select>
            </div>
            <div class="control-item">
              <label>DPI/Scale</label>
              <select class="input-select" id="pdfDPI">
                <option value="1">1x (Default Resolution)</option>
                <option value="2" selected>2x (High Definition)</option>
                <option value="3">3x (Ultra HD)</option>
              </select>
            </div>
          </div>
          <button class="action-btn" id="convertPdf2ImgBtn">
            Convert Pages to Images
          </button>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#pdf2ImgDropzone');
  const fileInput = container.querySelector('#pdf2ImgFileInput');
  const configSection = container.querySelector('#pdf2ImgConfig');
  const fileNameSpan = container.querySelector('#pdf2ImgFileName');
  const filePagesSpan = container.querySelector('#pdf2ImgPages');
  const clearBtn = container.querySelector('#clearPdf2Img');
  const imgFormat = container.querySelector('#imgFormat');
  const pdfDpi = container.querySelector('#pdfDPI');
  const convertBtn = container.querySelector('#convertPdf2ImgBtn');

  let activeFile = null;
  let pdfPages = 0;

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type === 'application/pdf') {
      activeFile = files[0];
      try {
        const fileBytes = await activeFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: fileBytes }).promise;
        pdfPages = pdf.numPages;
        
        dropzone.style.display = 'none';
        configSection.style.display = 'block';
        fileNameSpan.textContent = activeFile.name;
        filePagesSpan.textContent = `(${pdfPages} pages)`;
      } catch (err) {
        helpers.showToast('Error reading PDF: ' + err.message, 'error');
      }
    }
  });

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    configSection.style.display = 'none';
    fileInput.value = '';
  };

  convertBtn.onclick = async () => {
    if (!activeFile) return;
    helpers.showProgress(10);
    
    try {
      const fileBytes = await activeFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileBytes }).promise;
      const format = imgFormat.value;
      const scale = parseFloat(pdfDpi.value);

      for (let i = 1; i <= pdfPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scale });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        // Export image
        const imgMime = format === 'png' ? 'image/png' : 'image/jpeg';
        const imgUrl = canvas.toDataURL(imgMime, 0.92);
        
        // Trigger download of this page
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        helpers.downloadFile(blob, `${activeFile.name.replace('.pdf', '')}_page_${i}.${format}`);
        
        helpers.showProgress(Math.floor(10 + (90 * i / pdfPages)));
      }
      
      helpers.showToast('All pages converted and downloaded!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Error converting PDF: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };
}

// 5. Image to PDF
function renderImageToPdf(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="img2PdfDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        <span class="dropzone-text">Drag & drop image files (JPG, PNG, WebP) or click to upload</span>
        <input type="file" id="img2PdfFileInput" class="file-input" accept="image/*" multiple />
      </div>
      <div class="file-list" id="img2PdfFileList"></div>
      <div class="control-group" style="display: none;" id="img2PdfActions">
        <div class="control-row">
          <div class="control-item">
            <label>Page Margins</label>
            <select class="input-select" id="pdfMargins">
              <option value="none">No Margins (Full Bleed)</option>
              <option value="small" selected>Small Margins (10px)</option>
              <option value="large">Large Margins (24px)</option>
            </select>
          </div>
          <div class="control-item">
            <label>Page Size</label>
            <select class="input-select" id="pdfPageSize">
              <option value="original">Original Image Dimensions</option>
              <option value="a4">Standard A4 (Fit Page)</option>
            </select>
          </div>
        </div>
        <button class="action-btn" id="generatePdfBtn">
          Convert to PDF
        </button>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#img2PdfDropzone');
  const fileInput = container.querySelector('#img2PdfFileInput');
  const fileList = container.querySelector('#img2PdfFileList');
  const actions = container.querySelector('#img2PdfActions');
  const generateBtn = container.querySelector('#generatePdfBtn');
  const marginsSelect = container.querySelector('#pdfMargins');
  const pageSizeSelect = container.querySelector('#pdfPageSize');

  let imageFiles = [];

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (images.length === 0) {
      helpers.showToast('Please select valid image files.', 'warning');
      return;
    }
    
    imageFiles = [...imageFiles, ...images];
    renderImagesList();
  });

  function renderImagesList() {
    fileList.innerHTML = '';
    if (imageFiles.length > 0) {
      actions.style.display = 'block';
      imageFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <div class="file-info">
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${helpers.formatBytes(file.size)})</span>
          </div>
          <div class="file-actions">
            <button class="btn-icon move-up" title="Move Up" ${index === 0 ? 'disabled' : ''}>▲</button>
            <button class="btn-icon move-down" title="Move Down" ${index === imageFiles.length - 1 ? 'disabled' : ''}>▼</button>
            <button class="btn-icon delete" title="Remove">✕</button>
          </div>
        `;

        item.querySelector('.move-up').onclick = () => {
          if (index > 0) {
            const temp = imageFiles[index];
            imageFiles[index] = imageFiles[index - 1];
            imageFiles[index - 1] = temp;
            renderImagesList();
          }
        };

        item.querySelector('.move-down').onclick = () => {
          if (index < imageFiles.length - 1) {
            const temp = imageFiles[index];
            imageFiles[index] = imageFiles[index + 1];
            imageFiles[index + 1] = temp;
            renderImagesList();
          }
        };

        item.querySelector('.delete').onclick = () => {
          imageFiles.splice(index, 1);
          renderImagesList();
        };

        fileList.appendChild(item);
      });
    } else {
      actions.style.display = 'none';
    }
  }

  generateBtn.onclick = async () => {
    if (imageFiles.length === 0) return;
    helpers.showProgress(10);
    
    try {
      const marginType = marginsSelect.value;
      const sizeType = pageSizeSelect.value;
      
      let margin = 0;
      if (marginType === 'small') margin = 10;
      else if (marginType === 'large') margin = 24;

      const pdf = new jsPDF({ orientation: 'p', unit: 'px' });
      pdf.deletePage(1); // Clear defaults

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // Renders image dimensions via loading HTML Image
        const imgUrl = URL.createObjectURL(file);
        const dimensions = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.src = imgUrl;
        });

        let targetW = dimensions.w;
        let targetH = dimensions.h;

        if (sizeType === 'a4') {
          // A4 dimensions at standard 72 DPI are ~595x842px
          const a4W = 595;
          const a4H = 842;
          
          const maxW = a4W - margin * 2;
          const maxH = a4H - margin * 2;
          const ratio = Math.min(maxW / targetW, maxH / targetH);
          
          targetW = targetW * ratio;
          targetH = targetH * ratio;
          
          pdf.addPage([a4W, a4H]);
        } else {
          // Fit page to image bounds
          pdf.addPage([targetW + margin * 2, targetH + margin * 2]);
        }

        // Convert file to Base64 to insert
        const base64Img = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });

        pdf.addImage(base64Img, 'JPEG', margin, margin, targetW, targetH);
        URL.revokeObjectURL(imgUrl);
        
        helpers.showProgress(Math.floor(10 + (90 * (i + 1) / imageFiles.length)));
      }

      helpers.downloadFile(pdf.output('blob'), 'images_compiled.pdf');
      helpers.showToast('Images successfully converted to PDF!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Error converting images: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };
}

// 6. PDF Password Protector
function renderPdfProtector(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="protectDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span class="dropzone-text">Upload PDF to encrypt</span>
        <input type="file" id="protectFileInput" class="file-input" accept="application/pdf" />
      </div>
      
      <div id="protectConfig" style="display: none; margin-top: 20px;">
        <div class="file-item">
          <div class="file-info">
            <span class="file-name" id="protectFileName"></span>
            <span class="file-size" id="protectFileSize"></span>
          </div>
          <button class="btn-icon delete" id="clearProtectFile">✕</button>
        </div>
        
        <div class="control-group">
          <div class="control-row">
            <div class="control-item">
              <label>Set User Password (Required to view PDF)</label>
              <input type="password" class="input-text" id="pdfUserPassword" placeholder="Enter password to secure file" />
            </div>
            <div class="control-item">
              <label>Set Owner/Admin Password (Optional)</label>
              <input type="password" class="input-text" id="pdfOwnerPassword" placeholder="Owner privileges password" />
            </div>
          </div>
          <button class="action-btn" id="encryptPdfBtn">
            Encrypt & Secure PDF
          </button>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#protectDropzone');
  const fileInput = container.querySelector('#protectFileInput');
  const config = container.querySelector('#protectConfig');
  const fileName = container.querySelector('#protectFileName');
  const fileSize = container.querySelector('#protectFileSize');
  const clearBtn = container.querySelector('#clearProtectFile');
  const userPass = container.querySelector('#pdfUserPassword');
  const ownerPass = container.querySelector('#pdfOwnerPassword');
  const encryptBtn = container.querySelector('#encryptPdfBtn');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0 && files[0].type === 'application/pdf') {
      activeFile = files[0];
      dropzone.style.display = 'none';
      config.style.display = 'block';
      fileName.textContent = activeFile.name;
      fileSize.textContent = `(${helpers.formatBytes(activeFile.size)})`;
    }
  });

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
    userPass.value = '';
    ownerPass.value = '';
  };

  encryptBtn.onclick = async () => {
    if (!activeFile) return;
    const password = userPass.value;
    if (!password) {
      helpers.showToast('User password cannot be empty.', 'warning');
      return;
    }

    helpers.showProgress(30);
    try {
      const arrayBuffer = await activeFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      helpers.showProgress(60);
      const encryptedPdfBytes = await pdfDoc.save({
        userPassword: password,
        ownerPassword: ownerPass.value || password,
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false,
        }
      });

      helpers.downloadFile(new Blob([encryptedPdfBytes], { type: 'application/pdf' }), `secured_${activeFile.name}`);
      helpers.showToast('PDF encrypted successfully!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Encryption failed: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };
}

// 7. PDF Password Unlocker
function renderPdfUnlocker(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="unlockDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
        <span class="dropzone-text">Upload a password-protected PDF to unlock</span>
        <input type="file" id="unlockFileInput" class="file-input" accept="application/pdf" />
      </div>
      
      <div id="unlockConfig" style="display: none; margin-top: 20px;">
        <div class="file-item">
          <div class="file-info">
            <span class="file-name" id="unlockFileName"></span>
            <span class="file-size" id="unlockFileSize"></span>
          </div>
          <button class="btn-icon delete" id="clearUnlockFile">✕</button>
        </div>
        
        <div class="control-group">
          <div class="control-item">
            <label>Password (You must own rights or know password)</label>
            <input type="password" class="input-text" id="pdfUnlockPassword" placeholder="Enter PDF password to decrypt" />
          </div>
          <button class="action-btn" id="decryptPdfBtn">
            Decrypt & Download Unlocked File
          </button>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#unlockDropzone');
  const fileInput = container.querySelector('#unlockFileInput');
  const config = container.querySelector('#unlockConfig');
  const fileName = container.querySelector('#unlockFileName');
  const fileSize = container.querySelector('#unlockFileSize');
  const clearBtn = container.querySelector('#clearUnlockFile');
  const unlockPassword = container.querySelector('#pdfUnlockPassword');
  const decryptBtn = container.querySelector('#decryptPdfBtn');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0 && files[0].type === 'application/pdf') {
      activeFile = files[0];
      dropzone.style.display = 'none';
      config.style.display = 'block';
      fileName.textContent = activeFile.name;
      fileSize.textContent = `(${helpers.formatBytes(activeFile.size)})`;
    }
  });

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
    unlockPassword.value = '';
  };

  decryptBtn.onclick = async () => {
    if (!activeFile) return;
    const password = unlockPassword.value;
    if (!password) {
      helpers.showToast('Please enter the password.', 'warning');
      return;
    }

    helpers.showProgress(30);
    try {
      const arrayBuffer = await activeFile.arrayBuffer();
      // Try loading with the specified password
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: password });
      
      helpers.showProgress(70);
      // Saving without options decrypts user/owner restrictions
      const decryptedBytes = await pdfDoc.save();

      helpers.downloadFile(new Blob([decryptedBytes], { type: 'application/pdf' }), `unlocked_${activeFile.name}`);
      helpers.showToast('PDF unlocked and saved successfully!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Decrypt failed. Check password and try again.', 'error');
    } finally {
      helpers.hideProgress();
    }
  };
}
