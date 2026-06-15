// ==================== 應用程式狀態 ====================
const appState = {
    words: [],
    currentIndex: 0,
    isFlipped: false,
    api: {
        dictionaryApi: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
        // 備用 API：Free Dictionary API
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadWordsFromStorage();
    updateUI();
});

function initializeApp() {
    // 從本地存儲加載單字
    loadWordsFromStorage();
    
    // 如果沒有單字，顯示空狀態
    if (appState.words.length === 0) {
        showEmptyState();
    } else {
        hideEmptyState();
        displayCurrentWord();
    }
}

// ==================== 事件監聽 ====================
function setupEventListeners() {
    // 導航
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // 卡片控制
    document.getElementById('mainCard').addEventListener('click', toggleFlip);
    document.getElementById('flipBtn').addEventListener('click', toggleFlip);
    document.getElementById('prevBtn').addEventListener('click', previousWord);
    document.getElementById('nextBtn').addEventListener('click', nextWord);
    document.getElementById('shuffleBtn').addEventListener('click', shuffleWords);
    document.getElementById('resetBtn').addEventListener('click', resetProgress);

    // 表單
    document.getElementById('addWordForm').addEventListener('submit', handleAddWord);
    document.getElementById('autoFillBtn').addEventListener('click', handleAutoFill);
}

// ==================== 導航 ====================
function handleNavigation(e) {
    e.preventDefault();
    const pageName = e.target.dataset.page;
    
    // 更新導航链接狀態
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');

    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // 顯示選中的頁面
    document.getElementById(`${pageName}-page`).classList.add('active');

    // 重置卡片狀態
    appState.isFlipped = false;
    document.getElementById('mainCard').classList.remove('flipped');
}

// ==================== 卡片翻頁 ====================
function toggleFlip() {
    const card = document.getElementById('mainCard');
    appState.isFlipped = !appState.isFlipped;
    card.classList.toggle('flipped');
}

function displayCurrentWord() {
    if (appState.words.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();
    const word = appState.words[appState.currentIndex];

    // 正面
    document.getElementById('frontWord').textContent = word.englishWord || 'N/A';

    // 背面
    document.getElementById('backTranslation').textContent = word.translation || '-';
    document.getElementById('backPOS').textContent = word.partOfSpeech || '-';
    document.getElementById('exampleSentence').textContent = word.exampleSentence || '-';
    document.getElementById('backRoot').textContent = word.rootAnalysis || '-';

    // 重置翻轉狀態
    appState.isFlipped = false;
    document.getElementById('mainCard').classList.remove('flipped');

    // 更新進度
    updateProgress();
}

function previousWord() {
    if (appState.currentIndex > 0) {
        appState.currentIndex--;
        displayCurrentWord();
    }
}

function nextWord() {
    if (appState.currentIndex < appState.words.length - 1) {
        appState.currentIndex++;
        displayCurrentWord();
    }
}

function shuffleWords() {
    for (let i = appState.words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [appState.words[i], appState.words[j]] = [appState.words[j], appState.words[i]];
    }
    appState.currentIndex = 0;
    displayCurrentWord();
    showNotification('Words shuffled! 🔀', 'info');
}

function resetProgress() {
    appState.currentIndex = 0;
    displayCurrentWord();
    showNotification('Progress reset! 🔁', 'info');
}

// ==================== 進度更新 ====================
function updateProgress() {
    const total = appState.words.length;
    const current = appState.currentIndex + 1;
    
    document.getElementById('current-index').textContent = current;
    document.getElementById('total-words').textContent = total;

    const percentage = (current / total) * 100;
    document.querySelector('.progress-fill').style.width = percentage + '%';

    // 更新按鈕狀態
    document.getElementById('prevBtn').disabled = appState.currentIndex === 0;
    document.getElementById('nextBtn').disabled = appState.currentIndex === total - 1;
}

// ==================== 單字管理 ====================
function handleAddWord(e) {
    e.preventDefault();

    const newWord = {
        id: Date.now(),
        englishWord: document.getElementById('englishWord').value.trim(),
        translation: document.getElementById('translation').value.trim(),
        partOfSpeech: document.getElementById('partOfSpeech').value,
        exampleSentence: document.getElementById('exampleSentence').value.trim(),
        rootAnalysis: document.getElementById('rootAnalysis').value.trim()
    };

    // 驗證
    if (!newWord.englishWord || !newWord.translation) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }

    // 檢查是否重複
    if (appState.words.some(w => w.englishWord.toLowerCase() === newWord.englishWord.toLowerCase())) {
        showNotification('This word already exists!', 'error');
        return;
    }

    // 新增單字
    appState.words.push(newWord);
    saveWordsToStorage();
    updateWordList();
    
    // 重置表單
    document.getElementById('addWordForm').reset();
    
    showNotification('Word added successfully! ✨', 'success');

    // 如果這是第一個單字，顯示它
    if (appState.words.length === 1) {
        displayCurrentWord();
    }
}

