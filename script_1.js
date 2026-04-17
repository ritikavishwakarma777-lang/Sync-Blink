const APP_STATES = {
    joy:   { label: 'Joyful',   hue: 160 },
    calm:  { label: 'Serene',   hue: 200 },
    fear:  { label: 'Anxious',  hue: 270 },
    angry: { label: 'Agitated', hue: 20  }
};

const ICONS = {
    joy:   ['fa-sun', 'fa-star', 'fa-heart', 'fa-face-smile', 'fa-music', 'fa-seedling'],
    calm:  ['fa-moon', 'fa-cloud', 'fa-leaf', 'fa-water', 'fa-wind', 'fa-snowflake'],
    fear:  ['fa-ghost', 'fa-eye', 'fa-spider', 'fa-cloud-showers-heavy', 'fa-tornado'],
    angry: ['fa-bolt', 'fa-fire', 'fa-volcano', 'fa-meteor', 'fa-skull']
};

// Curated per-emotion color palettes (RGBA strings)
const PALETTES = {
    joy: [
        'rgba(100, 255, 218, 0.22)',
        'rgba(167, 139, 250, 0.20)',
        'rgba(247, 168, 196, 0.20)',
        'rgba(251, 207, 232, 0.18)'
    ],
    calm: [
        'rgba(56,  189, 248, 0.22)',
        'rgba(52,  211, 153, 0.20)',
        'rgba(129, 140, 248, 0.18)',
        'rgba(100, 255, 218, 0.15)'
    ],
    fear: [
        'rgba(167, 139, 250, 0.25)',
        'rgba(109,  40, 217, 0.20)',
        'rgba(196, 181, 253, 0.15)',
        'rgba(88,   28, 135, 0.20)'
    ],
    angry: [
        'rgba(249, 115,  22, 0.25)',
        'rgba(239,  68,  68, 0.22)',
        'rgba(251, 146,  60, 0.20)',
        'rgba(220,  38,  38, 0.18)'
    ]
};

let currentEmotion = 'joy';
let isMuted        = true;
let hideBadMemories = false;
let showOnlyDreams  = false;
let isVisualsIsolated = false;
let searchQuery     = '';

let audioCtx, gainNode;
let oscillators = [];

const thoughts = [];
const memories = [];

function pickRand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/* ── Init ── */
function init() {
    generateThoughts(22);
    generateMemories(14);
    renderThoughts();
    renderMemories();
    renderEmotionBars();
    setEmotion('joy');

    document.getElementById('mute-btn').addEventListener('click', toggleAudio);
    document.getElementById('close-popup').addEventListener('click', closePopup);

    document.getElementById('search-input').addEventListener('input', e => {
        searchQuery = e.target.value.toLowerCase();
        renderThoughts();
    });
    document.getElementById('toggle-bad-memories').addEventListener('change', e => {
        hideBadMemories = e.target.checked;
        renderThoughts();
    });
    document.getElementById('toggle-dreams').addEventListener('change', e => {
        showOnlyDreams = e.target.checked;
        renderThoughts();
    });
    document.getElementById('toggle-visuals').addEventListener('change', e => {
        isVisualsIsolated = e.target.checked;
        renderThoughts();
    });
}

/* ── Data generation ── */
function generateThoughts(count) {
    const types    = ['memory', 'dream', 'active'];
    const emotions = Object.keys(APP_STATES);
    for (let i = 0; i < count; i++) {
        const emotion = pickRand(emotions);
        const icon    = pickRand(ICONS[emotion]);
        const type    = pickRand(types);
        thoughts.push({
            id: i, emotion, icon, type,
            title: `${APP_STATES[emotion].label} ${type}`,
            desc:  `A fragment of ${type} consciousness, saturated with ${emotion}. It drifts through the infinite corridors of the mind.`,
            size:  Math.random() * 75 + 38,
            x:     Math.random() * 88,
            y:     Math.random() * 68,
            z:     Math.random() * 200 - 100,
            driftX: (Math.random() - 0.5) * 90,
            driftY: (Math.random() - 0.5) * 90,
            driftSpeed: Math.random() * 10 + 12
        });
    }
}

function generateMemories(count) {
    const emotions = Object.keys(APP_STATES);
    for (let i = 0; i < count; i++) {
        const emotion = pickRand(emotions);
        const icon    = pickRand(ICONS[emotion]);
        memories.push({
            id: `mem-${i}`, emotion, icon, age: i,
            title: `Memory #${i}`,
            desc:  `An echo from the past, tinted with ${emotion}.`
        });
    }
}

