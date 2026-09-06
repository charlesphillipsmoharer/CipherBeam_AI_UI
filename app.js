let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
}

function playCyberTone(type = 'click') {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'encrypt') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'transmit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'auth-success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    // Audio optional fallback
  }
}

function toggleAudioFx() {
  soundEnabled = !soundEnabled;
  const audioLabel = document.getElementById('audioLabel');
  const audioIcon = document.getElementById('audioIcon');
  const settingsToggle = document.getElementById('settingsAudioToggle');

  if (soundEnabled) {
    if (audioLabel) audioLabel.textContent = 'AUDIO ON';
    if (audioIcon) audioIcon.setAttribute('data-lucide', 'volume-2');
    if (settingsToggle) settingsToggle.checked = true;
    showToast('Cyber Audio Soundscape: ENABLED');
    playCyberTone('click');
  } else {
    if (audioLabel) audioLabel.textContent = 'MUTED';
    if (audioIcon) audioIcon.setAttribute('data-lucide', 'volume-x');
    if (settingsToggle) settingsToggle.checked = false;
    showToast('Cyber Audio Soundscape: MUTED');
  }
  if (window.lucide) lucide.createIcons();
}

// ========================================================
// 2. 3D HOLOGRAPHIC STAGE, PARALLAX ENGINE & AUTH PORTAL
// ========================================================
let is3DEnabled = true;
let currentRotX = 0;
let currentRotY = 0;
let targetRotX = 0;
let targetRotY = 0;
let parallaxRaf = null;
let telemetryInterval = null;
let activeWindow = 'center'; // 'left' | 'center' | 'right'
let authMode = 'login'; // 'login' | 'signup'
let isScanning = false;

function init3DParallax() {
  const authPortal = document.getElementById('authPortal');
  if (!authPortal) return;

  // Mouse move parallax listener
  authPortal.addEventListener('mousemove', (e) => {
    if (!is3DEnabled) return;
    const rect = authPortal.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    targetRotY = normX * 13; // Max 13 deg yaw
    targetRotX = -normY * 9; // Max 9 deg pitch
  });

  // Smoothly return toward center when mouse leaves
  authPortal.addEventListener('mouseleave', () => {
    targetRotX = 0;
    targetRotY = 0;
  });

  // Touch move for mobile devices
  authPortal.addEventListener('touchmove', (e) => {
    if (!is3DEnabled || !e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = authPortal.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normX = (touch.clientX - centerX) / (rect.width / 2);
    const normY = (touch.clientY - centerY) / (rect.height / 2);

    targetRotY = normX * 10;
    targetRotX = -normY * 7;
  }, { passive: true });

  // Optional Gyroscope tilt on mobile
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (!is3DEnabled || e.gamma === null) return;
      targetRotY = Math.max(-12, Math.min(12, e.gamma * 0.45));
      targetRotX = Math.max(-9, Math.min(9, (e.beta - 40) * 0.35));
    });
  }

  // High-FPS RequestAnimationFrame smooth lerp loop
  function animate3D() {
    if (is3DEnabled) {
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      const stage = document.getElementById('auth3DStage');
      if (stage) {
        stage.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;
      }
    }
    parallaxRaf = requestAnimationFrame(animate3D);
  }
  if (!parallaxRaf) {
    parallaxRaf = requestAnimationFrame(animate3D);
  }

  // Hover sound on the 3D logo
  const logo = document.getElementById('authCipherLogo');
  if (logo) {
    logo.addEventListener('mouseenter', () => {
      playCyberTone('click');
    });
  }

  startAuthTelemetryStream();
}

function reset3DStage(e) {
  if (e) e.stopPropagation();
  playCyberTone('click');
  currentRotX = 0;
  currentRotY = 0;
  targetRotX = 0;
  targetRotY = 0;
  focus3DWindow('center');
  const stage = document.getElementById('auth3DStage');
  if (stage) {
    stage.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }
  showToast('3D Perspective Recalibrated // Center Lock');
}

