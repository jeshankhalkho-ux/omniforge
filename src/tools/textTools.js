import * as Diff from 'diff';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export function initTextTool(toolId, container, helpers) {
  container.innerHTML = '';

  switch (toolId) {
    case 'word-counter':
      renderWordCounter(container, helpers);
      break;
    case 'case-converter':
      renderCaseConverter(container, helpers);
      break;
    case 'diff-checker':
      renderDiffChecker(container, helpers);
      break;
    case 'dup-remover':
      renderDupRemover(container, helpers);
      break;
    case 'pass-generator':
      renderPassGenerator(container, helpers);
      break;
    case 'qr-generator':
      renderQrGenerator(container, helpers);
      break;
    case 'barcode-generator':
      renderBarcodeGenerator(container, helpers);
      break;
    default:
      container.innerHTML = `<p>Text tool "${toolId}" is under construction.</p>`;
  }
}

// 1. Word / Character Counter
function renderWordCounter(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <textarea class="textarea-custom" id="wordCounterInput" placeholder="Paste or type your text here..."></textarea>
      
      <div class="control-group" style="margin-top: 20px;">
        <div class="tools-grid">
          <div class="tool-card" style="cursor: default; background: rgba(255,255,255,0.02); min-height: auto; padding: 14px;">
            <h3 id="statCharacters">0</h3>
            <p>Characters</p>
          </div>
          <div class="tool-card" style="cursor: default; background: rgba(255,255,255,0.02); min-height: auto; padding: 14px;">
            <h3 id="statWords">0</h3>
            <p>Words</p>
          </div>
          <div class="tool-card" style="cursor: default; background: rgba(255,255,255,0.02); min-height: auto; padding: 14px;">
            <h3 id="statLines">0</h3>
            <p>Lines</p>
          </div>
          <div class="tool-card" style="cursor: default; background: rgba(255,255,255,0.02); min-height: auto; padding: 14px;">
            <h3 id="statReadingTime">0s</h3>
            <p>Reading Time</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector('#wordCounterInput');
  const statChars = container.querySelector('#statCharacters');
  const statWords = container.querySelector('#statWords');
  const statLines = container.querySelector('#statLines');
  const statReading = container.querySelector('#statReadingTime');

  input.oninput = () => {
    const txt = input.value;
    
    // Character count
    statChars.textContent = txt.length;
    
    // Word count
    const words = txt.trim().split(/\s+/).filter(w => w.length > 0);
    statWords.textContent = words.length;
    
    // Line count
    const lines = txt.split('\n');
    statLines.textContent = txt.length > 0 ? lines.length : 0;
    
    // Reading time (average 200 words per minute)
    const minutes = words.length / 200;
    const seconds = Math.round(minutes * 60);
    if (seconds >= 60) {
      statReading.textContent = `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      statReading.textContent = `${seconds}s`;
    }
  };
}

// 2. Case Converter
function renderCaseConverter(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <textarea class="textarea-custom" id="caseInput" placeholder="Enter text here..."></textarea>
      
      <div class="control-group">
        <div class="control-row" style="flex-wrap: wrap;">
          <button class="action-btn action-btn-secondary" id="btnUpper">UPPER CASE</button>
          <button class="action-btn action-btn-secondary" id="btnLower">lower case</button>
          <button class="action-btn action-btn-secondary" id="btnTitle">Title Case</button>
          <button class="action-btn action-btn-secondary" id="btnSentence">Sentence case</button>
          <button class="action-btn action-btn-secondary" id="btnCamel">camelCase</button>
          <button class="action-btn action-btn-secondary" id="btnPascal">PascalCase</button>
          <button class="action-btn action-btn-secondary" id="btnSnake">snake_case</button>
          <button class="action-btn action-btn-secondary" id="btnKebab">kebab-case</button>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector('#caseInput');

  container.querySelector('#btnUpper').onclick = () => {
    input.value = input.value.toUpperCase();
  };

  container.querySelector('#btnLower').onclick = () => {
    input.value = input.value.toLowerCase();
  };

  container.querySelector('#btnTitle').onclick = () => {
    input.value = input.value.replace(/\b[a-z]/g, char => char.toUpperCase());
  };

  container.querySelector('#btnSentence').onclick = () => {
    input.value = input.value.toLowerCase().replace(/(^\s*|[.!?]\s+)[a-z]/g, char => char.toUpperCase());
  };

  container.querySelector('#btnCamel').onclick = () => {
    input.value = toCamelCase(input.value);
  };

  container.querySelector('#btnPascal').onclick = () => {
    input.value = toPascalCase(input.value);
  };

  container.querySelector('#btnSnake').onclick = () => {
    input.value = toSnakeCase(input.value);
  };

  container.querySelector('#btnKebab').onclick = () => {
    input.value = toKebabCase(input.value);
  };

  // String casing helper functions
  function toCamelCase(str) {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
  }

  function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  function toSnakeCase(str) {
    return str.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_');
  }

  function toKebabCase(str) {
    return str.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-');
  }
}

// 3. Text Diff Checker
function renderDiffChecker(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="workspace-split">
        <div>
          <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Original Text</label>
          <textarea class="textarea-custom" id="diffText1" placeholder="Paste original text..."></textarea>
        </div>
        <div>
          <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Modified Text</label>
          <textarea class="textarea-custom" id="diffText2" placeholder="Paste modified text..."></textarea>
        </div>
      </div>
      
      <div class="control-group">
        <button class="action-btn" id="findDiffBtn">Check Differences</button>
      </div>
      
      <div class="diff-container" id="diffOutputContainer" style="display: none;">
        <h3 style="font-size: 1rem;">Changes Output:</h3>
        <div class="diff-view" id="diffOutput"></div>
      </div>
    </div>
  `;

  const text1 = container.querySelector('#diffText1');
  const text2 = container.querySelector('#diffText2');
  const findBtn = container.querySelector('#findDiffBtn');
  const outputContainer = container.querySelector('#diffOutputContainer');
  const output = container.querySelector('#diffOutput');

  findBtn.onclick = () => {
    const val1 = text1.value;
    const val2 = text2.value;

    const diffs = Diff.diffLines(val1, val2);
    output.innerHTML = '';
    outputContainer.style.display = 'block';

    let lineIndex = 1;
    diffs.forEach((part) => {
      const cls = part.added ? 'added' : part.removed ? 'removed' : '';
      const symbol = part.added ? '+' : part.removed ? '-' : ' ';
      
      const lines = part.value.split('\n');
      // If trailing newline, remove last empty split
      if (lines[lines.length - 1] === '') lines.pop();

      lines.forEach((line) => {
        const row = document.createElement('div');
        row.className = `diff-line ${cls}`;
        row.innerHTML = `
          <span class="diff-line-num">${part.removed ? '' : lineIndex++}</span>
          <span class="diff-line-content">${symbol} ${helpers.escapeHtml(line)}</span>
        `;
        output.appendChild(row);
      });
    });

    helpers.showToast('Diff successfully checked!');
  };
}

// 4. Duplicate Line Remover
function renderDupRemover(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <textarea class="textarea-custom" id="dupInput" placeholder="Paste lines with duplicates here..."></textarea>
      
      <div class="control-group">
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="dupSort" />
            <label for="dupSort" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Sort Lines Alphabetically</label>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="dupIgnoreEmpty" checked />
            <label for="dupIgnoreEmpty" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Ignore Empty Lines</label>
          </div>
        </div>
        <button class="action-btn" id="dupBtn">Remove Duplicate Lines</button>
      </div>
    </div>
  `;

  const input = container.querySelector('#dupInput');
  const sortCheck = container.querySelector('#dupSort');
  const ignoreEmptyCheck = container.querySelector('#dupIgnoreEmpty');
  const btn = container.querySelector('#dupBtn');

  btn.onclick = () => {
    const rawText = input.value;
    if (!rawText.trim()) return;

    const lines = rawText.split('\n');
    const unique = [];
    const seen = new Set();

    lines.forEach((line) => {
      const formatted = line;
      if (ignoreEmptyCheck.checked && formatted.trim() === '') {
        unique.push('');
        return;
      }
      
      if (!seen.has(formatted)) {
        seen.add(formatted);
        unique.push(line);
      }
    });

    // Clean eventual continuous blanks
    let filtered = unique;
    if (ignoreEmptyCheck.checked) {
      filtered = unique.filter((l, i) => l !== '' || unique[i-1] !== '');
    }

    if (sortCheck.checked) {
      filtered.sort((a, b) => a.localeCompare(b));
    }

    const initialCount = lines.length;
    const finalCount = filtered.length;
    const diff = initialCount - finalCount;

    input.value = filtered.join('\n');
    helpers.showToast(`Cleaned! Removed ${diff} duplicate lines.`);
  };
}

// 5. Random Password Generator
function renderPassGenerator(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="control-group" style="margin-top: 0;">
        <div class="hash-output-row" style="background-color: rgba(255, 255, 255, 0.03); padding: 18px; margin-bottom: 20px;">
          <span class="hash-value" id="generatedPassword" style="font-size: 1.25rem; color: #fff; letter-spacing: 1px;">- Click Generate -</span>
          <button class="btn-icon" id="copyPassBtn" title="Copy to clipboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        
        <div class="control-item">
          <label>Password Length</label>
          <div class="slider-container">
            <input type="range" class="range-slider" id="passLength" min="6" max="64" value="16" />
            <span class="slider-val" id="lengthLabel">16</span>
          </div>
        </div>
        
        <div class="control-row">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="passLower" checked />
              <label for="passLower" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Lowercase letters (a-z)</label>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="passUpper" checked />
              <label for="passUpper" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Uppercase letters (A-Z)</label>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="passNumbers" checked />
              <label for="passNumbers" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Numbers (0-9)</label>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="passSymbols" checked />
              <label for="passSymbols" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Symbols (@#$!%*?&)</label>
            </div>
          </div>
        </div>
        
        <div class="control-item" style="margin-top: 10px;">
          <label>Password Strength / Entropy</label>
          <div class="password-entropy-bar">
            <div class="password-entropy-fill strength-weak" id="strengthBar"></div>
          </div>
          <span class="dropzone-subtext" id="strengthLabel" style="margin-top: 4px;">Strength: Low</span>
        </div>
        
        <button class="action-btn" id="generatePassBtn">Generate Password</button>
      </div>
    </div>
  `;

  const output = container.querySelector('#generatedPassword');
  const copyBtn = container.querySelector('#copyPassBtn');
  const lengthSlider = container.querySelector('#passLength');
  const lengthLabel = container.querySelector('#lengthLabel');
  const lowerCheck = container.querySelector('#passLower');
  const upperCheck = container.querySelector('#passUpper');
  const numCheck = container.querySelector('#passNumbers');
  const symCheck = container.querySelector('#passSymbols');
  const strengthBar = container.querySelector('#strengthBar');
  const strengthLabel = container.querySelector('#strengthLabel');
  const generateBtn = container.querySelector('#generatePassBtn');

  lengthSlider.oninput = () => {
    lengthLabel.textContent = lengthSlider.value;
  };

  generateBtn.onclick = () => {
    const len = parseInt(lengthSlider.value);
    const useLower = lowerCheck.checked;
    const useUpper = upperCheck.checked;
    const useNum = numCheck.checked;
    const useSym = symCheck.checked;

    if (!useLower && !useUpper && !useNum && !useSym) {
      helpers.showToast('Please select at least one character set.', 'warning');
      return;
    }

    let charPool = '';
    if (useLower) charPool += 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper) charPool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNum) charPool += '0123456789';
    if (useSym) charPool += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let pass = '';
    const randomBuffer = new Uint32Array(len);
    window.crypto.getRandomValues(randomBuffer);
    for (let i = 0; i < len; i++) {
      pass += charPool.charAt(randomBuffer[i] % charPool.length);
    }

    output.textContent = pass;
    
    // Evaluate strength (Shannon entropy based)
    let poolSize = charPool.length;
    let entropy = len * Math.log2(poolSize);
    
    strengthBar.className = 'password-entropy-fill';
    if (entropy < 40) {
      strengthBar.classList.add('strength-weak');
      strengthLabel.textContent = `Strength: Weak (${Math.round(entropy)} bits entropy)`;
    } else if (entropy < 60) {
      strengthBar.classList.add('strength-fair');
      strengthLabel.textContent = `Strength: Fair (${Math.round(entropy)} bits entropy)`;
    } else if (entropy < 80) {
      strengthBar.classList.add('strength-good');
      strengthLabel.textContent = `Strength: Good (${Math.round(entropy)} bits entropy)`;
    } else {
      strengthBar.classList.add('strength-strong');
      strengthLabel.textContent = `Strength: Strong (${Math.round(entropy)} bits entropy)`;
    }
  };

  copyBtn.onclick = () => {
    const text = output.textContent;
    if (text && text !== '- Click Generate -') {
      helpers.copyToClipboard(text);
    }
  };
}

