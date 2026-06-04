export function initImageTool(toolId, container, helpers) {
  container.innerHTML = '';

  switch (toolId) {
    case 'image-resizer':
      renderImageResizer(container, helpers);
      break;
    case 'image-compressor':
      renderImageCompressor(container, helpers);
      break;
    case 'bg-remover':
      renderBgRemover(container, helpers);
      break;
    case 'image-cropper':
      renderImageCropper(container, helpers);
      break;
    case 'watermark-adder':
      renderWatermarkAdder(container, helpers);
      break;
    case 'image-converter':
      renderImageConverter(container, helpers);
      break;
    case 'screenshot-beautifier':
      renderScreenshotBeautifier(container, helpers);
      break;
    default:
      container.innerHTML = `<p>Image tool "${toolId}" is under construction.</p>`;
  }
}

// Global helper to load image file to HTMLImageElement
function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 1. Image Resizer
function renderImageResizer(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="resizeDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3 14 10"/><path d="m3 21 7-7"/></svg>
        <span class="dropzone-text">Upload Image to Resize</span>
        <input type="file" id="resizeFileInput" class="file-input" accept="image/*" />
      </div>
      
      <div id="resizeConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="resizeFileName"></span>
                <span class="file-size" id="resizeFileDim"></span>
              </div>
              <button class="btn-icon delete" id="clearResizeFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-row">
                <div class="control-item">
                  <label>Width (px)</label>
                  <input type="number" class="input-text" id="resizeWidth" />
                </div>
                <div class="control-item">
                  <label>Height (px)</label>
                  <input type="number" class="input-text" id="resizeHeight" />
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="lockAspect" checked />
                <label for="lockAspect" style="font-size: 0.85rem; font-weight: 600; cursor:pointer;">Lock Aspect Ratio</label>
              </div>
              <button class="action-btn" id="resizeBtn">Resize & Download</button>
            </div>
          </div>
          
          <div class="preview-container">
            <img class="preview-img" id="resizePreview" />
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#resizeDropzone');
  const fileInput = container.querySelector('#resizeFileInput');
  const config = container.querySelector('#resizeConfig');
  const fileName = container.querySelector('#resizeFileName');
  const fileDim = container.querySelector('#resizeFileDim');
  const clearBtn = container.querySelector('#clearResizeFile');
  const widthInput = container.querySelector('#resizeWidth');
  const heightInput = container.querySelector('#resizeHeight');
  const lockAspect = container.querySelector('#lockAspect');
  const resizeBtn = container.querySelector('#resizeBtn');
  const previewImg = container.querySelector('#resizePreview');

  let activeImg = null;
  let aspect = 1;
  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      activeFile = files[0];
      helpers.showProgress(30);
      try {
        activeImg = await loadImageFile(activeFile);
        aspect = activeImg.width / activeImg.height;

        dropzone.style.display = 'none';
        config.style.display = 'block';
        fileName.textContent = activeFile.name;
        fileDim.textContent = `(${activeImg.width}x${activeImg.height}px)`;
        widthInput.value = activeImg.width;
        heightInput.value = activeImg.height;
        previewImg.src = activeImg.src;
      } catch (err) {
        helpers.showToast('Could not load image file: ' + err.message, 'error');
      } finally {
        helpers.hideProgress();
      }
    }
  });

  widthInput.oninput = () => {
    if (lockAspect.checked && aspect) {
      heightInput.value = Math.round(widthInput.value / aspect);
    }
  };

  heightInput.oninput = () => {
    if (lockAspect.checked && aspect) {
      widthInput.value = Math.round(heightInput.value * aspect);
    }
  };

  clearBtn.onclick = () => {
    activeImg = null;
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
  };

  resizeBtn.onclick = () => {
    if (!activeImg) return;
    const w = parseInt(widthInput.value);
    const h = parseInt(heightInput.value);
    if (!w || !h || w <= 0 || h <= 0) {
      helpers.showToast('Enter valid dimensions.', 'warning');
      return;
    }

    helpers.showProgress(40);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    // Enable image smoothing for high quality scale down
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(activeImg, 0, 0, w, h);

    helpers.showProgress(85);
    canvas.toBlob((blob) => {
      helpers.downloadFile(blob, `resized_${activeFile.name}`);
      helpers.hideProgress();
      helpers.showToast('Image resized successfully!');
    }, activeFile.type, 0.92);
  };
}

