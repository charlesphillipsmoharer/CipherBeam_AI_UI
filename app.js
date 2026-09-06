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
  } else if (tabName === 'hidden') {
    setTimeout(initCarrierSpectrumCanvas, 50);
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
let laserSpoolNodes = null;
let transmitInterval = null;
let beamAnimId = null;

// Audio Synthesizer: Continuous High-Energy Laser Spool-Up
function startLaserSpoolAudio() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const subOsc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    // Primary charging laser whine: 140Hz ramped up exponentially to 1100Hz
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 2.5);

    // Deep sub-harmonic hum: 70Hz ramped to 220Hz
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(70, now);
    subOsc.frequency.linearRampToValueAtTime(220, now + 2.5);

    // Resonant lowpass filter sweeping open
    filter.type = 'lowpass';
    filter.Q.value = 3.5;
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 2.5);

    // Gain envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
    gain.gain.setValueAtTime(0.05, now + 2.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 2.9);
    subOsc.stop(now + 2.9);

    laserSpoolNodes = { osc, subOsc, gain };
  } catch (e) {
    console.warn('Audio spool exception', e);
  }
}

function stopLaserSpoolAudio() {
  if (laserSpoolNodes && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      laserSpoolNodes.gain.gain.cancelScheduledValues(now);
      laserSpoolNodes.gain.gain.setValueAtTime(laserSpoolNodes.gain.gain.value, now);
      laserSpoolNodes.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      setTimeout(() => {
        try {
          laserSpoolNodes.osc.stop();
          laserSpoolNodes.subOsc.stop();
        } catch (_) {}
        laserSpoolNodes = null;
      }, 110);
    } catch (_) {
      laserSpoolNodes = null;
    }
  }
}

// Interactive 3D Inspection: Parallax Tilt on Cursor Move
function setupChamber3DInspection() {
  const viewport = document.getElementById('chamberViewport') || document.getElementById('opticalModal');
  const chassis = document.getElementById('chamberChassis');
  if (!viewport || !chassis) return;

  viewport.onmousemove = (e) => {
    const rect = viewport.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    const rotY = (x * 24).toFixed(2);  // up to ±12 degrees
    const rotX = (-y * 18).toFixed(2); // up to ±9 degrees
    chassis.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };

  viewport.onmouseleave = () => {
    chassis.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };
}

function resetChamber3DInspection() {
  const viewport = document.getElementById('chamberViewport') || document.getElementById('opticalModal');
  const chassis = document.getElementById('chamberChassis');
  if (viewport) {
    viewport.onmousemove = null;
    viewport.onmouseleave = null;
  }
  if (chassis) {
    chassis.style.transform = '';
  }
}

