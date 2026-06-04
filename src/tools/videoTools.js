import gifshot from 'gifshot';

export function initVideoTool(toolId, container, helpers) {
  container.innerHTML = '';

  switch (toolId) {
    case 'video-compressor':
      renderVideoCompressor(container, helpers);
      break;
    case 'video-trimmer':
      renderVideoTrimmer(container, helpers);
      break;
    case 'video-to-gif':
      renderVideoToGif(container, helpers);
      break;
    case 'audio-extractor':
      renderAudioExtractor(container, helpers);
      break;
    case 'video-converter':
      renderVideoConverter(container, helpers);
      break;
    default:
      container.innerHTML = `<p>Video tool "${toolId}" is under construction.</p>`;
  }
}

// 1. Video Compressor
function renderVideoCompressor(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="vidDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
        <span class="dropzone-text">Upload Video to Compress</span>
        <input type="file" id="vidFileInput" class="file-input" accept="video/*" />
      </div>
      
      <div id="vidConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="vidFileName"></span>
                <span class="file-size" id="vidFileSize"></span>
              </div>
              <button class="btn-icon delete" id="clearVidFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-item">
                <label>Resolution Scale</label>
                <select class="input-select" id="vidScale">
                  <option value="0.75" selected>75% of Original</option>
                  <option value="0.5">50% (Highly Compressed)</option>
                  <option value="1.0">100% (Bitrate reduction only)</option>
                </select>
              </div>
              <div class="control-item">
                <label>Bitrate Quality</label>
                <select class="input-select" id="vidBitrate">
                  <option value="1000000" selected>1 Mbps (Standard quality)</option>
                  <option value="500000">500 Kbps (Low quality, smallest size)</option>
                  <option value="2500000">2.5 Mbps (High quality)</option>
                </select>
              </div>
              <div class="dropzone-subtext">Note: Compression is performed locally via Canvas capture stream. The video will play during compression. Keep volume down if needed.</div>
              <button class="action-btn" id="vidCompressBtn">Compress & Save</button>
            </div>
          </div>
          
          <div class="preview-container">
            <video class="preview-video" id="vidPreview" controls muted></video>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#vidDropzone');
  const fileInput = container.querySelector('#vidFileInput');
  const config = container.querySelector('#vidConfig');
  const fileName = container.querySelector('#vidFileName');
  const fileSize = container.querySelector('#vidFileSize');
  const clearBtn = container.querySelector('#clearVidFile');
  const scaleSelect = container.querySelector('#vidScale');
  const bitrateSelect = container.querySelector('#vidBitrate');
  const compressBtn = container.querySelector('#vidCompressBtn');
  const videoPreview = container.querySelector('#vidPreview');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      activeFile = files[0];
      dropzone.style.display = 'none';
      config.style.display = 'block';
      fileName.textContent = activeFile.name;
      fileSize.textContent = `(${helpers.formatBytes(activeFile.size)})`;
      
      const fileUrl = URL.createObjectURL(activeFile);
      videoPreview.src = fileUrl;
    }
  });

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
    videoPreview.removeAttribute('src');
    videoPreview.load();
  };

  compressBtn.onclick = async () => {
    if (!activeFile) return;
    
    // Prepare recording details
    const scale = parseFloat(scaleSelect.value);
    const bps = parseInt(bitrateSelect.value);
    
    videoPreview.muted = true;
    videoPreview.currentTime = 0;
    videoPreview.pause();
    
    helpers.showProgress(5);
    helpers.showToast('Compiling canvas streams. Keep page active.');

    // Wait briefly for video layout loading
    await new Promise(r => setTimeout(r, 800));

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(videoPreview.videoWidth * scale);
    canvas.height = Math.round(videoPreview.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    
    // Set up Web Audio API to route video audio track
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(videoPreview);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    
    // Merge Canvas stream with Audio track
    const stream = canvas.captureStream(24);
    const audioTracks = dest.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      stream.addTrack(audioTracks[0]);
    }
    
    const chunks = [];
    // Select mimetype supported by browser
    let options = { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: bps };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm', videoBitsPerSecond: bps };
    }
    
    const recorder = new MediaRecorder(stream, options);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      helpers.downloadFile(blob, `compressed_${activeFile.name.split('.')[0]}.webm`);
      helpers.hideProgress();
      helpers.showToast('Compression finished! Downloaded WebM.');
      videoPreview.muted = false;
      audioCtx.close();
    };

    // Draw video frames loop
    let animationId;
    function drawFrame() {
      if (!videoPreview.paused && !videoPreview.ended) {
        ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
        animationId = requestAnimationFrame(drawFrame);
        // Calculate dynamic progress
        const pct = Math.min(95, Math.floor(10 + (85 * videoPreview.currentTime / videoPreview.duration)));
        helpers.showProgress(pct);
      }
    }

    videoPreview.onended = () => {
      recorder.stop();
      cancelAnimationFrame(animationId);
      videoPreview.onended = null;
    };

    recorder.start();
    videoPreview.play();
    drawFrame();
  };
}