function deleteWord(id) {
    if (confirm('Are you sure you want to delete this word?')) {
        appState.words = appState.words.filter(w => w.id !== id);
        saveWordsToStorage();
        updateWordList();
        
        // 調整當前索引
        if (appState.currentIndex >= appState.words.length && appState.currentIndex > 0) {
            appState.currentIndex--;
        }
        
        if (appState.words.length > 0) {
            displayCurrentWord();
        } else {
            showEmptyState();
        }
        
        showNotification('Word deleted! 🗑️', 'info');
    }
}

// ==================== 自動填入功能 ====================
async function handleAutoFill() {
    const englishWord = document.getElementById('englishWord').value.trim();

    if (!englishWord) {
        showNotification('Please enter an English word first.', 'error');
        return;
    }

    const btn = document.getElementById('autoFillBtn');
    const loader = document.getElementById('loadingIndicator');

    try {
        btn.disabled = true;
        loader.classList.add('active');

        // 調用 API 獲取資料
        const data = await fetchWordData(englishWord);

        if (data) {
            // 填入表單
            document.getElementById('translation').value = data.translation || '';
            document.getElementById('partOfSpeech').value = data.partOfSpeech || '';
            document.getElementById('exampleSentence').value = data.exampleSentence || '';
            document.getElementById('rootAnalysis').value = data.rootAnalysis || '';

            showNotification('Word data loaded successfully! ✨', 'success');
        } else {
            showNotification('Could not find data for this word. Please fill manually.', 'error');
        }
    } catch (error) {
        console.error('Auto-fill error:', error);
        showNotification('Error fetching data. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        loader.classList.remove('active');
    }
}

// ==================== API 調用 ====================
async function fetchWordData(word) {
    try {
        // 使用 Free Dictionary API
        const response = await fetch(`${appState.api.dictionaryApi}${word.toLowerCase()}`);

        if (!response.ok) {
            console.warn('API response not ok:', response.status);
            return null;
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            console.warn('No data returned from API');
            return null;
        }

        const wordData = data[0];
        
        // 提取資料
        const translation = extractTranslation(wordData);
        const partOfSpeech = extractPartOfSpeech(wordData);
        const exampleSentence = extractExample(wordData);
        const rootAnalysis = extractEtymology(wordData);

        return {
            translation,
            partOfSpeech,
            exampleSentence,
            rootAnalysis
        };
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

function extractTranslation(wordData) {
    // 嘗試從 meanings 中提取中文或英文定義
    if (wordData.meanings && wordData.meanings.length > 0) {
        const meaning = wordData.meanings[0];
        if (meaning.definitions && meaning.definitions.length > 0) {
            return meaning.definitions[0].definition || '';
        }
    }
    return '';
}

function extractPartOfSpeech(wordData) {
    if (wordData.meanings && wordData.meanings.length > 0) {
        return wordData.meanings[0].partOfSpeech || '';
    }
    return '';
}

function extractExample(wordData) {
    if (wordData.meanings && wordData.meanings.length > 0) {
        const meaning = wordData.meanings[0];
        if (meaning.definitions && meaning.definitions.length > 0) {
            const def = meaning.definitions[0];
            if (def.example) {
                return def.example;
            }
        }
    }
    return '';
}

function extractEtymology(wordData) {
    // 提取詞源資料
    if (wordData.origin) {
        return wordData.origin;
    }
    
    // 備用：從詞性中提取根分析
    if (wordData.meanings && wordData.meanings.length > 0) {
        const meaning = wordData.meanings[0];
        if (meaning.synonyms && meaning.synonyms.length > 0) {
            return 'Synonyms: ' + meaning.synonyms.slice(0, 3).join(', ');
        }
    }
    
    return '';
}

// ==================== 本地存儲 ====================
function saveWordsToStorage() {
    localStorage.setItem('vocabularyWords', JSON.stringify(appState.words));
}

function loadWordsFromStorage() {
    const stored = localStorage.getItem('vocabularyWords');
    if (stored) {
        try {
            appState.words = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading from storage:', error);
            appState.words = [];
        }
    }
}

// ==================== UI 更新 ====================
function updateWordList() {
    const wordList = document.getElementById('wordList');
    const wordCount = document.getElementById('wordCount');

    wordCount.textContent = `(${appState.words.length})`;

    if (appState.words.length === 0) {
        wordList.innerHTML = '<p class="empty-message">No words added yet</p>';
        return;
    }

    wordList.innerHTML = appState.words.map(word => `
        <div class="word-card">
            <div class="word-card-header">
                <div class="word-card-title">${escapeHtml(word.englishWord)}</div>
                <div class="word-card-pos">${escapeHtml(word.partOfSpeech || 'N/A')}</div>
            </div>
            <div class="word-card-body">
                <div class="word-card-item">
                    <div class="word-card-label">Translation</div>
                    <div class="word-card-value">${escapeHtml(word.translation)}</div>
                </div>
                <div class="word-card-item">
                    <div class="word-card-label">Example</div>
                    <div class="word-card-value">${escapeHtml(word.exampleSentence)}</div>
                </div>
                ${word.rootAnalysis ? `
                    <div class="word-card-item">
                        <div class="word-card-label">Root Analysis</div>
                        <div class="word-card-value">${escapeHtml(word.rootAnalysis)}</div>
                    </div>
                ` : ''}
            </div>
            <div class="word-card-actions">
                <button class="btn-delete" onclick="deleteWord(${word.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function showEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const cardContainer = document.querySelector('.card-container');
    const controls = document.querySelector('.controls');
    const options = document.querySelector('.options');

    if (emptyState) {
        emptyState.style.display = 'flex';
        emptyState.style.flexDirection = 'column';
        emptyState.style.justifyContent = 'center';
        emptyState.style.alignItems = 'center';
        emptyState.style.minHeight = '300px';
    }
    if (cardContainer) cardContainer.style.display = 'none';
    if (controls) controls.style.display = 'none';
    if (options) options.style.display = 'none';
}

function hideEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const cardContainer = document.querySelector('.card-container');
    const controls = document.querySelector('.controls');
    const options = document.querySelector('.options');

    if (emptyState) emptyState.style.display = 'none';
    if (cardContainer) cardContainer.style.display = 'block';
    if (controls) controls.style.display = 'flex';
    if (options) options.style.display = 'flex';
}

function updateUI() {
    updateWordList();
    if (appState.words.length > 0) {
        updateProgress();
    }
}

// ==================== 通知系統 ====================
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ==================== 工具函數 ====================
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== 導出功能（可選） ====================
function exportWordsAsJSON() {
    const dataStr = JSON.stringify(appState.words, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vocabulary-words.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importWordsFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                // 合併或覆蓋
                appState.words = [...appState.words, ...imported];
                saveWordsToStorage();
                updateUI();
                showNotification(`Imported ${imported.length} words! 📚`, 'success');
            }
        } catch (error) {
            showNotification('Error importing file.', 'error');
        }
    };
    reader.readAsText(file);
}

// ==================== 鍵盤快捷鍵 ====================
document.addEventListener('keydown', (e) => {
    const currentPage = document.querySelector('.page.active');
    const isStudyPage = currentPage.id === 'study-page';

    if (!isStudyPage) return;

    switch(e.key) {
        case 'ArrowLeft':
            previousWord();
            break;
        case 'ArrowRight':
            nextWord();
            break;
        case ' ':
            e.preventDefault();
            toggleFlip();
            break;
    }
});