// 2. Image Compressor
function renderImageCompressor(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="compressDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10 21 3"/><path d="m10 14-7 7"/></svg>
        <span class="dropzone-text">Upload Image to Compress</span>
        <input type="file" id="compressFileInput" class="file-input" accept="image/*" />
      </div>
      
      <div id="compressConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="compressFileName"></span>
                <span class="file-size" id="compressFileSize"></span>
              </div>
              <button class="btn-icon delete" id="clearCompressFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-item">
                <label>Target Quality (JPEG / WebP)</label>
                <div class="slider-container">
                  <input type="range" class="range-slider" id="imageQuality" min="5" max="100" value="75" />
                  <span class="slider-val" id="qualityLabel">75%</span>
                </div>
              </div>
              <div id="compressRatio" class="dropzone-subtext" style="font-weight: 600;"></div>
              <button class="action-btn" id="compressImageBtn">Compress & Download</button>
            </div>
          </div>
          
          <div class="preview-container">
            <img class="preview-img" id="compressPreview" />
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#compressDropzone');
  const fileInput = container.querySelector('#compressFileInput');
  const config = container.querySelector('#compressConfig');
  const fileName = container.querySelector('#compressFileName');
  const fileSize = container.querySelector('#compressFileSize');
  const clearBtn = container.querySelector('#clearCompressFile');
  const qualitySlider = container.querySelector('#imageQuality');
  const qualityLabel = container.querySelector('#qualityLabel');
  const compressRatio = container.querySelector('#compressRatio');
  const compressBtn = container.querySelector('#compressImageBtn');
  const previewImg = container.querySelector('#compressPreview');

  let activeImg = null;
  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      activeFile = files[0];
      helpers.showProgress(30);
      try {
        activeImg = await loadImageFile(activeFile);
        dropzone.style.display = 'none';
        config.style.display = 'block';
        fileName.textContent = activeFile.name;
        fileSize.textContent = `(${helpers.formatBytes(activeFile.size)})`;
        previewImg.src = activeImg.src;
        runLiveCompression();
      } catch (err) {
        helpers.showToast('Could not load image: ' + err.message, 'error');
      } finally {
        helpers.hideProgress();
      }
    }
  });

  qualitySlider.oninput = () => {
    qualityLabel.textContent = `${qualitySlider.value}%`;
    runLiveCompression();
  };

  function runLiveCompression() {
    if (!activeImg) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = activeImg.width;
    canvas.height = activeImg.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(activeImg, 0, 0);

    const format = activeFile.type === 'image/png' ? 'image/jpeg' : activeFile.type; // PNG compressor shifts to JPG to allow actual compression, WebP remains WebP
    const q = parseInt(qualitySlider.value) / 100;
    
    canvas.toBlob((blob) => {
      if (blob) {
        previewImg.src = URL.createObjectURL(blob);
        const saved = Math.round(100 - (100 * blob.size / activeFile.size));
        compressRatio.innerHTML = `Estimated Compressed Size: <span style="color:var(--cat-img)">${helpers.formatBytes(blob.size)}</span> (${saved > 0 ? 'Saved ' + saved + '%' : 'No savings'})`;
      }
    }, format, q);
  }

  clearBtn.onclick = () => {
    activeImg = null;
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
  };

  compressBtn.onclick = () => {
    if (!activeImg) return;
    helpers.showProgress(40);
    const canvas = document.createElement('canvas');
    canvas.width = activeImg.width;
    canvas.height = activeImg.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(activeImg, 0, 0);

    const format = activeFile.type === 'image/png' ? 'image/jpeg' : activeFile.type;
    const q = parseInt(qualitySlider.value) / 100;
    const ext = format.split('/')[1];

    canvas.toBlob((blob) => {
      helpers.downloadFile(blob, `compressed_${activeFile.name.split('.')[0]}.${ext}`);
      helpers.hideProgress();
      helpers.showToast('Image compressed successfully!');
    }, format, q);
  };
}

