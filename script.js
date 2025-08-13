// Global state
let reminders = [];
let audioContext = null;
let selectedShader = 1;
let currentReminderIndex = 0;
let carouselInterval = null;
let canvas = null;
let gl = null;
let shaderProgram = null;
let animationId = null;
let mousePosition = { x: 0.5, y: 0.5 };

// Shader sources
const shaders = {
  1: {
    name: "Plasma",
    vertex: `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `,
    fragment: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform bool u_hasActiveReminders;
      uniform bool u_hasUpcomingReminders;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        
        // Base colors
        vec3 activeColor = vec3(0.2, 0.4, 0.9);
        vec3 upcomingColor = vec3(0.2, 0.8, 0.4);
        vec3 neutralColor = vec3(0.5, 0.3, 0.8);
        
        vec3 baseColor = neutralColor;
        if (u_hasActiveReminders) {
          baseColor = activeColor;
        } else if (u_hasUpcomingReminders) {
          baseColor = upcomingColor;
        }
        
        // Create plasma effect
        float x = uv.x * 8.0 + u_time * 0.5;
        float y = uv.y * 8.0 + u_time * 0.7;
        float plasma = sin(x) + sin(y) + sin((x + y) * 0.5) + sin(sqrt(x*x + y*y) * 2.0);
        
        // Add mouse interaction
        vec2 mouseUV = u_mouse;
        float mouseDist = distance(uv, mouseUV);
        float mouseEffect = exp(-mouseDist * 8.0) * 0.5;
        
        // Combine effects
        vec3 color = baseColor + plasma * 0.2 + mouseEffect;
        
        // Fade edges to create circle
        float edge = smoothstep(0.5, 0.45, dist);
        color *= edge;
        
        gl_FragColor = vec4(color, edge);
      }
    `
  },
  2: {
    name: "Ether",
    vertex: `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `,
    fragment: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform bool u_hasActiveReminders;
      uniform bool u_hasUpcomingReminders;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        
        vec3 activeColor = vec3(0.9, 0.2, 0.4);
        vec3 upcomingColor = vec3(0.2, 0.8, 0.4);
        vec3 neutralColor = vec3(0.8, 0.4, 0.9);
        
        vec3 baseColor = neutralColor;
        if (u_hasActiveReminders) {
          baseColor = activeColor;
        } else if (u_hasUpcomingReminders) {
          baseColor = upcomingColor;
        }
        
        // Ether effect
        float ether = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          vec2 offset = vec2(sin(u_time * (0.5 + fi * 0.2)), cos(u_time * (0.7 + fi * 0.3))) * 0.1;
          float wave = sin(dist * 20.0 - u_time * 2.0 + fi * 2.0) * 0.5 + 0.5;
          ether += wave / (3.0 + fi);
        }
        
        vec2 mouseUV = u_mouse;
        float mouseDist = distance(uv, mouseUV);
        float mouseRipple = sin(mouseDist * 30.0 - u_time * 5.0) * exp(-mouseDist * 5.0) * 0.3;
        
        vec3 color = baseColor * (0.5 + ether * 0.5 + mouseRipple);
        
        float edge = smoothstep(0.5, 0.45, dist);
        color *= edge;
        
        gl_FragColor = vec4(color, edge);
      }
    `
  },
  3: {
    name: "Nebula",
    vertex: `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `,
    fragment: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform bool u_hasActiveReminders;
      uniform bool u_hasUpcomingReminders;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        
        vec3 activeColor = vec3(0.2, 0.4, 0.9);
        vec3 upcomingColor = vec3(0.2, 0.8, 0.4);
        vec3 neutralColor = vec3(0.3, 0.7, 0.9);
        
        vec3 baseColor = neutralColor;
        if (u_hasActiveReminders) {
          baseColor = activeColor;
        } else if (u_hasUpcomingReminders) {
          baseColor = upcomingColor;
        }
        
        // Nebula effect
        vec2 pos = uv * 4.0;
        float nebula = 0.0;
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          pos += vec2(sin(u_time * 0.1 + fi), cos(u_time * 0.13 + fi * 1.5)) * 0.5;
          nebula += sin(length(pos) - u_time * 0.5) / length(pos);
        }
        
        vec2 mouseUV = u_mouse;
        float mouseEffect = 1.0 + sin(distance(uv, mouseUV) * 10.0 - u_time * 3.0) * 0.1;
        
        vec3 color = baseColor * (0.3 + abs(nebula) * 0.7) * mouseEffect;
        
        float edge = smoothstep(0.5, 0.45, dist);
        color *= edge;
        
        gl_FragColor = vec4(color, edge);
      }
    `
  },
  4: {
    name: "Wavy Lines",
    vertex: `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `,
    fragment: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform bool u_hasActiveReminders;
      uniform bool u_hasUpcomingReminders;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        
        vec3 activeColor = vec3(0.2, 0.8, 0.4);
        vec3 upcomingColor = vec3(0.2, 0.8, 0.4);
        vec3 neutralColor = vec3(0.3, 0.8, 0.7);
        
        vec3 baseColor = neutralColor;
        if (u_hasActiveReminders) {
          baseColor = activeColor;
        } else if (u_hasUpcomingReminders) {
          baseColor = upcomingColor;
        }
        
        // Wavy lines effect
        float waves = 0.0;
        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float angle = atan(uv.y - 0.5, uv.x - 0.5);
          float radius = distance(uv, center);
          waves += sin(radius * 15.0 + angle * 3.0 + u_time * (1.0 + fi * 0.5)) * (1.0 / (fi + 1.0));
        }
        
        vec2 mouseUV = u_mouse;
        float mouseDist = distance(uv, mouseUV);
        float mouseWave = sin(mouseDist * 20.0 - u_time * 4.0) * exp(-mouseDist * 3.0) * 0.5;
        
        vec3 color = baseColor * (0.5 + waves * 0.3 + mouseWave);
        
        float edge = smoothstep(0.5, 0.45, dist);
        color *= edge;
        
        gl_FragColor = vec4(color, edge);
      }
    `
  }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Load saved shader preference
  const savedShader = localStorage.getItem('selectedShader');
  if (savedShader) {
    selectedShader = parseInt(savedShader, 10);
  }
  
  // Load saved reminders
  loadReminders();
  
  // Initialize canvas and WebGL
  initializeShaders();
  
  // Set up event listeners
  setupEventListeners();
  
  // Start checking for due reminders
  setInterval(checkDueReminders, 1000);
  
  // Update UI
  updateShaderSelector();
  updateCenterDisplay();
  updateClearButton();
  
  // Initialize audio context on first user interaction
  document.addEventListener('click', initializeAudio, { once: true });
  document.addEventListener('touchstart', initializeAudio, { once: true });
}

function initializeAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function initializeShaders() {
  canvas = document.getElementById('shader-canvas');
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.error('WebGL not supported');
    return;
  }
  
  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Set up mouse tracking
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePosition.x = (e.clientX - rect.left) / rect.width;
    mousePosition.y = 1.0 - (e.clientY - rect.top) / rect.height;
  });
  
  // Create shader program
  createShaderProgram();
  
  // Start animation loop
  animate();
}

function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.7;
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  
  if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}

function createShaderProgram() {
  const shader = shaders[selectedShader];
  
  const vertexShader = createShader(gl.VERTEX_SHADER, shader.vertex);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, shader.fragment);
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Shader program failed to link:', gl.getProgramInfoLog(shaderProgram));
    return;
  }
  
  // Set up vertex buffer
  const vertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ]);
  
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
  const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
}

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

function animate() {
  if (!gl || !shaderProgram) return;
  
  gl.useProgram(shaderProgram);
  
  // Set uniforms
  const timeLocation = gl.getUniformLocation(shaderProgram, 'u_time');
  const resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
  const mouseLocation = gl.getUniformLocation(shaderProgram, 'u_mouse');
  const activeRemindersLocation = gl.getUniformLocation(shaderProgram, 'u_hasActiveReminders');
  const upcomingRemindersLocation = gl.getUniformLocation(shaderProgram, 'u_hasUpcomingReminders');
  
  gl.uniform1f(timeLocation, Date.now() / 1000);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform2f(mouseLocation, mousePosition.x, mousePosition.y);
  gl.uniform1i(activeRemindersLocation, hasActiveReminders());
  gl.uniform1i(upcomingRemindersLocation, hasUpcomingReminders());
  
  // Clear and draw
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
  animationId = requestAnimationFrame(animate);
}

function setupEventListeners() {
  // Shader selector buttons
  document.querySelectorAll('.shader-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const shaderId = parseInt(btn.dataset.shader);
      selectShader(shaderId);
    });
  });
  
  // Canvas click to open modal
  canvas.addEventListener('click', () => {
    openModal();
  });
  
  // Modal controls
  const modalOverlay = document.getElementById('modal-overlay');
  const reminderForm = document.getElementById('reminder-form');
  const reminderTimeInput = document.getElementById('reminder-time');
  
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
  
  reminderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit();
  });
  
  reminderTimeInput.addEventListener('focus', () => {
    if (!reminderTimeInput.value) {
      generateDefaultTime();
    }
  });
  
  // Clear reminders button
  document.getElementById('clear-reminders-btn').addEventListener('click', () => {
    clearAllReminders();
  });
  
  // Mark done button
  document.getElementById('mark-done-btn').addEventListener('click', () => {
    const activeReminder = getActiveReminders()[currentReminderIndex];
    if (activeReminder) {
      markReminderComplete(activeReminder.id);
    }
  });
}