function toggle3DPerspective(e) {
  if (e) e.stopPropagation();
  playCyberTone('click');
  is3DEnabled = !is3DEnabled;
  const btn = document.getElementById('btn3DToggle');
  const stage = document.getElementById('auth3DStage');

  if (is3DEnabled) {
    if (btn) btn.textContent = '3D ON';
    showToast('3D Spatial Perspective: ACTIVE');
  } else {
    if (btn) btn.textContent = '3D OFF';
    currentRotX = 0;
    currentRotY = 0;
    targetRotX = 0;
    targetRotY = 0;
    if (stage) {
      stage.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    showToast('3D Spatial Perspective: LOCKED FLAT');
  }
}

function focus3DWindow(which) {
  activeWindow = which;
  playCyberTone('click');

  const winLeft = document.getElementById('windowQkd');
  const winCenter = document.getElementById('windowCenter');
  const winRight = document.getElementById('windowNodes');

  const dockLeft = document.getElementById('dockBtnLeft');
  const dockCenter = document.getElementById('dockBtnCenter');
  const dockRight = document.getElementById('dockBtnRight');

  // Reset focus classes
  [winLeft, winCenter, winRight].forEach(win => {
    if (win) {
      win.classList.remove('focused', 'dock-active');
    }
  });
  if (winCenter) winCenter.classList.remove('dock-hidden');

  // Reset dock button states
  [dockLeft, dockCenter, dockRight].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  if (which === 'left') {
    if (winLeft) {
      winLeft.classList.add('focused', 'dock-active');
    }
    if (winCenter) winCenter.classList.add('dock-hidden');
    if (dockLeft) dockLeft.classList.add('active');
  } else if (which === 'right') {
    if (winRight) {
      winRight.classList.add('focused', 'dock-active');
    }
    if (winCenter) winCenter.classList.add('dock-hidden');
    if (dockRight) dockRight.classList.add('active');
  } else {
    if (winCenter) winCenter.classList.add('focused');
    if (dockCenter) dockCenter.classList.add('active');
  }
}

function toggle3DWindow(e, which) {
  if (e) e.stopPropagation();
  playCyberTone('click');
  focus3DWindow('center');
}

function expand3DWindow(e, which) {
  if (e) e.stopPropagation();
  focus3DWindow(which);
}

// Live Stream Simulator for QKD & Optical Nodes
function startAuthTelemetryStream() {
  const telCoherence = document.getElementById('telCoherence');
  const telCoherenceBar = document.getElementById('telCoherenceBar');
  const telEntropy = document.getElementById('telEntropy');
  const qkdStreamContent = document.getElementById('qkdStreamContent');

  const hexSnippets = [
    '0x8F2B9C 0xE4A108 0x7D3C55 0x1B90FE',
    '0x3A7F11 0xBC44D2 0x90EA81 0x55F109',
    '0xD912F8 0x6E44A0 0x11B38C 0xF47E20',
    '0x41CA89 0x9B12E3 0x68FD11 0x22C74B',
    '0x0E8FA1 0x73C855 0x911BD4 0x882A0F'
  ];

  const quantumStates = [
    'BB84 PROTOCOL | SYNC STATE: PHASE-ALIGNED',
    'E91 ENTANGLED PROTOCOL | CHSH VIOLATION: S = 2.82',
    'DECOHERENCE SHIELD: ACTIVE // ZERO INTERCEPTION',
    'SPDC PHOTON PAIR RATE: OPTIMAL (4.28 Mpps)',
    'QUANTUM BIT ERROR RATE (QBER): 0.038% [SAFE <5%]'
  ];

  if (telemetryInterval) clearInterval(telemetryInterval);

  telemetryInterval = setInterval(() => {
    // Coherence fluctuation 99.82% - 99.96%
    const coh = (99.82 + Math.random() * 0.14).toFixed(2);
    if (telCoherence) telCoherence.textContent = `${coh}%`;
    if (telCoherenceBar) telCoherenceBar.style.width = `${coh}%`;

    // Entropy fluctuation 4.2 - 4.4 Mpps
    const ent = (4.2 + Math.random() * 0.2).toFixed(2);
    if (telEntropy) telEntropy.textContent = `${ent} Mpps`;

    // Stream lines
    if (qkdStreamContent) {
      const randHex1 = hexSnippets[Math.floor(Math.random() * hexSnippets.length)];
      const randHex2 = hexSnippets[Math.floor(Math.random() * hexSnippets.length)];
      const randState = quantumStates[Math.floor(Math.random() * quantumStates.length)];
      const binarySample = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256).toString(2).padStart(8, '0')
      ).join(' ');

      qkdStreamContent.textContent = `${binarySample}\n${randHex1}\n${randState}\nESTIMATED QBER: 0.0${Math.floor(25 + Math.random() * 25)}% [THRESHOLD: <5%]`;
    }
  }, 1600);
}