// 3. Background Remover (Chroma key / Color picker algorithm)
function renderBgRemover(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="bgDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span class="dropzone-text">Upload Image to Remove Background</span>
        <span class="dropzone-subtext">Click on the background in preview to select the color to erase</span>
        <input type="file" id="bgFileInput" class="file-input" accept="image/*" />
      </div>
      
      <div id="bgConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="bgFileName"></span>
              </div>
              <button class="btn-icon delete" id="clearBgFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-item">
                <label>Selected Background Color</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input type="color" id="bgColorPicker" value="#ffffff" style="border: none; border-radius: 4px; width: 44px; height: 36px; cursor: pointer;" />
                  <span id="colorHexText" style="font-family: var(--font-mono); font-size: 0.9rem;">#ffffff</span>
                </div>
              </div>
              <div class="control-item">
                <label>Tolerance (Color Distance)</label>
                <div class="slider-container">
                  <input type="range" class="range-slider" id="bgTolerance" min="1" max="150" value="30" />
                  <span class="slider-val" id="toleranceVal">30</span>
                </div>
              </div>
              <div class="control-item">
                <label>Edge Feather (Alpha Smoothness)</label>
                <div class="slider-container">
                  <input type="range" class="range-slider" id="bgFeather" min="0" max="20" value="2" />
                  <span class="slider-val" id="featherVal">2px</span>
                </div>
              </div>
              <button class="action-btn" id="bgRemoveBtn">Erase & Download PNG</button>
            </div>
          </div>
          
          <div class="preview-container" style="flex-direction: column;">
            <span class="dropzone-subtext" style="margin-bottom: 8px; font-weight:600;">Click on image below to eyedrop target background color:</span>
            <canvas id="bgCanvas" style="max-width: 100%; height: auto; cursor: crosshair; background: repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 20px 20px; border-radius: var(--radius-md);"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#bgDropzone');
  const fileInput = container.querySelector('#bgFileInput');
  const config = container.querySelector('#bgConfig');
  const fileName = container.querySelector('#bgFileName');
  const clearBtn = container.querySelector('#clearBgFile');
  const colorPicker = container.querySelector('#bgColorPicker');
  const colorHexText = container.querySelector('#colorHexText');
  const toleranceSlider = container.querySelector('#bgTolerance');
  const toleranceVal = container.querySelector('#toleranceVal');
  const featherSlider = container.querySelector('#bgFeather');
  const featherVal = container.querySelector('#featherVal');
  const removeBtn = container.querySelector('#bgRemoveBtn');
  const canvas = container.querySelector('#bgCanvas');
  const ctx = canvas.getContext('2d');

  let activeImg = null;
  let activeFile = null;
  let targetColor = { r: 255, g: 255, b: 255 };

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      activeFile = files[0];
      helpers.showProgress(35);
      try {
        activeImg = await loadImageFile(activeFile);
        
        dropzone.style.display = 'none';
        config.style.display = 'block';
        fileName.textContent = activeFile.name;
        
        canvas.width = activeImg.width;
        canvas.height = activeImg.height;
        ctx.drawImage(activeImg, 0, 0);

        // Auto eyedrop color from top left corner
        const imgData = ctx.getImageData(2, 2, 1, 1).data;
        targetColor = { r: imgData[0], g: imgData[1], b: imgData[2] };
        updateColorDisplay(targetColor.r, targetColor.g, targetColor.b);

        applyBackgroundRemoval();
      } catch (err) {
        helpers.showToast('Could not load image: ' + err.message, 'error');
      } finally {
        helpers.hideProgress();
      }
    }
  });

  canvas.onclick = (e) => {
    if (!activeImg) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = Math.floor((e.clientX - rect.left) * scaleX);
    const clickY = Math.floor((e.clientY - rect.top) * scaleY);
    
    // Draw original image on temporary canvas to get raw color
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(activeImg, 0, 0);
    const pixel = tempCtx.getImageData(clickX, clickY, 1, 1).data;

    targetColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    updateColorDisplay(targetColor.r, targetColor.g, targetColor.b);
    applyBackgroundRemoval();
  };

  colorPicker.oninput = () => {
    const hex = colorPicker.value;
    targetColor = hexToRgb(hex);
    colorHexText.textContent = hex.toUpperCase();
    applyBackgroundRemoval();
  };

  toleranceSlider.oninput = () => {
    toleranceVal.textContent = toleranceSlider.value;
    applyBackgroundRemoval();
  };

  featherSlider.oninput = () => {
    featherVal.textContent = `${featherSlider.value}px`;
    applyBackgroundRemoval();
  };

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function updateColorDisplay(r, g, b) {
    const hex = rgbToHex(r, g, b);
    colorPicker.value = hex;
    colorHexText.textContent = hex.toUpperCase();
  }

  function applyBackgroundRemoval() {
    if (!activeImg) return;
    
    canvas.width = activeImg.width;
    canvas.height = activeImg.height;
    ctx.drawImage(activeImg, 0, 0);
    
    const tolerance = parseInt(toleranceSlider.value);
    const feather = parseInt(featherSlider.value);
    
    const imgDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const imgData = imgDataObj.data;
    
    const tr = targetColor.r;
    const tg = targetColor.g;
    const tb = targetColor.b;
    
    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      
      // Calculate Euclidean color distance
      const distance = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);
      
      if (distance < tolerance) {
        // Transparent
        imgData[i + 3] = 0;
      } else if (distance < tolerance + feather) {
        // Interpolate edge alpha
        const diff = distance - tolerance;
        const ratio = diff / feather;
        imgData[i + 3] = Math.round(ratio * 255);
      }
    }
    
    ctx.putImageData(imgDataObj, 0, 0);
  }

  clearBtn.onclick = () => {
    activeImg = null;
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
  };

  removeBtn.onclick = () => {
    if (!activeImg) return;
    helpers.showProgress(50);
    
    canvas.toBlob((blob) => {
      helpers.downloadFile(blob, `${activeFile.name.split('.')[0]}_no_bg.png`);
      helpers.hideProgress();
      helpers.showToast('Background transparency created successfully!');
    }, 'image/png');
  };
}

