// 全局变量
let games = [];
let filteredGames = [];
let currentLanguage = 'zh';  // 默认设置为中文
let currentTheme = 'light';

// 多语言翻译内容
const translations = {
    en: {
        'page.title': 'Fun Games - Casual Game Platform',
        'brand.name': 'Fun Games',
        'nav.home': 'Home',
        'nav.games': 'Games',
        'nav.admin': 'Admin',
        'search.placeholder': 'Search games...',
        'category.all': 'All',
        'category.latest': 'Latest',
        'category.casual': 'Casual',
        'category.puzzle': 'Puzzle',
        'category.action': 'Action',
        'category.arcade': 'Arcade',
        'loading': 'Loading...',
        'sidebar.popular': 'Popular Games',
        'game.plays': 'plays',
        'game.play': 'Play Game',
        'game.fullscreen': 'Fullscreen',
        'theme.toggle': 'Theme',
        'theme.dark': 'Dark',
        'theme.light': 'Light',
        'footer.about': 'About Us',
        'footer.description': 'Fun Games is a casual gaming platform dedicated to providing high-quality browser games for players of all ages.',
        'footer.quick_links': 'Quick Links',
        'footer.home': 'Home',
        'footer.games': 'Games',
        'footer.new_games': 'New Games',
        'footer.popular': 'Popular Games',
        'footer.support': 'Support',
        'footer.contact': 'Contact Us',
        'footer.privacy': 'Privacy Policy',
        'footer.terms': 'Terms of Service',
        'footer.developer': 'Developer Info',
        'footer.follow': 'Follow Us',
        'footer.copyright': '© 2024 Fun Games Platform. All rights reserved.',
        'contact.title': 'Contact Us',
        'contact.description': 'We\'d love to hear from you! Get in touch with us through any of the following methods:',
        'contact.email': 'Email:',
        'contact.phone': 'Phone:',
        'contact.address': 'Address:',
        'privacy.title': 'Privacy Policy',
        'developer.title': 'Developer Information'
    },
    zh: {
        'page.title': '乐玩小游戏 - 休闲游戏平台',
        'brand.name': '乐玩小游戏',
        'nav.home': '首页',
        'nav.games': '游戏',
        'nav.admin': '管理',
        'search.placeholder': '搜索游戏...',
        'category.all': '全部',
        'category.latest': '最新',
        'category.casual': '休闲',
        'category.puzzle': '益智',
        'category.action': '动作',
        'category.arcade': '街机',
        'loading': '加载中...',
        'sidebar.popular': '热门游戏',
        'game.plays': '次播放',
        'game.play': '开始游戏',
        'game.fullscreen': '全屏',
        'theme.toggle': '主题',
        'theme.dark': '深色',
        'theme.light': '浅色',
        'footer.about': '关于我们',
        'footer.description': '乐玩小游戏是一个休闲游戏平台，致力于为各个年龄段的玩家提供高质量的浏览器游戏。',
        'footer.quick_links': '快速链接',
        'footer.home': '首页',
        'footer.games': '游戏',
        'footer.new_games': '新游戏',
        'footer.popular': '热门游戏',
        'footer.support': '支持',
        'footer.contact': '联系我们',
        'footer.privacy': '隐私政策',
        'footer.terms': '服务条款',
        'footer.developer': '开发者信息',
        'footer.follow': '关注我们',
        'footer.copyright': '© 2024 乐玩小游戏平台. 保留所有权利.',
        'contact.title': '联系我们',
        'contact.description': '我们很乐意听到您的声音！通过以下任何方式与我们联系：',
        'contact.email': '邮箱：',
        'contact.phone': '电话：',
        'contact.address': '地址：',
        'privacy.title': '隐私政策',
        'developer.title': '开发者信息'
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    initializeApp();
});

// 初始化应用
function initializeApp() {
    console.log('初始化应用...');
    
    // 从本地存储恢复设置
    currentLanguage = localStorage.getItem('language') || 'zh';
    currentTheme = localStorage.getItem('theme') || 'light';
    
    console.log('当前语言:', currentLanguage, '当前主题:', currentTheme);
    
    // 应用设置
    applyLanguage(currentLanguage);
    applyTheme(currentTheme);
    
    // 设置UI控件
    const languageSelector = document.getElementById('languageSelector');
    const footerLanguageSelector = document.getElementById('footerLanguageSelector');
    
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }
    if (footerLanguageSelector) {
        footerLanguageSelector.value = currentLanguage;
    }
    
    updateThemeButton();
    updateFooterThemeButton();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 加载游戏和广告
    loadGames();
    loadAds();
}