function selectShader(shaderId) {
  selectedShader = shaderId;
  localStorage.setItem('selectedShader', shaderId.toString());
  updateShaderSelector();
  createShaderProgram();
}

function updateShaderSelector() {
  document.querySelectorAll('.shader-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.shader) === selectedShader);
  });
}

function openModal() {
  const modal = document.getElementById('modal-overlay');
  modal.classList.add('visible');
  
  // Focus the message input
  setTimeout(() => {
    document.getElementById('reminder-message').focus();
  }, 300);
}

function closeModal() {
  const modal = document.getElementById('modal-overlay');
  modal.classList.remove('visible');
  
  // Reset form
  document.getElementById('reminder-form').reset();
}

function generateDefaultTime() {
  const now = new Date();
  const minutes = Math.ceil(now.getMinutes() / 15) * 15;
  now.setMinutes(minutes);
  now.setSeconds(0);
  
  const hoursStr = now.getHours().toString().padStart(2, '0');
  const minutesStr = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('reminder-time').value = `${hoursStr}:${minutesStr}`;
}

function handleFormSubmit() {
  const message = document.getElementById('reminder-message').value;
  const timeStr = document.getElementById('reminder-time').value;
  
  if (!message || !timeStr) return;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);
  
  // If the time is in the past, assume it's for tomorrow
  if (reminderTime < new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  addReminder(message, reminderTime);
  closeModal();
}

function addReminder(message, time) {
  const newReminder = {
    id: Date.now().toString(),
    message,
    time,
    completed: false
  };
  
  reminders.push(newReminder);
  saveReminders();
  updateCenterDisplay();
  updateClearButton();
  
  // Play confirmation sound
  playConfirmationSound();
  
  // Show success toast
  showToast('success', 'Reminder set', time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
}

function markReminderComplete(id, toastId) {
  const reminder = reminders.find(r => r.id === id);
  if (!reminder) return;
  
  reminder.completed = true;
  saveReminders();
  updateCenterDisplay();
  updateClearButton();
  
  // Play completion sound
  playCompletionSound();
  
  // Dismiss notification toast if provided
  if (toastId) {
    dismissToast(toastId);
  }
  
  // Show completion toast
  showToast('success', 'Reminder completed', reminder.message);
}

function clearAllReminders() {
  const activeReminders = reminders.filter(r => !r.completed);
  if (activeReminders.length === 0) return;
  
  reminders = reminders.filter(r => r.completed);
  saveReminders();
  updateCenterDisplay();
  updateClearButton();
  
  showToast('info', `Cleared ${activeReminders.length} reminder${activeReminders.length !== 1 ? 's' : ''}`);
}

function getActiveReminders() {
  return reminders.filter(r => !r.completed);
}

function hasActiveReminders() {
  return getActiveReminders().length > 0;
}

function hasUpcomingReminders(minutes = 5) {
  const now = new Date();
  const minutesInMs = minutes * 60 * 1000;
  
  return reminders.some(reminder => {
    if (reminder.completed) return false;
    
    const reminderTime = new Date(reminder.time);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    return timeUntilReminder > 0 && timeUntilReminder <= minutesInMs;
  });
}

function updateCenterDisplay() {
  const carousel = document.getElementById('reminder-carousel');
  const activeReminders = getActiveReminders();
  
  if (activeReminders.length === 0) {
    carousel.innerHTML = '';
    if (carouselInterval) {
      clearInterval(carouselInterval);
      carouselInterval = null;
    }
    return;
  }
  
  // Create reminder items
  carousel.innerHTML = activeReminders.map((reminder, index) => `
    <div class="reminder-item ${index === 0 ? 'active' : ''}" data-index="${index}">
      <div class="reminder-message">${truncateMessage(reminder.message)}</div>
      <div class="reminder-time">${formatTime(reminder.time)}</div>
    </div>
  `).join('');
  
  // Start carousel if multiple reminders
  if (activeReminders.length > 1) {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(rotateCarousel, 5000);
  }
}

function rotateCarousel() {
  const activeReminders = getActiveReminders();
  if (activeReminders.length <= 1) return;
  
  const items = document.querySelectorAll('.reminder-item');
  if (items.length === 0) return;
  
  items[currentReminderIndex].classList.remove('active');
  currentReminderIndex = (currentReminderIndex + 1) % activeReminders.length;
  items[currentReminderIndex].classList.add('active');
}

function updateClearButton() {
  const container = document.getElementById('clear-button-container');
  const activeReminders = getActiveReminders();
  
  if (activeReminders.length > 0) {
    container.classList.add('visible');
  } else {
    container.classList.remove('visible');
  }
}

function truncateMessage(message, maxLength = 60) {
  return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function checkDueReminders() {
  const now = new Date();
  
  reminders.forEach(reminder => {
    if (!reminder.completed && !reminder.notified && new Date(reminder.time) <= now) {
      reminder.notified = true;
      saveReminders();
      
      // Play notification sound
      playNotificationSound();
      
      // Show toast notification
      showReminderToast(reminder);
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reminder', { body: reminder.message });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Reminder', { body: reminder.message });
          }
        });
      }
    }
  });
}