// 2. Video Trimmer
function renderVideoTrimmer(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="trimDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18l-8-4-8 4Z"/></svg>
        <span class="dropzone-text">Upload Video to Trim</span>
        <input type="file" id="trimFileInput" class="file-input" accept="video/*" />
      </div>
      
      <div id="trimConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="trimFileName"></span>
                <span class="file-size" id="trimFileDuration"></span>
              </div>
              <button class="btn-icon delete" id="clearTrimFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-row">
                <div class="control-item">
                  <label>Start Trim (Seconds)</label>
                  <input type="number" class="input-text" id="trimStart" value="0" min="0" step="0.1" />
                </div>
                <div class="control-item">
                  <label>End Trim (Seconds)</label>
                  <input type="number" class="input-text" id="trimEnd" value="5" min="0" step="0.1" />
                </div>
              </div>
              <button class="action-btn" id="trimSaveBtn">Trim & Save</button>
            </div>
          </div>
          
          <div class="preview-container">
            <video class="preview-video" id="trimPreview" controls muted></video>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#trimDropzone');
  const fileInput = container.querySelector('#trimFileInput');
  const config = container.querySelector('#trimConfig');
  const fileName = container.querySelector('#trimFileName');
  const fileDuration = container.querySelector('#trimFileDuration');
  const clearBtn = container.querySelector('#clearTrimFile');
  const startInput = container.querySelector('#trimStart');
  const endInput = container.querySelector('#trimEnd');
  const saveBtn = container.querySelector('#trimSaveBtn');
  const videoPreview = container.querySelector('#trimPreview');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      activeFile = files[0];
      dropzone.style.display = 'none';
      config.style.display = 'block';
      fileName.textContent = activeFile.name;
      
      const fileUrl = URL.createObjectURL(activeFile);
      videoPreview.src = fileUrl;
      videoPreview.onloadedmetadata = () => {
        const dur = videoPreview.duration;
        fileDuration.textContent = `(${helpers.formatBytes(activeFile.size)}, ${dur.toFixed(1)}s)`;
        startInput.value = 0;
        endInput.value = dur.toFixed(1);
        startInput.max = dur;
        endInput.max = dur;
      };
    }
  });

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
    videoPreview.removeAttribute('src');
    videoPreview.load();
  };

  saveBtn.onclick = async () => {
    if (!activeFile) return;
    
    const start = parseFloat(startInput.value);
    const end = parseFloat(endInput.value);
    if (isNaN(start) || isNaN(end) || start >= end || end > videoPreview.duration) {
      helpers.showToast('Please verify start and end times.', 'warning');
      return;
    }

    videoPreview.muted = true;
    videoPreview.currentTime = start;
    videoPreview.pause();
    
    helpers.showProgress(5);
    helpers.showToast('Trimming via canvas recording. Keep page active.');

    await new Promise(r => setTimeout(r, 600));

    const canvas = document.createElement('canvas');
    canvas.width = videoPreview.videoWidth;
    canvas.height = videoPreview.videoHeight;
    const ctx = canvas.getContext('2d');
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(videoPreview);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    
    const stream = canvas.captureStream(24);
    const audioTracks = dest.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      stream.addTrack(audioTracks[0]);
    }
    
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      helpers.downloadFile(blob, `trimmed_${activeFile.name.split('.')[0]}.webm`);
      helpers.hideProgress();
      helpers.showToast('Trimming finished!');
      videoPreview.muted = false;
      audioCtx.close();
    };

    let animationId;
    function drawFrame() {
      if (videoPreview.currentTime >= end) {
        recorder.stop();
        videoPreview.pause();
        cancelAnimationFrame(animationId);
        return;
      }
      
      if (!videoPreview.paused && !videoPreview.ended) {
        ctx.drawImage(videoPreview, 0, 0);
        animationId = requestAnimationFrame(drawFrame);
        const progressDur = end - start;
        const currentProgress = videoPreview.currentTime - start;
        const pct = Math.min(95, Math.floor(10 + (85 * currentProgress / progressDur)));
        helpers.showProgress(pct);
      }
    }

    recorder.start();
    videoPreview.play();
    drawFrame();
  };
}