// 4. Image Cropper
function renderImageCropper(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="cropDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
        <span class="dropzone-text">Upload Image to Crop</span>
        <input type="file" id="cropFileInput" class="file-input" accept="image/*" />
      </div>
      
      <div id="cropConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="cropFileName"></span>
              </div>
              <button class="btn-icon delete" id="clearCropFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-item">
                <label>Aspect Ratio Preset</label>
                <select class="input-select" id="cropAspectSelect">
                  <option value="free">Free Crop</option>
                  <option value="1:1">Square (1:1)</option>
                  <option value="16:9">Widescreen (16:9)</option>
                  <option value="4:3">Standard (4:3)</option>
                </select>
              </div>
              <button class="action-btn" id="cropImageBtn">Crop & Download</button>
            </div>
          </div>
          
          <div class="preview-container" style="flex-direction: column;">
            <span class="dropzone-subtext" style="margin-bottom: 8px;">Drag boundaries on image to crop:</span>
            <div style="position: relative; max-width: 100%;">
              <canvas id="cropCanvas" style="max-width: 100%; height: auto; border-radius: var(--radius-md);"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#cropDropzone');
  const fileInput = container.querySelector('#cropFileInput');
  const config = container.querySelector('#cropConfig');
  const fileName = container.querySelector('#cropFileName');
  const clearBtn = container.querySelector('#clearCropFile');
  const aspectSelect = container.querySelector('#cropAspectSelect');
  const cropBtn = container.querySelector('#cropImageBtn');
  const canvas = container.querySelector('#cropCanvas');
  const ctx = canvas.getContext('2d');

  let activeImg = null;
  let activeFile = null;
  
  // Crop area box in image coordinates
  let cropBox = { x: 50, y: 50, w: 200, h: 200 };
  let isDragging = false;
  let dragHandle = null; // 'nw', 'ne', 'se', 'sw', 'center'
  let startX, startY;

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      activeFile = files[0];
      helpers.showProgress(40);
      try {
        activeImg = await loadImageFile(activeFile);
        dropzone.style.display = 'none';
        config.style.display = 'block';
        fileName.textContent = activeFile.name;
        
        canvas.width = activeImg.width;
        canvas.height = activeImg.height;
        
        // Initialize crop box to 80% of image dimensions
        const boxW = Math.round(canvas.width * 0.8);
        const boxH = Math.round(canvas.height * 0.8);
        cropBox = {
          x: Math.round((canvas.width - boxW) / 2),
          y: Math.round((canvas.height - boxH) / 2),
          w: boxW,
          h: boxH
        };

        drawCropScreen();
        setupDragHandlers();
      } catch (err) {
        helpers.showToast('Error loading image: ' + err.message, 'error');
      } finally {
        helpers.hideProgress();
      }
    }
  });

  aspectSelect.onchange = () => {
    adjustBoxToAspect();
    drawCropScreen();
  };

  function adjustBoxToAspect() {
    const val = aspectSelect.value;
    if (val === 'free') return;
    
    const [aspectW, aspectH] = val.split(':').map(Number);
    const aspect = aspectW / aspectH;
    
    let newH = cropBox.w / aspect;
    if (newH > canvas.height - cropBox.y) {
      newH = canvas.height - cropBox.y;
      cropBox.w = newH * aspect;
    }
    cropBox.h = newH;
  }

  function drawCropScreen() {
    if (!activeImg) return;
    
    // Draw original image
    ctx.drawImage(activeImg, 0, 0);
    
    // Draw darkened overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw cutout (clear crop box)
    ctx.clearRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    
    // Redraw cut image portion inside crop box
    ctx.drawImage(activeImg, cropBox.x, cropBox.y, cropBox.w, cropBox.h, cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    
    // Draw crop boundary line
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = Math.max(3, canvas.width / 300);
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    
    // Draw grab corners
    ctx.fillStyle = '#ffffff';
    const handleSize = Math.max(8, canvas.width / 100);
    const half = handleSize / 2;
    
    ctx.fillRect(cropBox.x - half, cropBox.y - half, handleSize, handleSize); // nw
    ctx.fillRect(cropBox.x + cropBox.w - half, cropBox.y - half, handleSize, handleSize); // ne
    ctx.fillRect(cropBox.x + cropBox.w - half, cropBox.y + cropBox.h - half, handleSize, handleSize); // se
    ctx.fillRect(cropBox.x - half, cropBox.y + cropBox.h - half, handleSize, handleSize); // sw
  }

  function setupDragHandlers() {
    canvas.onmousedown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      const handleSize = Math.max(20, canvas.width / 50); // Larger detection area
      const half = handleSize / 2;

      // Detect corner clicks
      if (Math.abs(mouseX - cropBox.x) < half && Math.abs(mouseY - cropBox.y) < half) {
        dragHandle = 'nw';
      } else if (Math.abs(mouseX - (cropBox.x + cropBox.w)) < half && Math.abs(mouseY - cropBox.y) < half) {
        dragHandle = 'ne';
      } else if (Math.abs(mouseX - (cropBox.x + cropBox.w)) < half && Math.abs(mouseY - (cropBox.y + cropBox.h)) < half) {
        dragHandle = 'se';
      } else if (Math.abs(mouseX - cropBox.x) < half && Math.abs(mouseY - (cropBox.y + cropBox.h)) < half) {
        dragHandle = 'sw';
      } else if (mouseX > cropBox.x && mouseX < cropBox.x + cropBox.w && mouseY > cropBox.y && mouseY < cropBox.y + cropBox.h) {
        dragHandle = 'center';
      } else {
        dragHandle = null;
        return;
      }
      
      isDragging = true;
      startX = mouseX;
      startY = mouseY;
    };

    window.onmousemove = (e) => {
      if (!isDragging) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
      const mouseY = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));
      
      const dx = mouseX - startX;
      const dy = mouseY - startY;
      
      const aspectVal = aspectSelect.value;
      let aspect = null;
      if (aspectVal !== 'free') {
        const [aw, ah] = aspectVal.split(':').map(Number);
        aspect = aw / ah;
      }

      if (dragHandle === 'center') {
        cropBox.x = Math.max(0, Math.min(canvas.width - cropBox.w, cropBox.x + dx));
        cropBox.y = Math.max(0, Math.min(canvas.height - cropBox.h, cropBox.y + dy));
      } else if (dragHandle === 'se') {
        cropBox.w = Math.max(30, cropBox.w + dx);
        if (aspect) {
          cropBox.h = cropBox.w / aspect;
        } else {
          cropBox.h = Math.max(30, cropBox.h + dy);
        }
      } else if (dragHandle === 'sw') {
        const prevRight = cropBox.x + cropBox.w;
        cropBox.x = Math.min(prevRight - 30, mouseX);
        cropBox.w = prevRight - cropBox.x;
        if (aspect) {
          cropBox.h = cropBox.w / aspect;
        } else {
          cropBox.h = Math.max(30, cropBox.h + dy);
        }
      } else if (dragHandle === 'ne') {
        const prevBot = cropBox.y + cropBox.h;
        cropBox.w = Math.max(30, cropBox.w + dx);
        if (aspect) {
          const newH = cropBox.w / aspect;
          cropBox.y = prevBot - newH;
          cropBox.h = newH;
        } else {
          cropBox.y = Math.min(prevBot - 30, mouseY);
          cropBox.h = prevBot - cropBox.y;
        }
      } else if (dragHandle === 'nw') {
        const prevRight = cropBox.x + cropBox.w;
        const prevBot = cropBox.y + cropBox.h;
        cropBox.x = Math.min(prevRight - 30, mouseX);
        cropBox.w = prevRight - cropBox.x;
        if (aspect) {
          const newH = cropBox.w / aspect;
          cropBox.y = prevBot - newH;
          cropBox.h = newH;
        } else {
          cropBox.y = Math.min(prevBot - 30, mouseY);
          cropBox.h = prevBot - cropBox.y;
        }
      }

      startX = mouseX;
      startY = mouseY;
      drawCropScreen();
    };

    window.onmouseup = () => {
      isDragging = false;
      dragHandle = null;
    };
  }

  clearBtn.onclick = () => {
    activeImg = null;
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
    window.onmousemove = null;
    window.onmouseup = null;
  };

  cropBtn.onclick = () => {
    if (!activeImg) return;
    helpers.showProgress(40);
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropBox.w;
    cropCanvas.height = cropBox.h;
    const cropCtx = cropCanvas.getContext('2d');
    
    cropCtx.drawImage(
      activeImg,
      cropBox.x, cropBox.y, cropBox.w, cropBox.h, // Source bounds
      0, 0, cropBox.w, cropBox.h // Target bounds
    );

    helpers.showProgress(85);
    cropCanvas.toBlob((blob) => {
      helpers.downloadFile(blob, `cropped_${activeFile.name}`);
      helpers.hideProgress();
      helpers.showToast('Image cropped successfully!');
    }, activeFile.type);
  };
}