/* ── Render thoughts ── */
function renderThoughts() {
    const container = document.getElementById('thought-network');
    container.innerHTML = '';

    thoughts.forEach(t => {
        if (hideBadMemories  && (t.emotion === 'fear' || t.emotion === 'angry')) return;
        if (showOnlyDreams   && t.type !== 'dream') return;
        if (isVisualsIsolated && !['fa-eye','fa-sun','fa-cloud','fa-snowflake'].includes(t.icon)) return;
        if (searchQuery && !t.title.toLowerCase().includes(searchQuery) && !t.desc.toLowerCase().includes(searchQuery)) return;

        const node = document.createElement('div');
        node.className = `thought-node ${t.emotion}`;
        node.innerHTML  = `<i class="fa-solid ${t.icon}"></i>`;

        const pal = PALETTES[t.emotion];
        const col = pickRand(pal);
        // Slightly brighter version for the highlight point
        const colBright = col.replace(/[\d.]+\)$/, m => String(Math.min(parseFloat(m) + 0.22, 0.65)) + ')');

        node.style.width       = `${t.size}px`;
        node.style.height      = `${t.size}px`;
        node.style.left        = `${t.x}vw`;
        node.style.top         = `${t.y}vh`;
        node.style.transform   = `translateZ(${t.z}px)`;
        node.style.fontSize    = `${t.size * 0.38}px`;
        node.style.background  = `radial-gradient(circle at 35% 35%, ${colBright}, ${col})`;
        node.style.setProperty('--drift-x',     `${t.driftX}px`);
        node.style.setProperty('--drift-y',     `${t.driftY}px`);
        node.style.setProperty('--drift-speed', `${t.driftSpeed}s`);

        node.addEventListener('click', () => {
            openPopup(t);
            if (currentEmotion !== t.emotion) setEmotion(t.emotion);
        });

        container.appendChild(node);
    });
}

/* ── Render memories ── */
function renderMemories() {
    const container = document.getElementById('memory-timeline');
    container.innerHTML = '';

    memories.forEach(m => {
        const node = document.createElement('div');
        node.className = 'memory-node';
        node.innerHTML  = `<i class="fa-solid ${m.icon}"></i>`;

        const blur  = m.age * 0.45;
        const scale = Math.max(0.45, 1 - m.age * 0.048);
        const opacity = Math.max(0.22, 1 - m.age * 0.075);
        const col   = `hsla(${APP_STATES[m.emotion].hue}, 65%, 65%, 0.5)`;

        node.style.filter     = `blur(${blur}px)`;
        node.style.transform  = `scale(${scale})`;
        node.style.opacity    = opacity;
        node.style.background = `radial-gradient(circle at top, rgba(255,255,255,0.5), ${col})`;
        node.style.boxShadow  = `0 0 20px ${col}`;

        node.addEventListener('click', () => {
            openPopup({ ...m, type: 'memory' });
            if (currentEmotion !== m.emotion) setEmotion(m.emotion);
        });

        container.appendChild(node);
    });
}

/* ── EQ bars ── */
function renderEmotionBars() {
    const container = document.getElementById('emotion-wave');
    container.innerHTML = '';
    for (let i = 0; i < 13; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.animationDelay = `${Math.random() * 1.4}s`;
        container.appendChild(bar);
    }
}

/* ── Emotion state ── */
function setEmotion(key) {
    currentEmotion = key;
    document.documentElement.setAttribute('data-emotion', key);
    document.getElementById('emotion-label').textContent = APP_STATES[key].label;
    updateAudio();
}

/* ── Popup ── */
function openPopup(data) {
    const popup = document.getElementById('thought-popup');
    document.getElementById('popup-title').textContent = data.title;
    document.getElementById('popup-desc').textContent  = data.desc;
    document.querySelector('.popup-icon').innerHTML    = `<i class="fa-solid ${data.icon}"></i>`;
    document.querySelector('.popup-icon').style.color  = `hsl(${APP_STATES[data.emotion].hue}, 70%, 65%)`;
    popup.classList.remove('hidden');
    popup.classList.add('active');
}

function closePopup() {
    const popup = document.getElementById('thought-popup');
    popup.classList.remove('active');
}

/* ── Audio ── */
function toggleAudio() {
    if (!audioCtx) initAudio();
    isMuted = !isMuted;
    const btn = document.getElementById('mute-btn');
    if (isMuted) {
        btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> &nbsp;Unmute Soundscape';
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
    } else {
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> &nbsp;Mute Soundscape';
        audioCtx.resume();
        updateAudio();
    }
}

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(audioCtx.destination);

    for (let i = 0; i < 3; i++) {
        const osc  = audioCtx.createOscillator();
        const lfo  = audioCtx.createOscillator();
        const g    = audioCtx.createGain();
        g.gain.value = 0.08;
        lfo.type = 'sine';
        lfo.frequency.value = 0.08 + i * 0.04;
        lfo.connect(g.gain);
        osc.connect(g);
        g.connect(gainNode);
        osc.start();
        lfo.start();
        oscillators.push({ osc, lfo, g });
    }
}

function updateAudio() {
    if (!audioCtx || isMuted) return;
    gainNode.gain.setTargetAtTime(0.28, audioCtx.currentTime, 1);

    const baseFreqs = {
        joy:   [261.63, 329.63, 392.00],
        calm:  [130.81, 196.00, 261.63],
        fear:  [65.41,  69.30,  98.00],
        angry: [155,    165,    207   ]
    };
    const freqs = baseFreqs[currentEmotion];

    oscillators.forEach((item, i) => {
        item.osc.frequency.setTargetAtTime(freqs[i], audioCtx.currentTime, 2);
        if (currentEmotion === 'angry') {
            item.osc.type = 'triangle';
        } else if (currentEmotion === 'fear') {
            item.osc.type = 'square';
            item.lfo.frequency.setTargetAtTime(4, audioCtx.currentTime, 0.5);
        } else {
            item.osc.type = 'sine';
            item.lfo.frequency.setTargetAtTime(0.08 + i * 0.04, audioCtx.currentTime, 0.5);
        }
    });
}

window.onload = init;