// 3. Video to GIF
function renderVideoToGif(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="gifDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span class="dropzone-text">Upload Video to Extract GIF</span>
        <input type="file" id="gifFileInput" class="file-input" accept="video/*" />
      </div>
      
      <div id="gifConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="gifFileName"></span>
              </div>
              <button class="btn-icon delete" id="clearGifFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-row">
                <div class="control-item">
                  <label>Duration of GIF (Max 8s)</label>
                  <input type="number" class="input-text" id="gifDurationInput" value="3" min="1" max="8" />
                </div>
                <div class="control-item">
                  <label>GIF Width (pixels)</label>
                  <input type="number" class="input-text" id="gifWidthInput" value="320" />
                </div>
              </div>
              <div class="dropzone-subtext">Sampling is initiated from current video timestamp. Play/pause video to set frame start.</div>
              <button class="action-btn" id="generateGifBtn">Convert to GIF</button>
            </div>
          </div>
          
          <div class="preview-container">
            <video class="preview-video" id="gifPreview" controls muted></video>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#gifDropzone');
  const fileInput = container.querySelector('#gifFileInput');
  const config = container.querySelector('#gifConfig');
  const fileName = container.querySelector('#gifFileName');
  const clearBtn = container.querySelector('#clearGifFile');
  const durationInput = container.querySelector('#gifDurationInput');
  const widthInput = container.querySelector('#gifWidthInput');
  const generateBtn = container.querySelector('#generateGifBtn');
  const videoPreview = container.querySelector('#gifPreview');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      activeFile = files[0];
      dropzone.style.display = 'none';
      config.style.display = 'block';
      fileName.textContent = activeFile.name;
      
      const fileUrl = URL.createObjectURL(activeFile);
      videoPreview.src = fileUrl;
    }
  });

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
    videoPreview.removeAttribute('src');
    videoPreview.load();
  };

  generateBtn.onclick = async () => {
    if (!activeFile) return;

    const start = videoPreview.currentTime;
    const dur = parseFloat(durationInput.value);
    const targetWidth = parseInt(widthInput.value);
    
    if (isNaN(dur) || dur <= 0 || dur > 8) {
      helpers.showToast('Please limit duration between 1 to 8 seconds.', 'warning');
      return;
    }

    helpers.showProgress(15);
    helpers.showToast('Sampling frames from video...');

    // Draw video samples to array of images
    const frames = [];
    const sampleRate = 10; // 10 frames per second
    const totalSamples = dur * sampleRate;
    const sampleInterval = 1 / sampleRate;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    // Keep aspect ratio
    const aspect = videoPreview.videoHeight / videoPreview.videoWidth;
    canvas.height = Math.round(targetWidth * aspect);
    const ctx = canvas.getContext('2d');

    videoPreview.pause();

    for (let i = 0; i < totalSamples; i++) {
      videoPreview.currentTime = start + (i * sampleInterval);
      // Wait for frame seek
      await new Promise(r => {
        const onSeek = () => {
          videoPreview.removeEventListener('seeked', onSeek);
          r();
        };
        videoPreview.addEventListener('seeked', onSeek);
      });

      ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.8));
      
      helpers.showProgress(Math.floor(15 + (40 * i / totalSamples)));
    }

    helpers.showProgress(60);
    helpers.showToast('Generating GIF output...');

    gifshot.createGIF({
      images: frames,
      gifWidth: canvas.width,
      gifHeight: canvas.height,
      interval: sampleInterval,
      numWorkers: 2
    }, (obj) => {
      if (!obj.error) {
        helpers.downloadFile(helpers.dataURLtoBlob(obj.image), 'animated.gif');
        helpers.showToast('GIF successfully downloaded!');
      } else {
        helpers.showToast('GIF compilation failed: ' + obj.error, 'error');
      }
      helpers.hideProgress();
    });
  };
}