// 5. Watermark Adder
function renderWatermarkAdder(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="wmDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg>
        <span class="dropzone-text">Upload Image to Watermark</span>
        <input type="file" id="wmFileInput" class="file-input" accept="image/*" />
      </div>
      
      <div id="wmConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="wmFileName"></span>
              </div>
              <button class="btn-icon delete" id="clearWmFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-item">
                <label>Watermark Text</label>
                <input type="text" class="input-text" id="wmText" value="CONFIDENTIAL" />
              </div>
              <div class="control-row">
                <div class="control-item">
                  <label>Opacity</label>
                  <div class="slider-container">
                    <input type="range" class="range-slider" id="wmOpacity" min="5" max="100" value="40" />
                    <span class="slider-val" id="wmOpacityVal">40%</span>
                  </div>
                </div>
                <div class="control-item">
                  <label>Font Size</label>
                  <div class="slider-container">
                    <input type="range" class="range-slider" id="wmSize" min="10" max="150" value="36" />
                    <span class="slider-val" id="wmSizeVal">36px</span>
                  </div>
                </div>
              </div>
              <div class="control-item">
                <label>Watermark Placement</label>
                <select class="input-select" id="wmPlacement">
                  <option value="center">Center</option>
                  <option value="tile">Tile Overlay</option>
                  <option value="bottom-right" selected>Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
              <button class="action-btn" id="addWmBtn">Apply & Download</button>
            </div>
          </div>
          
          <div class="preview-container">
            <canvas id="wmCanvas" style="max-width: 100%; height: auto; border-radius: var(--radius-md);"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#wmDropzone');
  const fileInput = container.querySelector('#wmFileInput');
  const config = container.querySelector('#wmConfig');
  const fileName = container.querySelector('#wmFileName');
  const clearBtn = container.querySelector('#clearWmFile');
  const wmText = container.querySelector('#wmText');
  const opacitySlider = container.querySelector('#wmOpacity');
  const opacityVal = container.querySelector('#wmOpacityVal');
  const sizeSlider = container.querySelector('#wmSize');
  const sizeVal = container.querySelector('#wmSizeVal');
  const placement = container.querySelector('#wmPlacement');
  const addBtn = container.querySelector('#addWmBtn');
  const canvas = container.querySelector('#wmCanvas');
  const ctx = canvas.getContext('2d');

  let activeImg = null;
  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      activeFile = files[0];
      helpers.showProgress(40);
      try {
        activeImg = await loadImageFile(activeFile);
        dropzone.style.display = 'none';
        config.style.display = 'block';
        fileName.textContent = activeFile.name;
        
        canvas.width = activeImg.width;
        canvas.height = activeImg.height;

        // Auto-scale default watermark size to image width
        const defaultSize = Math.round(canvas.width / 25);
        sizeSlider.value = Math.max(12, defaultSize);
        sizeVal.textContent = `${sizeSlider.value}px`;

        drawWatermark();
      } catch (err) {
        helpers.showToast('Error loading image: ' + err.message, 'error');
      } finally {
        helpers.hideProgress();
      }
    }
  });

  const inputs = [wmText, opacitySlider, sizeSlider, placement];
  inputs.forEach(input => {
    input.oninput = () => {
      opacityVal.textContent = `${opacitySlider.value}%`;
      sizeVal.textContent = `${sizeSlider.value}px`;
      drawWatermark();
    };
    input.onchange = () => drawWatermark();
  });

  function drawWatermark() {
    if (!activeImg) return;
    
    canvas.width = activeImg.width;
    canvas.height = activeImg.height;
    ctx.drawImage(activeImg, 0, 0);
    
    const text = wmText.value;
    if (!text) return;

    ctx.save();
    
    const size = parseInt(sizeSlider.value);
    ctx.font = `bold ${size}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.globalAlpha = parseInt(opacitySlider.value) / 100;
    
    const textMetrics = ctx.measureText(text);
    const tw = textMetrics.width;
    const th = size; // rough height estimate
    const place = placement.value;
    
    if (place === 'center') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    } else if (place === 'bottom-right') {
      ctx.textAlign = 'right';
      ctx.fillText(text, canvas.width - 24, canvas.height - 24);
    } else if (place === 'bottom-left') {
      ctx.textAlign = 'left';
      ctx.fillText(text, 24, canvas.height - 24);
    } else if (place === 'top-right') {
      ctx.textAlign = 'right';
      ctx.fillText(text, canvas.width - 24, 24 + th);
    } else if (place === 'top-left') {
      ctx.textAlign = 'left';
      ctx.fillText(text, 24, 24 + th);
    } else if (place === 'tile') {
      // Draw grid watermarks rotated 30 degrees
      ctx.rotate(-30 * Math.PI / 180);
      const stepX = tw * 2;
      const stepY = th * 4;
      
      // Draw far wider range to cover rotated bounding box
      for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
        for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
          ctx.fillText(text, x, y);
        }
      }
    }
    
    ctx.restore();
  }

  clearBtn.onclick = () => {
    activeImg = null;
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
  };

  addBtn.onclick = () => {
    if (!activeImg) return;
    helpers.showProgress(50);
    canvas.toBlob((blob) => {
      helpers.downloadFile(blob, `watermarked_${activeFile.name}`);
      helpers.hideProgress();
      helpers.showToast('Watermark added!');
    }, activeFile.type);
  };
}

// 6. Image Format Converter
function renderImageConverter(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="convDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20v-4h-4"/><path d="M4 4v4h4"/><path d="M12 20a8 8 0 0 0 8-8V4"/><path d="M12 4a8 8 0 0 0-8 8v8"/></svg>
        <span class="dropzone-text">Upload Image to Convert Format</span>
        <input type="file" id="convFileInput" class="file-input" accept="image/*" />
      </div>
      
      <div id="convConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="convFileName"></span>
                <span class="file-size" id="convFileSize"></span>
              </div>
              <button class="btn-icon delete" id="clearConvFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-item">
                <label>Target Format</label>
                <select class="input-select" id="convTarget">
                  <option value="png">PNG (.png)</option>
                  <option value="jpeg">JPEG (.jpg)</option>
                  <option value="webp" selected>WebP (.webp)</option>
                </select>
              </div>
              <button class="action-btn" id="convBtn">Convert & Download</button>
            </div>
          </div>
          
          <div class="preview-container">
            <img class="preview-img" id="convPreview" />
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#convDropzone');
  const fileInput = container.querySelector('#convFileInput');
  const config = container.querySelector('#convConfig');
  const fileName = container.querySelector('#convFileName');
  const fileSize = container.querySelector('#convFileSize');
  const clearBtn = container.querySelector('#clearConvFile');
  const targetSelect = container.querySelector('#convTarget');
  const convBtn = container.querySelector('#convBtn');
  const previewImg = container.querySelector('#convPreview');

  let activeImg = null;
  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      activeFile = files[0];
      helpers.showProgress(40);
      try {
        activeImg = await loadImageFile(activeFile);
        dropzone.style.display = 'none';
        config.style.display = 'block';
        fileName.textContent = activeFile.name;
        fileSize.textContent = `(${helpers.formatBytes(activeFile.size)})`;
        previewImg.src = activeImg.src;
      } catch (err) {
        helpers.showToast('Error loading image: ' + err.message, 'error');
      } finally {
        helpers.hideProgress();
      }
    }
  });

  clearBtn.onclick = () => {
    activeImg = null;
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
  };

  convBtn.onclick = () => {
    if (!activeImg) return;
    helpers.showProgress(40);
    
    const target = targetSelect.value;
    const canvas = document.createElement('canvas');
    canvas.width = activeImg.width;
    canvas.height = activeImg.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(activeImg, 0, 0);

    const outMime = `image/${target}`;
    
    helpers.showProgress(75);
    canvas.toBlob((blob) => {
      const name = activeFile.name.split('.')[0];
      helpers.downloadFile(blob, `${name}.${target === 'jpeg' ? 'jpg' : target}`);
      helpers.hideProgress();
      helpers.showToast('Image converted successfully!');
    }, outMime, 0.95);
  };
}

// 7. Screenshot Beautifier (Modern card wrapper layout editor)
function renderScreenshotBeautifier(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="beautyDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="20" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
        <span class="dropzone-text">Upload Screenshot to Beautify</span>
        <input type="file" id="beautyFileInput" class="file-input" accept="image/*" />
      </div>
      
      <div id="beautyConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="beautyFileName"></span>
              </div>
              <button class="btn-icon delete" id="clearBeautyFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-item">
                <label>Background Theme</label>
                <select class="input-select" id="beautyBgSelect">
                  <option value="linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)">Classic Gray</option>
                  <option value="linear-gradient(135deg, #f6d365 0%, #fda085 100%)" selected>Warm Sunset</option>
                  <option value="linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)">Ocean Breeze</option>
                  <option value="linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)">Soft Pink</option>
                  <option value="linear-gradient(135deg, #30cfd0 0%, #33086f 100%)">Cyberpunk Neon</option>
                  <option value="linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)">Deep Velvet Blue</option>
                </select>
              </div>
              <div class="control-row">
                <div class="control-item">
                  <label>Padding Amount</label>
                  <div class="slider-container">
                    <input type="range" class="range-slider" id="beautyPadding" min="10" max="100" value="45" />
                    <span class="slider-val" id="beautyPaddingVal">45px</span>
                  </div>
                </div>
                <div class="control-item">
                  <label>Window Corner Radius</label>
                  <div class="slider-container">
                    <input type="range" class="range-slider" id="beautyRadius" min="0" max="24" value="12" />
                    <span class="slider-val" id="beautyRadiusVal">12px</span>
                  </div>
                </div>
              </div>
              <div class="control-row">
                <div class="control-item">
                  <label>Shadow Intensity</label>
                  <div class="slider-container">
                    <input type="range" class="range-slider" id="beautyShadow" min="0" max="60" value="30" />
                    <span class="slider-val" id="beautyShadowVal">30px</span>
                  </div>
                </div>
              </div>
              <button class="action-btn" id="beautyDownloadBtn">Generate & Download Image</button>
            </div>
          </div>
          
          <div class="preview-container" style="background-color: var(--bg-main); padding: 20px;">
            <div class="beautifier-canvas-container" id="beautyWrap" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);">
              <div class="beautifier-frame-wrapper" id="beautyFrameWrap" style="padding: 45px;">
                <div class="beautifier-window" id="beautyWindow" style="border-radius: 12px; box-shadow: 0 15px 30px rgba(0,0,0,0.3);">
                  <div class="beautifier-titlebar">
                    <div class="beautifier-dot red"></div>
                    <div class="beautifier-dot yellow"></div>
                    <div class="beautifier-dot green"></div>
                  </div>
                  <img class="beautifier-content-img" id="beautyImgSrc" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#beautyDropzone');
  const fileInput = container.querySelector('#beautyFileInput');
  const config = container.querySelector('#beautyConfig');
  const fileName = container.querySelector('#beautyFileName');
  const clearBtn = container.querySelector('#clearBeautyFile');
  const bgSelect = container.querySelector('#beautyBgSelect');
  const paddingSlider = container.querySelector('#beautyPadding');
  const paddingVal = container.querySelector('#beautyPaddingVal');
  const radiusSlider = container.querySelector('#beautyRadius');
  const radiusVal = container.querySelector('#beautyRadiusVal');
  const shadowSlider = container.querySelector('#beautyShadow');
  const shadowVal = container.querySelector('#beautyShadowVal');
  const downloadBtn = container.querySelector('#beautyDownloadBtn');
  
  const beautyWrap = container.querySelector('#beautyWrap');
  const beautyFrameWrap = container.querySelector('#beautyFrameWrap');
  const beautyWindow = container.querySelector('#beautyWindow');
  const beautyImgSrc = container.querySelector('#beautyImgSrc');

  let activeImg = null;
  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, async (files) => {
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      activeFile = files[0];
      helpers.showProgress(40);
      try {
        activeImg = await loadImageFile(activeFile);
        dropzone.style.display = 'none';
        config.style.display = 'block';
        fileName.textContent = activeFile.name;
        beautyImgSrc.src = activeImg.src;
        updatePreview();
      } catch (err) {
        helpers.showToast('Could not load screenshot: ' + err.message, 'error');
      } finally {
        helpers.hideProgress();
      }
    }
  });

  const controls = [bgSelect, paddingSlider, radiusSlider, shadowSlider];
  controls.forEach(c => {
    c.oninput = () => {
      paddingVal.textContent = `${paddingSlider.value}px`;
      radiusVal.textContent = `${radiusSlider.value}px`;
      shadowVal.textContent = `${shadowSlider.value}px`;
      updatePreview();
    };
  });

  function updatePreview() {
    if (!activeImg) return;
    
    beautyWrap.style.background = bgSelect.value;
    beautyFrameWrap.style.padding = `${paddingSlider.value}px`;
    beautyWindow.style.borderRadius = `${radiusSlider.value}px`;
    
    const shadowSize = parseInt(shadowSlider.value);
    beautyWindow.style.boxShadow = `0 ${shadowSize}px ${shadowSize * 2}px rgba(0,0,0,${0.1 + (shadowSize / 100)})`;
  }

  clearBtn.onclick = () => {
    activeImg = null;
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
  };

  downloadBtn.onclick = () => {
    if (!activeImg) return;
    helpers.showProgress(35);
    
    const padding = parseInt(paddingSlider.value);
    const radius = parseInt(radiusSlider.value);
    const shadowIntensity = parseInt(shadowSlider.value);
    
    // Canvas dimensions = Image size + padding * 2
    const canvasW = activeImg.width + padding * 2;
    const canvasH = activeImg.height + padding * 2 + 28; // Title bar is 28px height
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    // 1. Draw Gradient Background
    // Parse the linear-gradient style into a canvas gradient
    const bgString = bgSelect.value;
    let grad;
    if (bgString.startsWith('linear-gradient')) {
      // Basic 135deg gradient parsing
      grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
      const colorMatches = bgString.match(/#[0-9a-fA-F]{6}/g);
      if (colorMatches && colorMatches.length >= 2) {
        grad.addColorStop(0, colorMatches[0]);
        grad.addColorStop(1, colorMatches[colorMatches.length - 1]);
      } else {
        grad = '#fda085';
      }
    } else {
      grad = bgString;
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 2. Draw shadow underneath the window
    if (shadowIntensity > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0, 0, 0, ${0.2 + (shadowIntensity / 100)})`;
      ctx.shadowBlur = shadowIntensity * 1.5;
      ctx.shadowOffsetY = shadowIntensity;
      // Draw solid block matching window bounds to trigger shadow
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      roundRect(ctx, padding, padding, activeImg.width, activeImg.height + 28, radius);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Window Title Bar
    ctx.save();
    // Clip drawing area to the rounded rectangle window
    ctx.beginPath();
    roundRect(ctx, padding, padding, activeImg.width, activeImg.height + 28, radius);
    ctx.clip();
    
    // Draw Titlebar background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(padding, padding, activeImg.width, 28);
    
    // Draw Titlebar dots (Red, Yellow, Green)
    const dotY = padding + 14;
    const dotSpacing = 16;
    
    ctx.fillStyle = '#ff5f56';
    ctx.beginPath(); ctx.arc(padding + 16, dotY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffbd2e';
    ctx.beginPath(); ctx.arc(padding + 16 + dotSpacing, dotY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#27c93f';
    ctx.beginPath(); ctx.arc(padding + 16 + dotSpacing * 2, dotY, 5, 0, Math.PI * 2); ctx.fill();

    // 4. Draw Content Image
    ctx.drawImage(activeImg, padding, padding + 28, activeImg.width, activeImg.height);
    
    // Draw fine border
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();

    helpers.showProgress(80);
    canvas.toBlob((blob) => {
      helpers.downloadFile(blob, `beautified_${activeFile.name.split('.')[0]}.png`);
      helpers.hideProgress();
      helpers.showToast('Screenshot beautified successfully!');
    }, 'image/png');
  };

  // Helper method for drawing rounded rectangle on canvas
  function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }
}
