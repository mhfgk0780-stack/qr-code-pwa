// ===== إدارة الحالة =====
const state = {
    history: JSON.parse(localStorage.getItem('qr-history')) || [],
    currentQR: null,
    settings: {
        size: 256,
        darkColor: '#2c3e50',
        lightColor: '#ffffff'
    }
};

// ===== تهيئة التطبيق =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadHistory();
    setupEventListeners();
});

function initializeApp() {
    // تحميل الإعدادات المحفوظة
    const savedSettings = localStorage.getItem('qr-settings');
    if (savedSettings) {
        state.settings = JSON.parse(savedSettings);
        document.getElementById('qrSize').value = state.settings.size;
        document.getElementById('darkColor').value = state.settings.darkColor;
        document.getElementById('lightColor').value = state.settings.lightColor;
    }
}

// ===== إعداد مستمعي الأحداث =====
function setupEventListeners() {
    // زر توليد QR
    document.getElementById('generateBtn').addEventListener('click', generateQR);

    // زر تحميل
    document.getElementById('downloadBtn').addEventListener('click', downloadQR);

    // زر مسح السجل
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

    // تحديث الإعدادات
    document.getElementById('qrSize').addEventListener('change', updateSettings);
    document.getElementById('darkColor').addEventListener('change', updateSettings);
    document.getElementById('lightColor').addEventListener('change', updateSettings);

    // تحديث عرض قيم الألوان
    document.getElementById('darkColor').addEventListener('input', (e) => {
        document.getElementById('darkColorValue').textContent = e.target.value;
    });
    document.getElementById('lightColor').addEventListener('input', (e) => {
        document.getElementById('lightColorValue').textContent = e.target.value;
    });

    // Enter للتوليد السريع
    document.getElementById('textInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateQR();
        }
    });
}

// ===== توليد QR Code =====
async function generateQR() {
    const text = document.getElementById('textInput').value.trim();

    if (!text) {
        showToast('⚠️ الرجاء إدخال نص أو رابط', 'warning');
        return;
    }

    try {
        const canvas = document.getElementById('qrcode');
        const options = {
            width: state.settings.size,
            height: state.settings.size,
            color: {
                dark: state.settings.darkColor,
                light: state.settings.lightColor
            },
            margin: 2
        };

        await QRCode.toCanvas(canvas, text, options);

        state.currentQR = {
            text: text,
            timestamp: Date.now()
        };

        // إضافة للسجل
        addToHistory(text);

        // إظهار زر التحميل
        document.getElementById('downloadBtn').style.display = 'inline-flex';

        showToast('✅ تم إنشاء QR Code بنجاح!', 'success');

    } catch (error) {
        console.error('Error generating QR:', error);
        showToast('❌ حدث خطأ في إنشاء الكود', 'error');
    }
}

// ===== تحميل QR Code =====
function downloadQR() {
    if (!state.currentQR) {
        showToast('⚠️ لا يوجد كود للتحميل', 'warning');
        return;
    }

    const canvas = document.getElementById('qrcode');
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `qr-code-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('📥 تم تحميل الصورة بنجاح!', 'success');
}

// ===== إدارة السجل =====
function addToHistory(text) {
    // تجنب التكرار
    const exists = state.history.find(item => item.text === text);
    if (exists) return;

    const historyItem = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toLocaleString('ar-IQ')
    };

    state.history.unshift(historyItem);

    // الحد الأقصى 50 عنصر
    if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
    }

    saveHistory();
    renderHistory();
}

function loadHistory() {
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('historyList');

    if (state.history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <p>📋 لا يوجد سجل حتى الآن</p>
                <p class="empty-history-subtitle">ابدأ بإنشاء أول QR Code</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = state.history.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-text" title="${item.text}">
                ${item.text}
            </div>
            <div class="history-actions">
                <button class="btn btn-secondary btn-icon" onclick="loadFromHistory(${item.id})" title="تحميل">
                    🔄
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteHistoryItem(${item.id})" title="حذف">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function loadFromHistory(id) {
    const item = state.history.find(h => h.id === id);
    if (item) {
        document.getElementById('textInput').value = item.text;
        generateQR();
        showToast('✅ تم تحميل النص من السجل', 'success');
    }
}

function deleteHistoryItem(id) {
    state.history = state.history.filter(h => h.id !== id);
    saveHistory();
    renderHistory();
    showToast('🗑️ تم حذف العنصر', 'success');
}

function clearHistory() {
    if (state.history.length === 0) {
        showToast('⚠️ السجل فارغ بالفعل', 'warning');
        return;
    }

    if (confirm('هل أنت متأكد من حذف جميع السجلات؟')) {
        state.history = [];
        saveHistory();
        renderHistory();
        showToast('🗑️ تم مسح السجل بالكامل', 'success');
    }
}

function saveHistory() {
    localStorage.setItem('qr-history', JSON.stringify(state.history));
}

// ===== تحديث الإعدادات =====
function updateSettings() {
    state.settings.size = parseInt(document.getElementById('qrSize').value);
    state.settings.darkColor = document.getElementById('darkColor').value;
    state.settings.lightColor = document.getElementById('lightColor').value;

    localStorage.setItem('qr-settings', JSON.stringify(state.settings));

    // إعادة توليد QR إذا كان موجوداً
    if (state.currentQR) {
        generateQR();
    }
}

// ===== إشعارات Toast =====
function showToast(message, type = 'info') {
    // إزالة أي toast موجود
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== مسح QR Code من الكاميرا =====
async function scanQRCode() {
    try {
        // التحقق من دعم المتصفح
        if (!('BarcodeDetector' in window)) {
            showToast('⚠️ متصفحك لا يدعم مسح QR Code', 'warning');
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        // إنشاء عنصر فيديو
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });

        // محاولة الكشف
        const detect = async () => {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
                document.getElementById('textInput').value = barcodes[0].rawValue;
                stream.getTracks().forEach(track => track.stop());
                showToast('✅ تم مسح الكود بنجاح!', 'success');
            } else {
                requestAnimationFrame(detect);
            }
        };

        video.addEventListener('loadeddata', detect);

    } catch (error) {
        console.error('Error scanning QR:', error);
        showToast('❌ فشل الوصول للكاميرا', 'error');
    }
}

// ===== تسجيل Service Worker =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('✅ Service Worker registered'))
        .catch(err => console.error('❌ Service Worker registration failed:', err));
}