function switchAuthMode(mode) {
  authMode = mode;
  playCyberTone('click');
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const authBtnText = document.getElementById('authBtnText');
  const signupFields = document.getElementById('signupFields');
  const userIdLabel = document.getElementById('userIdLabel');

  if (mode === 'login') {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    authBtnText.textContent = 'INITIALIZE SECURE SESSION';
    signupFields.style.display = 'none';
    userIdLabel.textContent = 'Operator Call-Sign / ID';
  } else {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    authBtnText.textContent = 'GENERATE QUANTUM CLEARANCE';
    signupFields.style.display = 'block';
    userIdLabel.textContent = 'New Operator Call-Sign';
  }
}

// Biometric Click Handler
const biometricBtn = document.getElementById('biometricBtn');
const biometricScannerRing = document.getElementById('biometricScannerRing');
const scannerStatusText = document.getElementById('scannerStatusText');

if (biometricBtn) {
  biometricBtn.addEventListener('click', () => {
    if (isScanning) return;
    isScanning = true;
    playCyberTone('encrypt');

    biometricScannerRing.classList.add('scanning');
    scannerStatusText.textContent = 'Verifying Biometric Fingerprint...';
    scannerStatusText.style.color = 'var(--primary)';

    setTimeout(() => {
      scannerStatusText.textContent = 'Retina & Neural Pattern: VALID';
      biometricScannerRing.style.borderColor = 'var(--primary)';
      playCyberTone('auth-success');

      setTimeout(() => {
        completeAuthentication();
      }, 700);
    }, 1400);
  });
}

function handleAuthSubmit(e) {
  e.preventDefault();
  playCyberTone('encrypt');
  const authBtnText = document.getElementById('authBtnText');
  authBtnText.textContent = 'AUTHENTICATING QUANTUM SEED...';

  setTimeout(() => {
    playCyberTone('auth-success');
    completeAuthentication();
  }, 900);
}

function completeAuthentication() {
  const authPortal = document.getElementById('authPortal');
  if (authPortal) {
    authPortal.classList.add('hidden');
  }
  showToast('ACCESS GRANTED // CIPHERBEAM SYSTEM ONLINE');
  startWaveformAnimation();
  if (telemetryInterval) clearInterval(telemetryInterval);
}

function lockTerminal() {
  playCyberTone('click');
  const authPortal = document.getElementById('authPortal');
  if (authPortal) {
    authPortal.classList.remove('hidden');
    isScanning = false;
    if (biometricScannerRing) biometricScannerRing.classList.remove('scanning');
    if (scannerStatusText) {
      scannerStatusText.textContent = 'Tap to Scan Biometrics';
      scannerStatusText.style.color = 'var(--text-muted)';
    }
    focus3DWindow('center');
    startAuthTelemetryStream();
  }
  showToast('Terminal Locked. Biometric credentials required.');
}