function handleTransmitAction(event) {
  createButtonRipple(event);
  playCyberTone('transmit');
  startLaserSpoolAudio();

  const modal = document.getElementById('opticalModal');
  const progressBar = document.getElementById('transmissionProgressBar');
  const progressPct = document.getElementById('transmissionProgressPct');
  const progressLabel = document.getElementById('transmissionProgressLabel');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const hexStream = document.getElementById('modalHexStream');
  const flare = document.getElementById('targetCollisionFlare');
  const cells = document.querySelectorAll('#chargeCellsGrid .cell');

  if (modal) modal.classList.add('active');
  if (closeModalBtn) closeModalBtn.style.display = 'none';
  if (flare) flare.classList.remove('active');

  // Reset charge cells
  cells.forEach(c => c.classList.remove('lit'));

  // Enable 3D Parallax Inspection
  setupChamber3DInspection();

  let progress = 0;
  if (progressBar) progressBar.style.width = '0%';
  if (progressPct) progressPct.textContent = '0%';
  if (progressLabel) {
    progressLabel.textContent = 'Engaging 850nm Photonic Laser Diode & Magnetic Guide...';
    progressLabel.style.color = '';
  }

  // Start Particle Accelerator Beam Canvas
  startOpticalBeamCanvas();

  if (transmitInterval) clearInterval(transmitInterval);

  transmitInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 8) + 4;
    if (progress > 100) progress = 100;

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressPct) progressPct.textContent = `${progress}%`;

    // 20-Segment LED Power Bar progression
    const litCount = Math.floor((progress / 100) * cells.length);
    cells.forEach((cell, idx) => {
      if (idx < litCount) {
        cell.classList.add('lit');
      } else {
        cell.classList.remove('lit');
      }
    });

    // Scramble Hex stream packet readout
    if (hexStream) {
      if (progress < 100) {
        const h1 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
        const h2 = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        const frameNum = String(Math.floor(progress / 5) + 1).padStart(2, '0');
        hexStream.textContent = `0x${h1} :: FRAME_${frameNum} [0x${h2}]`;
      } else {
        hexStream.textContent = '0x00FF88A1 :: ACK-RECEIVED [CRC32-OK // 0-JITTER]';
      }
    }

    // Activate receiver collision flare once beam stream reaches target
    if (flare && progress >= 28) {
      flare.classList.add('active');
    }

    if (progress > 20 && progress <= 55) {
      if (progressLabel) progressLabel.textContent = 'Streaming Encrypted Photons through 3D Waveguide Coils...';
    } else if (progress > 55 && progress < 100) {
      if (progressLabel) progressLabel.textContent = 'ESP32 Hardware Buffer Ingestion & CRC32 Verification...';
    } else if (progress >= 100) {
      clearInterval(transmitInterval);
      transmitInterval = null;

      if (progressLabel) {
        progressLabel.textContent = '✓ TRANSMISSION COMPLETE: Acknowledgment Received by ESP32 (0ms Jitter)';
        progressLabel.style.color = 'var(--primary)';
      }
      if (closeModalBtn) closeModalBtn.style.display = 'inline-flex';
      playCyberTone('auth-success');

      totalPacketsTransmitted += parseInt(typeof packetCount !== 'undefined' && packetCount ? packetCount.textContent : '2');
      const analyticsPacketTotal = document.getElementById('analyticsPacketTotal');
      if (analyticsPacketTotal) {
        analyticsPacketTotal.textContent = totalPacketsTransmitted.toLocaleString();
      }
      showToast('Optical Photon Stream Delivered to ESP32 Node');
    }
  }, 110);
}

function closeTransmissionModal() {
  playCyberTone('click');
  stopLaserSpoolAudio();

  if (transmitInterval) {
    clearInterval(transmitInterval);
    transmitInterval = null;
  }

  const modal = document.getElementById('opticalModal');
  if (modal) modal.classList.remove('active');

  if (beamAnimId) {
    cancelAnimationFrame(beamAnimId);
    beamAnimId = null;
  }

  const flare = document.getElementById('targetCollisionFlare');
  if (flare) flare.classList.remove('active');

  const cells = document.querySelectorAll('#chargeCellsGrid .cell');
  cells.forEach(c => c.classList.remove('lit'));

  resetChamber3DInspection();
}

