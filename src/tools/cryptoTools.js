export function initCryptoTool(toolId, container, helpers) {
  container.innerHTML = '';

  switch (toolId) {
    case 'pass-strength':
      renderPasswordStrength(container, helpers);
      break;
    case 'hash-generator':
      renderHashGenerator(container, helpers);
      break;
    case 'hash-verifier':
      renderHashVerifier(container, helpers);
      break;
    case 'base64-codec':
      renderBase64Codec(container, helpers);
      break;
    case 'url-codec':
      renderUrlCodec(container, helpers);
      break;
    case 'jwt-decoder':
      renderJwtDecoder(container, helpers);
      break;
    case 'aes-playground':
      renderAesPlayground(container, helpers);
      break;
    default:
      container.innerHTML = `<p>Security tool "${toolId}" is under construction.</p>`;
  }
}

// 1. Password Strength Analyzer
function renderPasswordStrength(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="control-group" style="margin-top: 0;">
        <div class="control-item">
          <label>Password to Analyze</label>
          <div class="search-wrapper" style="width: 100%;">
            <input type="password" class="input-text" id="strengthInput" placeholder="Type password here..." style="width: 100%; font-family: var(--font-mono); letter-spacing: 1px;" />
            <button class="btn-icon" id="toggleReveal" style="position: absolute; right: 12px; height: 100%; top: 0;" title="Reveal Password">👁️</button>
          </div>
        </div>
        
        <div class="control-item" style="margin-top: 10px;">
          <label>Interactive Analysis</label>
          <div class="password-entropy-bar">
            <div class="password-entropy-fill" id="analBar" style="width: 0%;"></div>
          </div>
          <span class="dropzone-subtext" id="analLabel" style="margin-top: 4px; font-weight:700;">Score: 0%</span>
        </div>
        
        <div class="diff-container" style="background-color: rgba(255,255,255,0.01); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <h4 style="font-size: 0.9rem; margin-bottom: 8px;">Analysis Metrics Checklist:</h4>
          <ul style="list-style: none; font-size: 0.85rem; display: flex; flex-direction: column; gap: 8px;">
            <li id="chkLength">❌ Length >= 10 characters</li>
            <li id="chkUpper">❌ Contains uppercase letter</li>
            <li id="chkLower">❌ Contains lowercase letter</li>
            <li id="chkNumber">❌ Contains a number</li>
            <li id="chkSpecial">❌ Contains a special symbol</li>
            <li id="chkCrackingTime" style="margin-top: 10px; font-weight: 700; color: var(--accent-blue);">Estimated cracking time: Instantaneous</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector('#strengthInput');
  const revealBtn = container.querySelector('#toggleReveal');
  const analBar = container.querySelector('#analBar');
  const analLabel = container.querySelector('#analLabel');
  
  const chkLength = container.querySelector('#chkLength');
  const chkUpper = container.querySelector('#chkUpper');
  const chkLower = container.querySelector('#chkLower');
  const chkNumber = container.querySelector('#chkNumber');
  const chkSpecial = container.querySelector('#chkSpecial');
  const chkCrackingTime = container.querySelector('#chkCrackingTime');

  revealBtn.onclick = () => {
    if (input.type === 'password') {
      input.type = 'text';
      revealBtn.textContent = '🔒';
    } else {
      input.type = 'password';
      revealBtn.textContent = '👁️';
    }
  };

  input.oninput = () => {
    const val = input.value;
    
    const conditions = {
      length: val.length >= 10,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val)
    };

    updateChecklist(chkLength, conditions.length, "Length >= 10 characters");
    updateChecklist(chkUpper, conditions.upper, "Contains uppercase letter");
    updateChecklist(chkLower, conditions.lower, "Contains lowercase letter");
    updateChecklist(chkNumber, conditions.number, "Contains a number");
    updateChecklist(chkSpecial, conditions.special, "Contains a special symbol");

    // Dynamic Scoring
    let score = 0;
    if (val.length > 0) {
      if (conditions.length) score += 20;
      if (conditions.upper) score += 20;
      if (conditions.lower) score += 20;
      if (conditions.number) score += 20;
      if (conditions.special) score += 20;
      
      // Scale length bonus
      if (val.length >= 16) score += 10;
      if (val.length >= 24) score += 10;
      score = Math.min(100, score);
    }

    analBar.style.width = `${score}%`;
    analBar.className = 'password-entropy-fill';
    
    if (score < 40) {
      analBar.classList.add('strength-weak');
      analLabel.textContent = `Score: ${score}% (Weak)`;
    } else if (score < 70) {
      analBar.classList.add('strength-fair');
      analLabel.textContent = `Score: ${score}% (Medium)`;
    } else if (score < 90) {
      analBar.classList.add('strength-good');
      analLabel.textContent = `Score: ${score}% (Good)`;
    } else {
      analBar.classList.add('strength-strong');
      analLabel.textContent = `Score: ${score}% (Excellent / Strong)`;
    }

    // Cracking Time Estimate
    if (val.length === 0) {
      chkCrackingTime.textContent = 'Estimated cracking time: -';
    } else {
      let entropy = calculateEntropy(val);
      chkCrackingTime.textContent = `Estimated cracking time: ${getCrackTimeText(entropy)}`;
    }
  };

  function updateChecklist(element, condition, text) {
    if (condition) {
      element.innerHTML = `<span style="color:var(--cat-img)">✓</span> ${text}`;
      element.style.color = 'var(--text-main)';
    } else {
      element.innerHTML = `<span style="color:var(--cat-vid)">❌</span> ${text}`;
      element.style.color = 'var(--text-muted)';
    }
  }

  function calculateEntropy(str) {
    let charset = 0;
    if (/[a-z]/.test(str)) charset += 26;
    if (/[A-Z]/.test(str)) charset += 26;
    if (/[0-9]/.test(str)) charset += 10;
    if (/[^A-Za-z0-9]/.test(str)) charset += 32;
    return str.length * Math.log2(charset || 1);
  }

  function getCrackTimeText(entropy) {
    // Assumes 10^10 hashes per second (reasonable GPU cluster)
    const guesses = Math.pow(2, entropy);
    const seconds = guesses / 1e10;
    
    if (seconds < 1) return "Instantaneous";
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`;
    return "Centuries / Uncrackable";
  }
}

// 2. Hash Generator
function renderHashGenerator(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <textarea class="textarea-custom" id="hashTextInput" style="height: 120px;" placeholder="Type text here to hash..."></textarea>
      
      <div class="control-group">
        <button class="action-btn" id="generateHashesBtn">Generate Hashes</button>
      </div>
      
      <div class="control-group" id="hashOutputs" style="display: none; margin-top: 20px;">
        <div class="hash-output-row">
          <span class="hash-label">SHA-256</span>
          <span class="hash-value" id="hashSHA256"></span>
          <button class="btn-icon copy-hash" data-target="hashSHA256">📋</button>
        </div>
        <div class="hash-output-row">
          <span class="hash-label">SHA-512</span>
          <span class="hash-value" id="hashSHA512"></span>
          <button class="btn-icon copy-hash" data-target="hashSHA512">📋</button>
        </div>
        <div class="hash-output-row">
          <span class="hash-label">SHA-1</span>
          <span class="hash-value" id="hashSHA1"></span>
          <button class="btn-icon copy-hash" data-target="hashSHA1">📋</button>
        </div>
        <div class="hash-output-row">
          <span class="hash-label">MD5</span>
          <span class="hash-value" id="hashMD5"></span>
          <button class="btn-icon copy-hash" data-target="hashMD5">📋</button>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector('#hashTextInput');
  const generateBtn = container.querySelector('#generateHashesBtn');
  const outputs = container.querySelector('#hashOutputs');
  
  const hash256 = container.querySelector('#hashSHA256');
  const hash512 = container.querySelector('#hashSHA512');
  const hash1 = container.querySelector('#hashSHA1');
  const hashMd5 = container.querySelector('#hashMD5');

  generateBtn.onclick = async () => {
    const text = input.value;
    if (!text) return;
    
    outputs.style.display = 'block';
    
    // Web Crypto digests
    hash256.textContent = await computeDigest(text, 'SHA-256');
    hash512.textContent = await computeDigest(text, 'SHA-512');
    hash1.textContent = await computeDigest(text, 'SHA-1');
    hashMd5.textContent = md5(text);
  };

  async function computeDigest(str, algorithm) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Bind clipboard copies
  container.querySelectorAll('.copy-hash').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-target');
      helpers.copyToClipboard(container.querySelector(`#${id}`).textContent);
    };
  });

  // MD5 JavaScript implementation
  function md5(string) {
    function rotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
      var lX4, lY4, lX8, lY8, lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      if (lX4 | lY4) {
        if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      } else return (lResult ^ lX8 ^ lY8);
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }
    
    function FF(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    
    function convertToWordArray(string) {
      var lWordCount;
      var lMessageLength = string.length;
      var lNumberOfWords_temp1 = lMessageLength + 8;
      var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
      var lWordArray = Array(lWordArray);
      var lBytePosition = 0;
      var lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    }
    
    function wordToHex(lValue) {
      var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        WordToHexValue_temp = "0" + lByte.toString(16);
        WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
      }
      return WordToHexValue;
    }

    function utf8Encode(string) {
      string = string.replace(/\r\n/g, "\n");
      var utftext = "";
      for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }

    var x = Array();
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    
    string = utf8Encode(string);
    x = convertToWordArray(string);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
      AA = a; BB = b; CC = c; DD = d;
      a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478); d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB); b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF); d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613); b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8); d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1); b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122); d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E); b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562); d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51); b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D); d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681); b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6); d = GG(d, a, b, c, x[k + 2], S22, 0xC33707D6);
      c = GG(c, d, a, b, x[k + 7], S23, 0xF4D50D87); b = GG(b, c, d, a, x[k + 12], S24, 0x455A14ED);
      a = GG(a, b, c, d, x[k + 3], S21, 0xA9E3E905); d = GG(d, a, b, c, x[k + 8], S22, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k + 13], S23, 0x676F02D9); b = GG(b, c, d, a, x[k + 5], S24, 0x8D2A4C8A);
      a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942); d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122); b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44); d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k + 7], S33, 0xF6bb4b60); b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6); d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085); b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
      a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039); d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8); b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = II(a, b, c, d, x[k + 0], S41, 0xF4292244); d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7); b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3); d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D); b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F); d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k + 6], S43, 0xA3014314); b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82); d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB); b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
    return temp.toLowerCase();
  }
}