// ========================================================
// 3. NAVIGATION TAB SWITCHER
// ========================================================
function switchNavTab(tabName, clickedBtn) {
  playCyberTone('click');

  // Update navigation button active state
  const navButtons = document.querySelectorAll('.nav-item-btn');
  navButtons.forEach(btn => btn.classList.remove('active'));
  if (clickedBtn) {
    clickedBtn.classList.add('active');
  }

  // Update tab views
  const tabs = document.querySelectorAll('.tab-view');
  tabs.forEach(tab => tab.classList.remove('active'));

  const activeTab = document.getElementById(`tabView-${tabName}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  if (tabName === 'transmit') {
    startWaveformAnimation();
  }
}

// ========================================================
// 4. MESSAGE TELEMETRY & ENCRYPTION CONTROLLER
// ========================================================
const messageInput = document.getElementById('messageInput');
const charCount = document.getElementById('charCount');
const packetCount = document.getElementById('packetCount');

function updateMessageTelemetry() {
  const text = messageInput ? messageInput.value : '';
  const len = text.length;
  if (charCount) charCount.textContent = len;
  // Assuming 64-byte payload per optical packet frame
  const packets = Math.max(1, Math.ceil(len / 64));
  if (packetCount) packetCount.textContent = packets;
}

function onEncryptionChange() {
  playCyberTone('click');
  const select = document.getElementById('encryptionSelector');
  const activeCipherTag = document.getElementById('activeCipherTag');
  const transmissionCipherBadge = document.getElementById('transmissionCipherBadge');

  if (select) {
    const val = select.value;
    if (activeCipherTag) activeCipherTag.textContent = `${val} AUTHENTICATED`;
    if (transmissionCipherBadge) transmissionCipherBadge.textContent = val;
    showToast(`Cryptographic Engine: ${val}`);
  }
}

// Encrypt Action Handler
function handleEncryptAction(event) {
  createButtonRipple(event);
  playCyberTone('encrypt');

  const iconEl = document.getElementById('encryptIcon');
  const textEl = document.getElementById('encryptText');

  if (iconEl) iconEl.textContent = '⚡';
  if (textEl) textEl.textContent = 'SCRAMBLING MATRIX...';

  const text = messageInput ? messageInput.value : 'CIPHERBEAM PAYLOAD';
  const panel = document.getElementById('encryptedResultPanel');
  const hexViewer = document.getElementById('hexStreamViewer');
  const shaDigest = document.getElementById('shaDigest');

  // Matrix Scramble Animation Effect
  const chars = '0123456789ABCDEF!@#$%^&*<>~|';
  let counter = 0;
  if (panel) panel.classList.add('visible');

  const interval = setInterval(() => {
    let mockHex = '';
    for (let i = 0; i < 10; i++) {
      mockHex += '0x' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * 16)]).join('') + ' ';
    }
    if (hexViewer) {
      hexViewer.textContent = mockHex + `[IV: ${Math.random().toString(36).substring(2, 10)}] [TAG: ${Math.random().toString(36).substring(2, 8)}]`;
    }
    counter++;

    if (counter > 12) {
      clearInterval(interval);
      if (iconEl) iconEl.textContent = '🔐';
      if (textEl) textEl.textContent = 'ENCRYPT';

      // Compute simulated real deterministic hex output
      let simulatedHex = '';
      for (let i = 0; i < Math.min(text.length, 32); i++) {
        simulatedHex += '0x' + text.charCodeAt(i).toString(16).padStart(2, '0') + text.charCodeAt((i + 3) % text.length).toString(16).padStart(2, '0') + ' ';
      }
      if (!simulatedHex) simulatedHex = '0x7f4e91bc 0xaa28c031 0x5109b8d2 0x93ef1802 0x8b32cf09 0x6e8812c4';

      if (hexViewer) {
        hexViewer.textContent = simulatedHex + ' [IV: 0x9e1f44a8] [TAG: 0xc831d044ea1b]';
      }
      if (shaDigest) {
        shaDigest.textContent = Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6);
      }
      showToast('Payload Encrypted with Cryptographic Integrity Tag');
    }
  }, 50);
}

// ========================================================
// 5. OPTICAL BEAM TRANSMISSION SIMULATOR & CANVAS
// ========================================================
let totalPacketsTransmitted = 1482;

function handleTransmitAction(event) {
  createButtonRipple(event);
  playCyberTone('transmit');

  const modal = document.getElementById('opticalModal');
  const progressBar = document.getElementById('transmissionProgressBar');
  const progressPct = document.getElementById('transmissionProgressPct');
  const progressLabel = document.getElementById('transmissionProgressLabel');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (modal) modal.classList.add('active');
  if (closeModalBtn) closeModalBtn.style.display = 'none';

  let progress = 0;
  progressBar.style.width = '0%';
  progressPct.textContent = '0%';
  progressLabel.textContent = 'Aligning 850nm Laser Diode with Photodetector...';

  // Start animated beam particle canvas
  startOpticalBeamCanvas();

  const transmitInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 8) + 4;
    if (progress > 100) progress = 100;

    progressBar.style.width = `${progress}%`;
    progressPct.textContent = `${progress}%`;

    if (progress > 25 && progress <= 60) {
      progressLabel.textContent = 'Streaming Encrypted Photons over Optical Waveguide...';
    } else if (progress > 60 && progress < 100) {
      progressLabel.textContent = 'ESP32 Hardware Buffer Receiving & Verifying CRC32...';
    } else if (progress >= 100) {
      clearInterval(transmitInterval);
      progressLabel.textContent = '✓ TRANSMISSION COMPLETE: Acknowledgment Received by ESP32 (0ms Jitter)';
      progressLabel.style.color = 'var(--primary)';
      if (closeModalBtn) closeModalBtn.style.display = 'inline-block';
      playCyberTone('auth-success');

      totalPacketsTransmitted += parseInt(packetCount ? packetCount.textContent : '2');
      const analyticsPacketTotal = document.getElementById('analyticsPacketTotal');
      if (analyticsPacketTotal) {
        analyticsPacketTotal.textContent = totalPacketsTransmitted.toLocaleString();
      }
      showToast('Optical Photon Stream Delivered to ESP32 Node');
    }
  }, 120);
}

function closeTransmissionModal() {
  playCyberTone('click');
  const modal = document.getElementById('opticalModal');
  if (modal) modal.classList.remove('active');
}

// Particle Beam Canvas Renderer
let beamAnimId = null;
function startOpticalBeamCanvas() {
  const canvas = document.getElementById('opticalBeamCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const particles = [];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: canvas.height / 2 + (Math.random() - 0.5) * 20,
      size: Math.random() * 3.5 + 1.5,
      speed: Math.random() * 7 + 5,
      color: Math.random() > 0.5 ? '#10b981' : '#06b6d4'
    });
  }

  function render() {
    ctx.fillStyle = 'rgba(4, 8, 16, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center laser beam line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#06b6d4';
    ctx.stroke();

    // Central primary beam
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffffff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Render photon particles
    particles.forEach(p => {
      p.x += p.speed;
      if (p.x > canvas.width) {
        p.x = 0;
        p.y = canvas.height / 2 + (Math.random() - 0.5) * 24;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    beamAnimId = requestAnimationFrame(render);
  }

  if (beamAnimId) cancelAnimationFrame(beamAnimId);
  render();
}

// Live Waveform Canvas on Transmit Tab
let waveAnimId = null;
function startWaveformAnimation() {
  const canvas = document.getElementById('liveWaveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth || 400;
  canvas.height = canvas.parentElement.clientHeight || 120;

  let offset = 0;

  function renderWave() {
    ctx.fillStyle = 'rgba(4, 8, 16, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 +
        Math.sin((x + offset) * 0.05) * 20 * Math.sin(x * 0.01) +
        Math.cos((x - offset) * 0.08) * 8;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#10b981';
    ctx.stroke();
    ctx.shadowBlur = 0;

    offset += 2;
    waveAnimId = requestAnimationFrame(renderWave);
  }

  if (waveAnimId) cancelAnimationFrame(waveAnimId);
  renderWave();
}

// ========================================================
// 6. BUTTON TACTILE RIPPLE EFFECT
// ========================================================
function createButtonRipple(e) {
  const btn = e.currentTarget;
  if (!btn) return;

  // Remove any previous ripples immediately
  const existingRipples = btn.querySelectorAll('.btn-ripple');
  existingRipples.forEach(r => r.remove());

  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height, 40);
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${(e.clientX || rect.left + rect.width / 2) - rect.left - size / 2}px`;
  ripple.style.top = `${(e.clientY || rect.top + rect.height / 2) - rect.top - size / 2}px`;
  btn.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 500);
}