// 绑定事件监听器
function bindEventListeners() {
    console.log('绑定事件监听器...');
    
    // 顶部语言选择器
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
        languageSelector.addEventListener('change', function(e) {
            changeLanguage(e.target.value);
        });
    } else {
        console.log('找不到languageSelector元素');
    }
    
    // 底部语言选择器
    const footerLanguageSelector = document.getElementById('footerLanguageSelector');
    if (footerLanguageSelector) {
        footerLanguageSelector.addEventListener('change', function(e) {
            changeLanguage(e.target.value);
        });
    } else {
        console.log('找不到footerLanguageSelector元素');
    }
    
    // 顶部主题切换
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            toggleTheme();
        });
    } else {
        console.log('找不到themeToggle元素');
    }
    
    // 底部主题切换
    const footerThemeToggle = document.getElementById('footerThemeToggle');
    if (footerThemeToggle) {
        footerThemeToggle.addEventListener('click', function() {
            toggleTheme();
        });
    } else {
        console.log('找不到footerThemeToggle元素');
    }
    
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterGames(e.target.value);
        });
    } else {
        console.log('找不到searchInput元素');
    }
    
    // 分类筛选
    const categoryTabs = document.getElementById('categoryTabs');
    if (categoryTabs) {
        categoryTabs.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-link')) {
                e.preventDefault();
                const category = e.target.getAttribute('data-category');
                filterByCategory(category);
                
                // 更新活动状态
                document.querySelectorAll('#categoryTabs .nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        });
    } else {
        console.log('找不到categoryTabs元素');
    }
    
    // 全屏按钮
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            const iframe = document.getElementById('gameFrame');
            if (iframe && iframe.requestFullscreen) {
                iframe.requestFullscreen();
            } else if (iframe && iframe.webkitRequestFullscreen) {
                iframe.webkitRequestFullscreen();
            } else if (iframe && iframe.msRequestFullscreen) {
                iframe.msRequestFullscreen();
            }
        });
    }
}

// 语言切换
function changeLanguage(language) {
    currentLanguage = language;
    localStorage.setItem('language', language);
    applyLanguage(language);
    
    // 同步所有语言选择器
    document.getElementById('languageSelector').value = language;
    document.getElementById('footerLanguageSelector').value = language;
    
    // 重新渲染游戏卡片以更新语言
    if (filteredGames.length > 0) {
        displayGames(filteredGames);
    }
}

// 应用语言
function applyLanguage(language) {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[language] && translations[language][key]) {
            element.textContent = translations[language][key];
        }
    });
    
    // 处理placeholder
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[language] && translations[language][key]) {
            element.placeholder = translations[language][key];
        }
    });
    
    // 更新页面标题
    if (translations[language] && translations[language]['page.title']) {
        document.title = translations[language]['page.title'];
    }
}

// 主题切换
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
    updateThemeButton();
    updateFooterThemeButton();
}

// 应用主题
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// 更新主题按钮
function updateThemeButton() {
    const button = document.getElementById('themeToggle');
    if (!button) return;
    
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (!icon || !text) return;
    
    if (currentTheme === 'dark') {
        icon.className = 'fas fa-sun me-1';
        text.setAttribute('data-translate', 'theme.light');
        text.textContent = translations[currentLanguage]['theme.light'] || 'Light';
    } else {
        icon.className = 'fas fa-moon me-1';
        text.setAttribute('data-translate', 'theme.dark');
        text.textContent = translations[currentLanguage]['theme.dark'] || 'Dark';
    }
}

// 更新底部主题按钮
function updateFooterThemeButton() {
    const button = document.getElementById('footerThemeToggle');
    if (!button) return;
    
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (!icon || !text) return;
    
    if (currentTheme === 'dark') {
        icon.className = 'fas fa-sun me-1';
        text.textContent = currentLanguage === 'zh' ? '浅色模式' : 'Light Mode';
    } else {
        icon.className = 'fas fa-moon me-1';
        text.textContent = currentLanguage === 'zh' ? '深色模式' : 'Dark Mode';
    }
}