function showReminderToast(reminder) {
  const toastId = `reminder-${reminder.id}`;
  const toast = createToast(toastId, 'default', 'bell');
  
  toast.innerHTML = `
    <div class="toast-icon">🔔</div>
    <div class="toast-content">
      <div class="toast-title">${reminder.message}</div>
      <div class="toast-description">${formatTime(reminder.time)}</div>
      <button class="toast-action" onclick="markReminderComplete('${reminder.id}', '${toastId}')">
        Mark as done
      </button>
    </div>
    <button class="toast-close" onclick="dismissToast('${toastId}')">&times;</button>
  `;
  
  // Don't auto-dismiss reminder toasts
}

function showToast(type, title, description, duration = 4000) {
  const toastId = `toast-${Date.now()}`;
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  
  const toast = createToast(toastId, type, icons[type]);
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${description ? `<div class="toast-description">${description}</div>` : ''}
    </div>
    <button class="toast-close" onclick="dismissToast('${toastId}')">&times;</button>
  `;
  
  if (duration > 0) {
    setTimeout(() => dismissToast(toastId), duration);
  }
}

function createToast(id, type, icon) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.id = id;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });
  
  return toast;
}

function dismissToast(id) {
  const toast = document.getElementById(id);
  if (toast) {
    toast.classList.remove('visible');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

// Audio functions
function playNotificationSound() {
  if (!audioContext) return;
  
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.value = 0.15;
  
  const createTone = (freq, type, delay, gainValue, duration) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = freq;
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now + delay);
    gainNode.gain.linearRampToValueAtTime(gainValue, now + delay + 0.1);
    gainNode.gain.setValueAtTime(gainValue, now + delay + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
    
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration);
  };
  
  const baseFreq = 587.33;
  createTone(baseFreq, 'sine', 0, 0.3, 1.8);
  createTone(baseFreq * 1.5, 'sine', 0.02, 0.15, 1.5);
  createTone(baseFreq * 2, 'sine', 0.03, 0.07, 1.3);
  createTone(baseFreq * 3, 'sine', 0.1, 0.03, 1.1);
  createTone(baseFreq * 0.5, 'triangle', 0.01, 0.03, 1.6);
}

function playConfirmationSound() {
  if (!audioContext) return;
  
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.value = 0.1;
  
  const createConfirmTone = (freq, type, gainValue, duration) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = freq;
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gainValue, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  };
  
  const baseFreq = 392;
  createConfirmTone(baseFreq, 'sine', 0.2, 0.6);
  createConfirmTone(baseFreq * 1.5, 'sine', 0.1, 0.5);
}

function playCompletionSound() {
  if (!audioContext) return;
  
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.value = 0.12;
  
  const createCompletionTone = (freq, type, delay, gainValue, duration) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = freq;
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now + delay);
    gainNode.gain.linearRampToValueAtTime(gainValue, now + delay + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
    
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration);
  };
  
  const baseFreq = 523.25;
  createCompletionTone(baseFreq, 'sine', 0, 0.25, 0.5);
  createCompletionTone(baseFreq * 1.25, 'sine', 0.1, 0.2, 0.4);
  createCompletionTone(baseFreq * 1.5, 'sine', 0.2, 0.15, 0.6);
}

// Local storage functions
function saveReminders() {
  localStorage.setItem('reminders', JSON.stringify(reminders));
}

function loadReminders() {
  const saved = localStorage.getItem('reminders');
  if (saved) {
    reminders = JSON.parse(saved).map(r => ({
      ...r,
      time: new Date(r.time)
    }));
  }
}

// Global functions for onclick handlers
window.markReminderComplete = markReminderComplete;
window.dismissToast = dismissToast;