// ========================================================
// 7. TOAST NOTIFICATIONS
// ========================================================
let toastTimeout = null;
function showToast(msg) {
  const toast = document.getElementById('cyberToast');
  const toastMessage = document.getElementById('toastMessage');
  if (!toast || !toastMessage) return;

  toastMessage.textContent = msg;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// ========================================================
// 8. REAL-TIME HARDWARE SIMULATION TICKER
// ========================================================
function startLiveHardwareSimulation() {
  const footerTemp = document.getElementById('footerTemp');
  const analyticsTemp = document.getElementById('analyticsTemp');
  const sbEntropy = document.getElementById('sbEntropy');

  let baseTemp = 23.0;

  setInterval(() => {
    // Slight realistic temperature oscillation (+- 0.3°C)
    const variation = (Math.random() - 0.5) * 0.4;
    const currentTemp = (baseTemp + variation).toFixed(1);

    if (footerTemp) footerTemp.textContent = `${currentTemp}°C`;
    if (analyticsTemp) analyticsTemp.textContent = `${currentTemp}°C`;

    // Entropy fluctuation
    if (sbEntropy) {
      const ent = (99.8 + (Math.random() * 0.18)).toFixed(2);
      sbEntropy.textContent = `${ent}% QUANTUM`;
    }
  }, 3000);
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  updateMessageTelemetry();
  startLiveHardwareSimulation();
  init3DParallax();
  if (window.lucide) {
    lucide.createIcons();
  }
});