// Particle Beam Canvas Renderer with Coherent Laser Core & Collision Sparks
function startOpticalBeamCanvas() {
  const canvas = document.getElementById('opticalBeamCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth || 600;
  canvas.height = canvas.parentElement.clientHeight || 70;

  const particles = [];
  const particleCount = 55;
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: canvas.height / 2 + (Math.random() - 0.5) * 16,
      size: Math.random() * 2.5 + 1.2,
      length: Math.random() * 24 + 10,
      speed: Math.random() * 9 + 8,
      hue: Math.random() > 0.4 ? '#06b6d4' : (Math.random() > 0.5 ? '#10b981' : '#a855f7')
    });
  }

  // Spark burst particles upon collision at the photodiode receiver
  const sparks = [];
  function emitSparks(rxX, rxY) {
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 0.5) + (Math.random() - 0.5) * Math.PI;
      sparks.push({
        x: rxX,
        y: rxY,
        vx: Math.cos(angle) * (Math.random() * 5 + 2),
        vy: Math.sin(angle) * (Math.random() * 5 - 2.5),
        life: 1.0,
        decay: Math.random() * 0.08 + 0.04,
        size: Math.random() * 2.5 + 1,
        color: Math.random() > 0.5 ? '#06b6d4' : '#10b981'
      });
    }
  }

  let frameTick = 0;

  function render() {
    frameTick++;
    const w = canvas.width;
    const h = canvas.height;
    const centerY = h / 2;

    // Semi-transparent fade for motion trails
    ctx.fillStyle = 'rgba(3, 8, 18, 0.28)';
    ctx.fillRect(0, 0, w, h);

    // 1. Broad Outer Laser Glow
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.lineWidth = 16;
    ctx.stroke();

    // 2. Energetic Focused Mid-Core
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
    ctx.lineWidth = 4.5;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#10b981';
    ctx.stroke();

    // 3. Hot White Center Filament
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffffff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4. Oscillating High-Frequency Plasma Lightning Arcs
    const t = frameTick * 0.12;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 15) {
      const arcY = centerY + Math.sin(x * 0.035 + t * 3) * 6 * Math.sin(x * 0.015);
      if (x === 0) ctx.moveTo(x, arcY);
      else ctx.lineTo(x, arcY);
    }
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x <= w; x += 15) {
      const arcY2 = centerY + Math.cos(x * 0.045 - t * 2.5) * 5.5 * Math.cos(x * 0.02);
      if (x === 0) ctx.moveTo(x, arcY2);
      else ctx.lineTo(x, arcY2);
    }
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // 5. Streaming Photon Streaks
    particles.forEach(p => {
      p.x += p.speed;
      if (p.x > w - 10) {
        emitSparks(w - 10, centerY);
        p.x = 0;
        p.y = centerY + (Math.random() - 0.5) * 16;
      }

      ctx.beginPath();
      ctx.moveTo(Math.max(0, p.x - p.length), p.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = p.hue;
      ctx.lineWidth = p.size;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.hue;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Particle bright head
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    // 6. Impact sparks on the right receiver
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;

      if (s.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.life;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

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

// ========================================================
// 9. ANIMATED MATRIX DIGITAL RAIN SCREEN BACKGROUND
// ========================================================
let matrixEnabled = true;
let matrixCanvas = null;
let matrixCtx = null;
let matrixColumns = [];
let matrixRafId = null;
const matrixChars = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789ABCDEFλΩΨΦΔΣπ01010101';

function initMatrixRain() {
  matrixCanvas = document.getElementById('matrixCanvas');
  if (!matrixCanvas) return;
  matrixCtx = matrixCanvas.getContext('2d');

  function resizeMatrix() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    const fontSize = 14;
    const cols = Math.floor(matrixCanvas.width / fontSize);
    matrixColumns = [];
    for (let i = 0; i < cols; i++) {
      matrixColumns[i] = Math.floor(Math.random() * -100);
    }
  }

  window.addEventListener('resize', resizeMatrix);
  resizeMatrix();

  const fontSize = 14;
  let lastTime = 0;
  const fpsInterval = 1000 / 35; // 35 FPS for authentic terminal matrix rain

  function renderMatrix(timestamp) {
    if (!matrixEnabled) {
      matrixRafId = requestAnimationFrame(renderMatrix);
      return;
    }

    const elapsed = timestamp - lastTime;
    if (elapsed > fpsInterval) {
      lastTime = timestamp - (elapsed % fpsInterval);

      // Translucent fill to create the glowing falling trail
      matrixCtx.fillStyle = 'rgba(7, 11, 20, 0.08)';
      matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

      matrixCtx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < matrixColumns.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = i * fontSize;
        const y = matrixColumns[i] * fontSize;

        // Bright white glowing leader character
        matrixCtx.fillStyle = '#ffffff';
        matrixCtx.shadowColor = '#10b981';
        matrixCtx.shadowBlur = 8;
        matrixCtx.fillText(char, x, y);

        // Reset shadow for following characters
        matrixCtx.shadowBlur = 0;

        // Decaying characters: emerald green with cyan accents
        const isCyan = Math.random() > 0.85;
        matrixCtx.fillStyle = isCyan ? '#06b6d4' : '#10b981';
        const prevChar = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        matrixCtx.fillText(prevChar, x, y - fontSize);

        // Reset to top with randomized delay when past bottom
        if (y > matrixCanvas.height && Math.random() > 0.975) {
          matrixColumns[i] = 0;
        } else {
          matrixColumns[i]++;
        }
      }
    }

    matrixRafId = requestAnimationFrame(renderMatrix);
  }

  if (matrixRafId) cancelAnimationFrame(matrixRafId);
  matrixRafId = requestAnimationFrame(renderMatrix);
}

function toggleMatrixRain() {
  matrixEnabled = !matrixEnabled;
  playCyberTone('click');
  const btn = document.getElementById('matrixToggleBtn');
  const label = document.getElementById('matrixLabel');
  const canvas = document.getElementById('matrixCanvas');

  if (matrixEnabled) {
    if (label) label.textContent = 'MATRIX ON';
    if (canvas) canvas.classList.remove('paused');
    if (btn) btn.classList.remove('active');
    showToast('Matrix Digital Rain: ENABLED');
  } else {
    if (label) label.textContent = 'MATRIX OFF';
    if (canvas) {
      canvas.classList.add('paused');
      if (matrixCtx) matrixCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (btn) btn.classList.add('active');
    showToast('Matrix Digital Rain: MUTED');
  }
}

// ========================================================
// 10. COLLAPSIBLE DASHBOARD NAVIGATION & HIDDEN DASHBOARD BUTTON
// ========================================================
let isSidebarCollapsed = false;

function toggleDashboardSidebar() {
  playCyberTone('click');
  isSidebarCollapsed = !isSidebarCollapsed;

  const workspaceGrid = document.getElementById('workspaceGrid');
  const sidebarPanel = document.getElementById('sidebarPanel');
  const floatingBtn = document.getElementById('floatingDashboardBtn');
  const toggleBtn = document.getElementById('toggleDashboardBtn');
  const toggleLabel = document.getElementById('sidebarToggleLabel');
  const toggleIcon = document.getElementById('sidebarToggleIcon');

  if (isSidebarCollapsed) {
    if (workspaceGrid) workspaceGrid.classList.add('sidebar-collapsed');
    if (sidebarPanel) sidebarPanel.classList.add('collapsed');
    if (floatingBtn) floatingBtn.classList.add('visible');
    if (toggleBtn) toggleBtn.classList.add('collapsed');
    if (toggleLabel) toggleLabel.textContent = 'SHOW DASHBOARD';
    if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'panel-left-open');
    showToast('Dashboard Navigation: HIDDEN // Workspace Expanded');
  } else {
    if (workspaceGrid) workspaceGrid.classList.remove('sidebar-collapsed');
    if (sidebarPanel) sidebarPanel.classList.remove('collapsed');
    if (floatingBtn) floatingBtn.classList.remove('visible');
    if (toggleBtn) toggleBtn.classList.remove('collapsed');
    if (toggleLabel) toggleLabel.textContent = 'HIDE DASHBOARD';
    if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'panel-left-close');
    showToast('Dashboard Navigation: RESTORED');
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

// ========================================================
// 11. CLASSIFIED HIDDEN MATRIX DASHBOARD CONTROLLERS
// ========================================================
let spectrumRafId = null;

function initCarrierSpectrumCanvas() {
  const canvas = document.getElementById('carrierSpectrumCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 130;

  let offset = 0;

  function renderSpectrum() {
    ctx.fillStyle = 'rgba(2, 5, 10, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const midY = canvas.height / 2;

    // Center baseline
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(canvas.width, midY);
    ctx.stroke();

    // Secondary sideband waves
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = midY + Math.sin((x + offset * 1.5) * 0.04) * 15 * Math.sin(x * 0.015);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Primary optical carrier wave (DWDM 1550nm)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const centerDist = Math.abs(x - canvas.width / 2) / (canvas.width / 2);
      const envelope = Math.exp(-centerDist * centerDist * 6);
      const carrier = Math.sin((x - offset * 3) * 0.08) * (28 * envelope + 4);
      const noise = (Math.random() - 0.5) * 3;
      const y = midY - carrier + noise;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    offset += 1.2;
    spectrumRafId = requestAnimationFrame(renderSpectrum);
  }

  if (spectrumRafId) cancelAnimationFrame(spectrumRafId);
  spectrumRafId = requestAnimationFrame(renderSpectrum);
}

function handleMatrixCommand(e) {
  e.preventDefault();
  const input = document.getElementById('matrixCommandInput');
  if (!input) return;
  const cmd = input.value.trim().toLowerCase();
  input.value = '';
  if (!cmd) return;

  playCyberTone('click');
  appendMatrixLog(`matrix@cipherbeam:~$ ${cmd}`, 'term-cyan');

  setTimeout(() => {
    executeMatrixCommand(cmd);
  }, 120);
}

function executeMatrixCommand(cmd) {
  switch (cmd) {
    case 'help':
      appendMatrixLog('Available Classified Matrix Commands:', 'term-system');
      appendMatrixLog('  • status    - Display quantum cryptographic link state', 'term-line');
      appendMatrixLog('  • decrypt   - Force quantum decryption cycle on live packets', 'term-line');
      appendMatrixLog('  • scan      - Run laser optical spectrum sweep', 'term-line');
      appendMatrixLog('  • stealth   - Toggle quantum non-demolition monitor tap', 'term-line');
      appendMatrixLog('  • pulse     - Inject high-power optical photonic sync pulse', 'term-line');
      appendMatrixLog('  • clear     - Clear terminal log screen', 'term-line');
      break;

    case 'status':
      appendMatrixLog('[STATUS] Optical Link: 1550.12nm DWDM // FSO Station Locked', 'term-success');
      appendMatrixLog('[STATUS] QBER: 0.038% // Bell State Fidelity: 99.98%', 'term-success');
      appendMatrixLog('[STATUS] Matrix Stream: 60 FPS Digital Code Rain Active', 'term-cyan');
      playCyberTone('auth-success');
      break;

    case 'decrypt':
      appendMatrixLog('[DECRYPTING] Modulating photon polarization matrix...', 'term-amber');
      playCyberTone('encrypt');
      setTimeout(() => {
        appendMatrixLog('[SUCCESS] Payload deciphered: 0x7F4E91BC :: "CONFIDENTIAL_OPERATOR_ACCESS_GRANTED"', 'term-success');
        playCyberTone('auth-success');
      }, 500);
      break;

    case 'scan':
      appendMatrixLog('[SCAN] Optical spectrum sweep initiated across 800nm - 1650nm...', 'term-cyan');
      initCarrierSpectrumCanvas();
      playCyberTone('transmit');
      setTimeout(() => {
        appendMatrixLog('[SCAN] Primary carrier detected at 1550.12nm (Peak SNR: 45.1 dB)', 'term-success');
      }, 600);
      break;

    case 'stealth':
      appendMatrixLog('[STEALTH] Quantum non-demolition filter reconfigured. Tap undetectable.', 'term-amber');
      playCyberTone('click');
      break;

    case 'pulse':
      triggerMatrixPulse();
      break;

    case 'clear':
      clearMatrixTerminal();
      break;

    default:
      appendMatrixLog(`[ERROR] Command not recognized: '${cmd}'. Type 'help' for command list.`, 'term-red');
      break;
  }
}

function appendMatrixLog(text, className = '') {
  const log = document.getElementById('matrixTerminalLog');
  if (!log) return;
  const line = document.createElement('div');
  line.className = `term-line ${className}`;
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function triggerMatrixPulse() {
  playCyberTone('transmit');
  appendMatrixLog('[PULSE] High-intensity 850nm/1550nm dual-frequency pulse emitted!', 'term-cyan');
  showToast('Optical Photonic Sync Pulse Injected');
  const canvas = document.getElementById('matrixCanvas');
  if (canvas) {
    canvas.style.opacity = '1';
    setTimeout(() => {
      canvas.style.opacity = '0.72';
    }, 400);
  }
}

function reseedQuantumEntropy() {
  playCyberTone('encrypt');
  const randHex = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  appendMatrixLog(`[RE-SEED] Generated new 256-bit SPDC quantum seed: ${randHex}`, 'term-success');
  showToast('QKD Entropy Stream Re-Seeded');
}

function clearMatrixTerminal() {
  const log = document.getElementById('matrixTerminalLog');
  if (log) {
    log.innerHTML = `
      <div class="term-line term-system">[SYSTEM] CipherBeam AI Deep Intelligence Core Initialized.</div>
      <div class="term-line term-success">[CONSOLE CLEARED] Ready for operator commands.</div>
    `;
  }
  playCyberTone('click');
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  updateMessageTelemetry();
  startLiveHardwareSimulation();
  init3DParallax();
  initMatrixRain();
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Global keyboard shortcuts & modal backdrop dismiss
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('opticalModal');
    if (modal && modal.classList.contains('active')) {
      closeTransmissionModal();
    }
  }
});

window.addEventListener('click', (e) => {
  const modal = document.getElementById('opticalModal');
  if (modal && e.target === modal && modal.classList.contains('active')) {
    closeTransmissionModal();
  }
});