// 6. QR Code Generator
function renderQrGenerator(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="workspace-split">
        <div>
          <div class="control-group" style="margin-top: 0;">
            <div class="control-item">
              <label>QR Payload Data (Text or URL)</label>
              <textarea class="textarea-custom" id="qrText" style="height: 120px;" placeholder="Enter website link, text, email, phone number..."></textarea>
            </div>
            <div class="control-row">
              <div class="control-item">
                <label>Foreground Color</label>
                <input type="color" id="qrColorDark" value="#000000" style="border: none; border-radius: 4px; width: 50px; height: 36px; cursor: pointer;" />
              </div>
              <div class="control-item">
                <label>Background Color</label>
                <input type="color" id="qrColorLight" value="#ffffff" style="border: none; border-radius: 4px; width: 50px; height: 36px; cursor: pointer;" />
              </div>
            </div>
            <button class="action-btn" id="generateQrBtn">Generate QR Code</button>
          </div>
        </div>
        
        <div class="code-output-container" style="display: none;" id="qrOutputPanel">
          <canvas id="qrCanvas"></canvas>
          <button class="action-btn action-btn-secondary" id="downloadQrBtn">Download PNG</button>
        </div>
      </div>
    </div>
  `;

  const payload = container.querySelector('#qrText');
  const colorDark = container.querySelector('#qrColorDark');
  const colorLight = container.querySelector('#qrColorLight');
  const generateBtn = container.querySelector('#generateQrBtn');
  const outputPanel = container.querySelector('#qrOutputPanel');
  const canvas = container.querySelector('#qrCanvas');
  const downloadBtn = container.querySelector('#downloadQrBtn');

  generateBtn.onclick = () => {
    const text = payload.value.trim();
    if (!text) {
      helpers.showToast('Please enter text to embed.', 'warning');
      return;
    }

    QRCode.toCanvas(canvas, text, {
      width: 256,
      margin: 2,
      color: {
        dark: colorDark.value,
        light: colorLight.value
      }
    }, (error) => {
      if (error) {
        helpers.showToast('QR Code Generation failed: ' + error.message, 'error');
      } else {
        outputPanel.style.display = 'flex';
        helpers.showToast('QR Code generated successfully!');
      }
    });
  };

  downloadBtn.onclick = () => {
    canvas.toBlob((blob) => {
      helpers.downloadFile(blob, 'qrcode.png');
    });
  };
}

// 7. Barcode Generator
function renderBarcodeGenerator(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="workspace-split">
        <div>
          <div class="control-group" style="margin-top: 0;">
            <div class="control-item">
              <label>Barcode Value (Numbers/Letters depending on format)</label>
              <input type="text" class="input-text" id="barValue" value="123456789012" placeholder="e.g. 123456789012" />
            </div>
            <div class="control-item">
              <label>Barcode Format</label>
              <select class="input-select" id="barFormat">
                <option value="CODE128">Code 128 (Standard alphanumeric)</option>
                <option value="EAN13">EAN 13 (Standard retail - 13 digits)</option>
                <option value="UPC">UPC-A (US retail - 12 digits)</option>
                <option value="CODE39">Code 39 (Industrial)</option>
              </select>
            </div>
            <button class="action-btn" id="generateBarBtn">Generate Barcode</button>
          </div>
        </div>
        
        <div class="code-output-container" style="display: none;" id="barOutputPanel">
          <svg id="barcodeSvg"></svg>
          <button class="action-btn action-btn-secondary" id="downloadBarBtn">Download SVG</button>
        </div>
      </div>
    </div>
  `;

  const valueInput = container.querySelector('#barValue');
  const formatSelect = container.querySelector('#barFormat');
  const generateBtn = container.querySelector('#generateBarBtn');
  const outputPanel = container.querySelector('#barOutputPanel');
  const svg = container.querySelector('#barcodeSvg');
  const downloadBtn = container.querySelector('#downloadBarBtn');

  generateBtn.onclick = () => {
    const val = valueInput.value.trim();
    if (!val) {
      helpers.showToast('Please enter barcode value.', 'warning');
      return;
    }

    try {
      JsBarcode(svg, val, {
        format: formatSelect.value,
        lineColor: '#000000',
        background: '#ffffff',
        width: 2,
        height: 80,
        displayValue: true
      });
      outputPanel.style.display = 'flex';
      helpers.showToast('Barcode generated successfully!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Barcode generation failed. Please verify format constraints.', 'error');
    }
  };

  downloadBtn.onclick = () => {
    // Export SVG markup as file
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    helpers.downloadFile(svgBlob, 'barcode.svg');
  };
}