// 加载游戏列表
async function loadGames() {
    console.log('开始加载游戏列表...');
    try {
        showLoading();
        const response = await fetch('/api/games');
        console.log('API响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        games = await response.json();
        console.log('加载到的游戏数据:', games);
        
        filteredGames = [...games];
        displayGames(filteredGames);
        hideLoading();
    } catch (error) {
        console.error('加载游戏时出错:', error);
        hideLoading();
        showNoGames();
    }
}

// 显示游戏列表
function displayGames(gamesToShow) {
    console.log('显示游戏列表，游戏数量:', gamesToShow ? gamesToShow.length : 0);
    const gamesGrid = document.getElementById('gamesGrid');
    
    if (!gamesGrid) {
        console.error('找不到gamesGrid元素');
        return;
    }
    
    if (!gamesToShow || gamesToShow.length === 0) {
        console.log('没有游戏要显示');
        showNoGames();
        return;
    }
    
    gamesGrid.innerHTML = '';
    gamesGrid.style.display = 'block';
    
    const noGamesElement = document.getElementById('noGames');
    if (noGamesElement) {
        noGamesElement.style.display = 'none';
    }
    
    gamesToShow.forEach((game, index) => {
        console.log('创建游戏卡片:', game.title);
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
    
    console.log('游戏列表显示完成');
}

// 创建游戏卡片
function createGameCard(game) {
    const div = document.createElement('div');
    div.className = 'col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2 mb-4';
    
    const categoryText = {
        'casual': currentLanguage === 'zh' ? '休闲' : 'Casual',
        'puzzle': currentLanguage === 'zh' ? '益智' : 'Puzzle',
        'action': currentLanguage === 'zh' ? '动作' : 'Action',
        'arcade': currentLanguage === 'zh' ? '街机' : 'Arcade'
    };
    
    const playText = currentLanguage === 'zh' ? '开始游戏' : 'Play Game';
    const playsText = currentLanguage === 'zh' ? '次播放' : 'plays';
    
    // 处理缩略图URL
    let thumbnailSrc = '/static/images/default-game.svg';
    if (game.thumbnail && game.thumbnail.trim() !== '') {
        thumbnailSrc = game.thumbnail;
    }
    
    div.innerHTML = `
        <div class="card game-card h-100" onclick="playGame(${game.id})">
            <div class="game-image-container">
                <img src="${thumbnailSrc}" 
                     class="card-img-top game-image" alt="${game.title}" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="game-placeholder" style="display:none; height:150px; background:#f8f9fa; align-items:center; justify-content:center; flex-direction:column;">
                    <i class="fas fa-gamepad fa-2x text-muted mb-2"></i>
                    <small class="text-muted">游戏图片</small>
                </div>
            </div>
            <div class="card-body d-flex flex-column p-3">
                <h6 class="card-title text-truncate mb-2">${game.title}</h6>
                <p class="card-text small text-muted flex-grow-1 mb-2">${game.description || ''}</p>
                <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-primary small">${categoryText[game.category] || game.category}</span>
                        <small class="text-muted">${game.play_count || 0} ${playsText}</small>
                    </div>
                    <button class="btn btn-outline-primary btn-sm w-100">${playText}</button>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// 筛选游戏
function filterGames(searchTerm) {
    if (!searchTerm) {
        filteredGames = [...games];
    } else {
        filteredGames = games.filter(game => 
            game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    displayGames(filteredGames);
}

// 按分类筛选
function filterByCategory(category) {
    if (category === 'all') {
        filteredGames = [...games];
    } else if (category === 'latest') {
        filteredGames = [...games].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
        filteredGames = games.filter(game => game.category === category);
    }
    displayGames(filteredGames);
}

// 播放游戏
function playGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    // 在新窗口中打开游戏
    window.open(`/game/${gameId}`, '_blank');
}

// 加载广告
async function loadAds() {
    try {
        const response = await fetch('/api/ad-configs');
        if (response.ok) {
            const ads = await response.json();
            ads.forEach(ad => {
                const adElement = document.getElementById(ad.position);
                if (adElement) {
                    adElement.innerHTML = ad.ad_code;
                }
            });
        }
    } catch (error) {
        console.error('Error loading ads:', error);
    }
}

// 显示加载状态
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('gamesGrid').style.display = 'none';
    document.getElementById('noGames').style.display = 'none';
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 显示无游戏状态
function showNoGames() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('gamesGrid').style.display = 'none';
    document.getElementById('noGames').style.display = 'block';
}

// 模态框功能
function showContactModal() {
    alert(translations[currentLanguage]['contact.title'] || 'Contact Us');
}

function showPrivacyModal() {
    alert(translations[currentLanguage]['privacy.title'] || 'Privacy Policy');
}

function showTermsModal() {
    alert('Terms of Service');
}

function showDeveloperModal() {
    alert(translations[currentLanguage]['developer.title'] || 'Developer Information');
}