// 4. Audio Extractor (Web Audio API decoding to WAV output)
function renderAudioExtractor(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="audioDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span class="dropzone-text">Upload Video/Audio to Extract MP3/WAV</span>
        <input type="file" id="audioFileInput" class="file-input" accept="video/*,audio/*" />
      </div>
      
      <div id="audioConfig" style="display: none; margin-top: 20px;">
        <div class="file-item" style="margin-bottom: 20px;">
          <div class="file-info">
            <span class="file-name" id="audioFileName"></span>
          </div>
          <button class="btn-icon delete" id="clearAudioFile">✕</button>
        </div>
        <button class="action-btn" id="extractBtn">Extract & Download Audio (WAV)</button>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#audioDropzone');
  const fileInput = container.querySelector('#audioFileInput');
  const config = container.querySelector('#audioConfig');
  const fileName = container.querySelector('#audioFileName');
  const clearBtn = container.querySelector('#clearAudioFile');
  const extractBtn = container.querySelector('#extractBtn');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0) {
      activeFile = files[0];
      dropzone.style.display = 'none';
      config.style.display = 'block';
      fileName.textContent = activeFile.name;
    }
  });

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
  };

  extractBtn.onclick = async () => {
    if (!activeFile) return;
    helpers.showProgress(15);
    helpers.showToast('Reading file data...');
    
    try {
      const buffer = await activeFile.arrayBuffer();
      helpers.showProgress(35);
      helpers.showToast('Decoding audio tracks...');
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(buffer);
      
      helpers.showProgress(70);
      helpers.showToast('Compiling WAV format data...');
      
      const wavBlob = bufferToWav(decodedBuffer);
      
      helpers.downloadFile(wavBlob, `${activeFile.name.split('.')[0]}.wav`);
      helpers.showToast('WAV Audio extracted!');
      audioCtx.close();
    } catch (err) {
      console.error(err);
      helpers.showToast('Audio extraction failed: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };

  // Wave format compilation
  function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // 1 = Raw uncompressed PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const bufferArr = new ArrayBuffer(44 + result.length * 2);
    const view = new DataView(bufferArr);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + result.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, result.length * 2, true);
    
    // Write Int16 audio samples
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, result[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    return new Blob([view], { type: 'audio/wav' });
  }

  function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

// 5. Video Format Converter
function renderVideoConverter(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="convVidDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20v-4h-4"/><path d="M4 4v4h4"/><path d="M12 20a8 8 0 0 0 8-8V4"/><path d="M12 4a8 8 0 0 0-8 8v8"/></svg>
        <span class="dropzone-text">Upload Video to Convert</span>
        <input type="file" id="convVidFileInput" class="file-input" accept="video/*" />
      </div>
      
      <div id="convVidConfig" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <div class="file-item" style="margin-bottom: 20px;">
              <div class="file-info">
                <span class="file-name" id="convVidFileName"></span>
              </div>
              <button class="btn-icon delete" id="clearConvVidFile">✕</button>
            </div>
            
            <div class="control-group">
              <div class="control-item">
                <label>Target Container Format</label>
                <select class="input-select" id="convVidTarget">
                  <option value="webm">WebM (.webm)</option>
                  <option value="mp4">MP4/M4V (Depends on browser codecs)</option>
                </select>
              </div>
              <div class="dropzone-subtext">The converter uses browser MediaRecorder stream capturing to render container packets.</div>
              <button class="action-btn" id="convVidSaveBtn">Convert & Save</button>
            </div>
          </div>
          
          <div class="preview-container">
            <video class="preview-video" id="convVidPreview" controls muted></video>
          </div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#convVidDropzone');
  const fileInput = container.querySelector('#convVidFileInput');
  const config = container.querySelector('#convVidConfig');
  const fileName = container.querySelector('#convVidFileName');
  const clearBtn = container.querySelector('#clearConvVidFile');
  const targetSelect = container.querySelector('#convVidTarget');
  const saveBtn = container.querySelector('#convVidSaveBtn');
  const videoPreview = container.querySelector('#convVidPreview');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      activeFile = files[0];
      dropzone.style.display = 'none';
      config.style.display = 'block';
      fileName.textContent = activeFile.name;
      
      const fileUrl = URL.createObjectURL(activeFile);
      videoPreview.src = fileUrl;
    }
  });

  clearBtn.onclick = () => {
    activeFile = null;
    dropzone.style.display = 'flex';
    config.style.display = 'none';
    fileInput.value = '';
    videoPreview.removeAttribute('src');
    videoPreview.load();
  };

  saveBtn.onclick = async () => {
    if (!activeFile) return;
    
    const target = targetSelect.value;
    videoPreview.muted = true;
    videoPreview.currentTime = 0;
    videoPreview.pause();
    
    helpers.showProgress(5);
    helpers.showToast('Re-recording container formats...');

    await new Promise(r => setTimeout(r, 600));

    const canvas = document.createElement('canvas');
    canvas.width = videoPreview.videoWidth;
    canvas.height = videoPreview.videoHeight;
    const ctx = canvas.getContext('2d');
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(videoPreview);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    
    const stream = canvas.captureStream(24);
    const audioTracks = dest.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      stream.addTrack(audioTracks[0]);
    }
    
    const chunks = [];
    let options = { mimeType: `video/${target === 'mp4' ? 'mp4' : 'webm'}` };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      // Fallback
      options = { mimeType: 'video/webm' };
    }
    
    const recorder = new MediaRecorder(stream, options);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const ext = target === 'mp4' ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: `video/${ext}` });
      helpers.downloadFile(blob, `converted_${activeFile.name.split('.')[0]}.${ext}`);
      helpers.hideProgress();
      helpers.showToast('Conversion finished!');
      videoPreview.muted = false;
      audioCtx.close();
    };

    let animationId;
    function drawFrame() {
      if (!videoPreview.paused && !videoPreview.ended) {
        ctx.drawImage(videoPreview, 0, 0);
        animationId = requestAnimationFrame(drawFrame);
        const pct = Math.min(95, Math.floor(10 + (85 * videoPreview.currentTime / videoPreview.duration)));
        helpers.showProgress(pct);
      }
    }

    videoPreview.onended = () => {
      recorder.stop();
      cancelAnimationFrame(animationId);
      videoPreview.onended = null;
    };

    recorder.start();
    videoPreview.play();
    drawFrame();
  };
}