// 3. File Hash Verifier
function renderHashVerifier(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="dropzone" id="hashFileDropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        <span class="dropzone-text">Upload File to Verify Hash</span>
        <input type="file" id="hashFileInput" class="file-input" />
      </div>
      
      <div id="hashVerifierConfig" style="display: none; margin-top: 20px;">
        <div class="file-item" style="margin-bottom: 20px;">
          <div class="file-info">
            <span class="file-name" id="hashFileName"></span>
            <span class="file-size" id="hashFileSize"></span>
          </div>
          <button class="btn-icon delete" id="clearHashFile">✕</button>
        </div>
        
        <div class="control-group">
          <div class="control-row">
            <div class="control-item">
              <label>Select Hash Algorithm</label>
              <select class="input-select" id="hashAlgoSelect">
                <option value="SHA-256" selected>SHA-256</option>
                <option value="SHA-512">SHA-512</option>
                <option value="SHA-1">SHA-1</option>
              </select>
            </div>
          </div>
          <div class="control-item">
            <label>Expected Hash (Hexadecimal)</label>
            <input type="text" class="input-text" id="expectedHash" placeholder="Paste expected hash to compare..." />
          </div>
          <button class="action-btn" id="verifyHashBtn">Verify File Hash</button>
        </div>
        
        <div class="hash-output-row" id="verifierResults" style="display: none; margin-top: 20px; flex-direction: column; align-items: start; gap: 8px;">
          <div>Computed Hash: <span id="computedHashVal" style="color:#fff; font-weight:700;"></span></div>
          <div id="verificationStatus" style="font-weight: 700;"></div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#hashFileDropzone');
  const fileInput = container.querySelector('#hashFileInput');
  const config = container.querySelector('#hashVerifierConfig');
  const fileName = container.querySelector('#hashFileName');
  const fileSize = container.querySelector('#hashFileSize');
  const clearBtn = container.querySelector('#clearHashFile');
  const algoSelect = container.querySelector('#hashAlgoSelect');
  const expectedInput = container.querySelector('#expectedHash');
  const verifyBtn = container.querySelector('#verifyHashBtn');
  
  const resultsDiv = container.querySelector('#verifierResults');
  const computedHashVal = container.querySelector('#computedHashVal');
  const statusDiv = container.querySelector('#verificationStatus');

  let activeFile = null;

  helpers.setupDragAndDrop(dropzone, fileInput, (files) => {
    if (files.length > 0) {
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
    expectedInput.value = '';
    resultsDiv.style.display = 'none';
  };

  verifyBtn.onclick = async () => {
    if (!activeFile) return;
    helpers.showProgress(15);
    helpers.showToast('Reading file data...');
    resultsDiv.style.display = 'none';

    try {
      const buffer = await activeFile.arrayBuffer();
      helpers.showProgress(55);
      helpers.showToast('Computing cryptographic hash...');

      const algo = algoSelect.value;
      const hashBuffer = await crypto.subtle.digest(algo, buffer);
      
      helpers.showProgress(85);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      computedHashVal.textContent = hashHex;
      resultsDiv.style.display = 'flex';

      const expected = expectedInput.value.trim().toLowerCase();
      if (!expected) {
        statusDiv.textContent = 'Hash computed (no expected hash provided to compare).';
        statusDiv.style.color = 'var(--text-muted)';
      } else if (expected === hashHex) {
        statusDiv.textContent = '✓ MATCH! The file hash matches your expected signature.';
        statusDiv.style.color = 'var(--cat-img)';
      } else {
        statusDiv.textContent = '❌ MISMATCH! Computed hash does not match your expected signature.';
        statusDiv.style.color = 'var(--cat-vid)';
      }
    } catch (err) {
      console.error(err);
      helpers.showToast('Hash calculation failed: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };
}

// 4. Base64 Encoder / Decoder
function renderBase64Codec(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="workspace-split">
        <div>
          <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Plain Text</label>
          <textarea class="textarea-custom" id="b64Text" placeholder="Plain text input..."></textarea>
        </div>
        <div>
          <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Base64 Encoded</label>
          <textarea class="textarea-custom" id="b64Cipher" placeholder="Base64 encoded output..."></textarea>
        </div>
      </div>
      
      <div class="control-group">
        <div class="control-row">
          <button class="action-btn" id="b64EncodeBtn">Encode →</button>
          <button class="action-btn action-btn-secondary" id="b64DecodeBtn">← Decode</button>
        </div>
      </div>
    </div>
  `;

  const text = container.querySelector('#b64Text');
  const cipher = container.querySelector('#b64Cipher');

  container.querySelector('#b64EncodeBtn').onclick = () => {
    try {
      // Handles unicode base64 safely
      const bytes = new TextEncoder().encode(text.value);
      const binString = String.fromCodePoint(...bytes);
      cipher.value = btoa(binString);
      helpers.showToast('Text Base64 encoded!');
    } catch (err) {
      helpers.showToast('Encoding error: ' + err.message, 'error');
    }
  };

  container.querySelector('#b64DecodeBtn').onclick = () => {
    try {
      const binString = atob(cipher.value.trim());
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
      text.value = new TextDecoder().decode(bytes);
      helpers.showToast('Base64 decoded successfully!');
    } catch (err) {
      helpers.showToast('Decoding error: Check code format.', 'error');
    }
  };
}

// 5. URL Encoder / Decoder
function renderUrlCodec(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="workspace-split">
        <div>
          <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Plain URL / Text</label>
          <textarea class="textarea-custom" id="urlText" placeholder="Plain URL input..."></textarea>
        </div>
        <div>
          <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">URL Encoded</label>
          <textarea class="textarea-custom" id="urlEncoded" placeholder="URL encoded output..."></textarea>
        </div>
      </div>
      
      <div class="control-group">
        <div class="control-row">
          <button class="action-btn" id="urlEncodeBtn">Encode →</button>
          <button class="action-btn action-btn-secondary" id="urlDecodeBtn">← Decode</button>
        </div>
      </div>
    </div>
  `;

  const text = container.querySelector('#urlText');
  const encoded = container.querySelector('#urlEncoded');

  container.querySelector('#urlEncodeBtn').onclick = () => {
    try {
      encoded.value = encodeURIComponent(text.value);
      helpers.showToast('URL Encoded!');
    } catch (err) {
      helpers.showToast('Encoding error: ' + err.message, 'error');
    }
  };

  container.querySelector('#urlDecodeBtn').onclick = () => {
    try {
      text.value = decodeURIComponent(encoded.value);
      helpers.showToast('URL Decoded successfully!');
    } catch (err) {
      helpers.showToast('Decoding error: invalid character sequences.', 'error');
    }
  };
}

// 6. JWT Decoder
function renderJwtDecoder(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="control-item">
        <label>JSON Web Token (JWT)</label>
        <textarea class="textarea-custom" id="jwtInput" style="height: 100px;" placeholder="Paste JWT here (header.payload.signature)"></textarea>
      </div>
      
      <div class="control-group">
        <button class="action-btn" id="jwtDecodeBtn">Decode JWT</button>
      </div>
      
      <div id="jwtOutputs" style="display: none; margin-top: 20px;">
        <div class="workspace-split">
          <div>
            <h4 style="font-size: 0.9rem; margin-bottom: 6px; color: var(--cat-txt);">Header (Decoded)</h4>
            <pre id="jwtHeader" style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; font-family: var(--font-mono); font-size:0.8rem; border: 1px solid var(--border-color);"></pre>
          </div>
          <div>
            <h4 style="font-size: 0.9rem; margin-bottom: 6px; color: var(--cat-img);">Payload (Decoded)</h4>
            <pre id="jwtPayload" style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; font-family: var(--font-mono); font-size:0.8rem; border: 1px solid var(--border-color);"></pre>
          </div>
        </div>
        
        <div class="diff-container" id="jwtWarningBox" style="margin-top: 20px; display: none; background-color: rgba(244,63,94,0.1); border-color: rgba(244,63,94,0.2);">
          <span style="font-weight: 700; color: var(--cat-vid);">⚠ Security Alerts:</span>
          <ul id="jwtAlertList" style="margin-left: 20px; font-size: 0.85rem; color: var(--text-main);"></ul>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector('#jwtInput');
  const decodeBtn = container.querySelector('#jwtDecodeBtn');
  const outputs = container.querySelector('#jwtOutputs');
  const headerPre = container.querySelector('#jwtHeader');
  const payloadPre = container.querySelector('#jwtPayload');
  
  const warningBox = container.querySelector('#jwtWarningBox');
  const alertList = container.querySelector('#jwtAlertList');

  decodeBtn.onclick = () => {
    const token = input.value.trim();
    if (!token) return;

    const parts = token.split('.');
    if (parts.length !== 3) {
      helpers.showToast('Invalid JWT. Token must contain header, payload, and signature segments.', 'error');
      return;
    }

    try {
      const headerStr = jwtBase64Decode(parts[0]);
      const payloadStr = jwtBase64Decode(parts[1]);
      
      const header = JSON.parse(headerStr);
      const payload = JSON.parse(payloadStr);

      headerPre.textContent = JSON.stringify(header, null, 2);
      payloadPre.textContent = JSON.stringify(payload, null, 2);
      outputs.style.display = 'block';

      // Security Checks
      alertList.innerHTML = '';
      const warnings = [];

      if (header.alg === 'none') {
        warnings.push('Signature verification is bypassed (alg: none)! This token is highly insecure.');
      }
      
      // Check expiration
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const expired = expDate < new Date();
        if (expired) {
          warnings.push(`Token has expired! Expiration: ${expDate.toLocaleString()}`);
        } else {
          warnings.push(`Token is active. Expires: ${expDate.toLocaleString()}`);
        }
      } else {
        warnings.push('Token lacks expiration timestamp (exp claim).');
      }

      if (warnings.length > 0) {
        warningBox.style.display = 'block';
        warnings.forEach(w => {
          const li = document.createElement('li');
          li.textContent = w;
          alertList.appendChild(li);
        });
      } else {
        warningBox.style.display = 'none';
      }

      helpers.showToast('JWT decoded successfully!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Parsing error. Verify Token content.', 'error');
    }
  };

  function jwtBase64Decode(str) {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0: break;
      case 2: output += '=='; break;
      case 3: output += '='; break;
      default: throw 'Illegal base64url string!';
    }
    return decodeURIComponent(atob(output).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }
}

// 7. Encryption/Decryption Playground (Secure AES-GCM via SubtleCrypto)
function renderAesPlayground(container, helpers) {
  container.innerHTML = `
    <div class="tool-view">
      <div class="control-row" style="margin-top:0;">
        <div class="control-item">
          <label>Password Key (Passphrase)</label>
          <input type="password" class="input-text" id="aesPass" placeholder="Enter passphrase to secure payload" />
        </div>
      </div>
      
      <div class="workspace-split" style="margin-top: 10px;">
        <div>
          <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Plain Text</label>
          <textarea class="textarea-custom" id="aesPlain" placeholder="Enter confidential text to encrypt..."></textarea>
        </div>
        <div>
          <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Encrypted Payload (Base64)</label>
          <textarea class="textarea-custom" id="aesCipher" placeholder="Encrypted Base64 text outputs here..."></textarea>
        </div>
      </div>
      
      <div class="control-group">
        <div class="control-row">
          <button class="action-btn" id="aesEncryptBtn">Encrypt →</button>
          <button class="action-btn action-btn-secondary" id="aesDecryptBtn">← Decrypt</button>
        </div>
        <div class="dropzone-subtext">Uses AES-GCM (256-bit key derived via PBKDF2 with 100k SHA-256 iterations) entirely local to your device.</div>
      </div>
    </div>
  `;

  const pass = container.querySelector('#aesPass');
  const plain = container.querySelector('#aesPlain');
  const cipher = container.querySelector('#aesCipher');

  // Key Derivation Helper from password + salt
  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  container.querySelector('#aesEncryptBtn').onclick = async () => {
    const password = pass.value;
    const text = plain.value;
    
    if (!password) {
      helpers.showToast('Please set a secret Passphrase key.', 'warning');
      return;
    }
    if (!text) return;

    helpers.showProgress(30);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const key = await deriveKey(password, salt);
      helpers.showProgress(60);
      
      const enc = new TextEncoder();
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        enc.encode(text)
      );

      // Pack salt + iv + ciphertext together
      const encryptedArr = new Uint8Array(encryptedBuffer);
      const packed = new Uint8Array(salt.length + iv.length + encryptedArr.length);
      packed.set(salt, 0);
      packed.set(iv, salt.length);
      packed.set(encryptedArr, salt.length + iv.length);

      // Encode packaged array to Base64
      let binary = '';
      for (let i = 0; i < packed.length; i++) {
        binary += String.fromCharCode(packed[i]);
      }
      
      cipher.value = btoa(binary);
      helpers.showToast('Text encrypted successfully!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Encryption failed: ' + err.message, 'error');
    } finally {
      helpers.hideProgress();
    }
  };

  container.querySelector('#aesDecryptBtn').onclick = async () => {
    const password = pass.value;
    const base64Data = cipher.value.trim();

    if (!password) {
      helpers.showToast('Please enter the Passphrase key.', 'warning');
      return;
    }
    if (!base64Data) return;

    helpers.showProgress(30);
    try {
      // Decode Base64
      const binary = atob(base64Data);
      const packed = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        packed[i] = binary.charCodeAt(i);
      }

      // Unpack salt, iv, and ciphertext
      const salt = packed.slice(0, 16);
      const iv = packed.slice(16, 28);
      const cipherText = packed.slice(28);

      const key = await deriveKey(password, salt);
      helpers.showProgress(70);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        cipherText
      );

      const dec = new TextDecoder();
      plain.value = dec.decode(decryptedBuffer);
      helpers.showToast('Decrypted successfully!');
    } catch (err) {
      console.error(err);
      helpers.showToast('Decrypt failed. Double check key and payload.', 'error');
    } finally {
      helpers.hideProgress();
    }
  };
}
