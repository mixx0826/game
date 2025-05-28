/**
 * 乐玩小游戏 - 管理后台
 * 版本: 2.0
 * 功能: 仪表盘、游戏管理、广告管理、数据统计
 */

// 全局变量
let authToken = null;
let currentSection = 'dashboard';

// DOM元素
const elements = {
    loginPage: null,
    adminPage: null,
    loginForm: null,
    loginError: null,
    username: null,
    password: null,
    logoutBtn: null,
    navLinks: null,
    contentSections: null
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 乐玩小游戏管理后台 v2.0 启动');
    initializeElements();
    initializeEventListeners();
    initializeUploadArea();
    checkAuthStatus();
});

// 初始化DOM元素引用
function initializeElements() {
    elements.loginPage = document.getElementById('loginPage');
    elements.adminPage = document.getElementById('adminPage');
    elements.loginForm = document.getElementById('loginForm');
    elements.loginError = document.getElementById('loginError');
    elements.username = document.getElementById('username');
    elements.password = document.getElementById('password');
    elements.logoutBtn = document.getElementById('logoutBtn');
    elements.navLinks = document.querySelectorAll('[data-section]');
    elements.contentSections = document.querySelectorAll('.content-section');
    
    console.log('✓ DOM元素初始化完成');
}

// 初始化事件监听器
function initializeEventListeners() {
    // 登录表单
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // 导航菜单
    elements.navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section, this);
        });
    });
    
    // 退出登录
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 广告表单
    const topBannerForm = document.getElementById('topBannerForm');
    const sidebarForm = document.getElementById('sidebarForm');
    
    if (topBannerForm) {
        topBannerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAdConfig('top-banner', this);
        });
    }
    
    if (sidebarForm) {
        sidebarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAdConfig('sidebar', this);
        });
    }
    
    console.log('✓ 事件监听器初始化完成');
}

// 初始化文件上传区域
function initializeUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('gameFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    
    if (!uploadArea || !fileInput) return;
    
    // 点击上传区域
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 文件选择
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            fileName.textContent = file.name;
            fileInfo.classList.remove('d-none');
            uploadArea.style.borderColor = '#28a745';
            uploadArea.style.backgroundColor = '#f8fff9';
        }
    });
    
    // 拖拽功能
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            const file = files[0];
            fileName.textContent = file.name;
            fileInfo.classList.remove('d-none');
        }
    });
    
    console.log('✓ 文件上传区域初始化完成');
}

// 检查认证状态
function checkAuthStatus() {
    console.log('🔐 检查认证状态...');
    authToken = localStorage.getItem('adminToken');
    
    if (authToken) {
        console.log('✓ 发现已保存的认证token');
        showAdminInterface();
        loadDashboard();
    } else {
        console.log('ℹ️ 未发现认证token，显示登录页面');
        showLoginInterface();
    }
}

// 显示登录界面
function showLoginInterface() {
    console.log('🔑 显示登录界面');
    if (elements.loginPage) {
        elements.loginPage.style.display = 'flex';
    }
    if (elements.adminPage) {
        elements.adminPage.style.display = 'none';
    }
}

// 显示管理界面
function showAdminInterface() {
    console.log('🎯 显示管理界面');
    if (elements.loginPage) {
        elements.loginPage.style.display = 'none';
    }
    if (elements.adminPage) {
        elements.adminPage.style.display = 'block';
        elements.adminPage.classList.remove('d-none');
    }
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 处理登录请求...');
    
    const username = elements.username.value.trim();
    const password = elements.password.value.trim();
    
    if (!username || !password) {
        showError('请输入用户名和密码');
        return;
    }
    
    showLoading('登录中...');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            console.log('✅ 登录成功');
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            hideError();
            showAdminInterface();
            loadDashboard();
        } else {
            console.log('❌ 登录失败:', data.error);
            showError(data.error || '登录失败，请检查用户名和密码');
        }
    } catch (error) {
        console.error('❌ 登录错误:', error);
        showError('网络错误，请稍后重试');
    } finally {
        hideLoading();
    }
}

// 处理退出登录
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        console.log('👋 用户退出登录');
        localStorage.removeItem('adminToken');
        authToken = null;
        showLoginInterface();
        // 清空表单
        if (elements.username) elements.username.value = '';
        if (elements.password) elements.password.value = '';
    }
}

// 切换页面部分
function switchSection(section, navElement) {
    console.log('📄 切换到部分:', section);
    currentSection = section;
    
    // 更新导航状态
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
    });
    if (navElement) {
        navElement.classList.add('active');
    }
    
    // 隐藏所有内容部分
    elements.contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示目标部分
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('✓ 成功切换到:', section);
        
        // 加载对应数据
        loadSectionData(section);
    } else {
        console.error('❌ 找不到目标部分:', section);
    }
}

// 加载部分数据
function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'games':
            loadGames();
            break;
        case 'ads':
            loadAdConfigs();
            break;
        case 'analytics':
            // 暂时不实现
            break;
        case 'settings':
            // 暂时不实现
            break;
    }
}

// 加载仪表盘数据
async function loadDashboard() {
    console.log('📊 加载仪表盘数据...');
    
    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✓ 仪表盘数据加载成功:', data);
            updateDashboardStats(data);
        } else if (response.status === 401) {
            console.log('❌ 认证失败，重新登录');
            handleAuthError();
        } else {
            console.error('❌ 加载仪表盘失败:', response.status);
        }
    } catch (error) {
        console.error('❌ 仪表盘数据错误:', error);
    }
}

// 更新仪表盘统计
function updateDashboardStats(data) {
    console.log('📈 更新仪表盘统计数据');
    
    if (data.stats) {
        updateStatCard('totalGames', data.stats.total_games || 0);
        updateStatCard('totalPlays', data.stats.total_plays || 0);
        updateStatCard('activeGames', data.stats.active_games || 0);
        updateStatCard('adClicks', data.stats.ad_clicks || 0);
    }
    
    // 更新热门游戏列表
    updatePopularGames(data.popularGames || []);
    
    // 更新最新游戏列表
    updateRecentGames(data.recentGames || []);
}

// 更新统计卡片
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = formatNumber(value);
    }
}

// 更新热门游戏
function updatePopularGames(games) {
    const container = document.getElementById('popularGames');
    if (!container) return;
    
    if (games.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">暂无游戏数据</div>';
        return;
    }
    
    container.innerHTML = games.map((game, index) => `
        <div class="d-flex justify-content-between align-items-center py-2 ${index > 0 ? 'border-top' : ''}">
            <div class="d-flex align-items-center">
                <span class="badge bg-primary me-2">${index + 1}</span>
                <div>
                    <strong>${game.title}</strong>
                    <small class="text-muted d-block">${getCategoryName(game.category)}</small>
                </div>
            </div>
            <span class="text-success fw-bold">${formatNumber(game.play_count || 0)} 次</span>
        </div>
    `).join('');
}

// 更新最新游戏
function updateRecentGames(games) {
    const container = document.getElementById('recentGames');
    if (!container) return;
    
    if (games.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">暂无游戏数据</div>';
        return;
    }
    
    container.innerHTML = games.map(game => `
        <div class="d-flex align-items-center py-2 border-bottom">
            <div class="flex-grow-1">
                <strong class="d-block">${game.title}</strong>
                <small class="text-muted">${formatDate(game.created_at)}</small>
            </div>
            <span class="badge ${game.is_active ? 'bg-success' : 'bg-secondary'}">${game.is_active ? '已上线' : '待发布'}</span>
        </div>
    `).join('');
}

// 加载游戏列表
async function loadGames() {
    console.log('🎮 加载游戏列表...');
    
    try {
        const response = await fetch('/api/admin/games', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const games = await response.json();
            console.log('✓ 游戏列表加载成功:', games.length, '个游戏');
            renderGamesTable(games);
        } else if (response.status === 401) {
            handleAuthError();
        } else {
            console.error('❌ 加载游戏列表失败');
        }
    } catch (error) {
        console.error('❌ 游戏列表错误:', error);
    }
}

// 渲染游戏表格
function renderGamesTable(games) {
    const tbody = document.getElementById('gamesTable');
    if (!tbody) return;
    
    if (games.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="fas fa-gamepad fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">还没有上传任何游戏</p>
                    <small class="text-muted">点击"上传游戏"按钮开始添加游戏</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = games.map(game => `
        <tr>
            <td class="fw-bold">${game.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    ${game.thumbnail ? `
                        <img src="${game.thumbnail}" class="game-thumbnail me-3" alt="${game.title}">
                    ` : `
                        <div class="game-thumbnail me-3 bg-light d-flex align-items-center justify-content-center">
                            <i class="fas fa-gamepad text-muted"></i>
                        </div>
                    `}
                    <div>
                        <strong class="d-block">${game.title}</strong>
                        ${game.description ? `<small class="text-muted">${game.description}</small>` : ''}
                    </div>
                </div>
            </td>
            <td><span class="badge bg-info">${getCategoryName(game.category)}</span></td>
            <td class="fw-bold text-success">${formatNumber(game.play_count || 0)}</td>
            <td>
                <span class="badge ${game.is_active ? 'bg-success' : 'bg-warning'}">
                    ${game.is_active ? '已上线' : '已下线'}
                </span>
            </td>
            <td class="text-muted">${formatDate(game.created_at)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-${game.is_active ? 'warning' : 'success'}" 
                            onclick="toggleGameStatus(${game.id}, ${game.is_active})" 
                            title="${game.is_active ? '下线游戏' : '上线游戏'}">
                        <i class="fas fa-${game.is_active ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn btn-outline-primary" 
                            onclick="editGame(${game.id})" 
                            title="编辑游戏">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" 
                            onclick="deleteGame(${game.id})" 
                            title="删除游戏">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 上传游戏
async function uploadGame() {
    console.log('📤 开始上传游戏...');
    
    const form = document.getElementById('uploadForm');
    const formData = new FormData(form);
    
    // 验证表单
    const title = formData.get('title')?.trim();
    const file = formData.get('gameFile');
    
    if (!title) {
        alert('请输入游戏名称');
        return;
    }
    
    if (!file || file.size === 0) {
        alert('请选择游戏文件');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('只支持ZIP格式的游戏文件');
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
        alert('文件大小不能超过50MB');
        return;
    }
    
    console.log('📋 上传信息:', {
        title: title,
        filename: file.name,
        size: Math.round(file.size / 1024) + 'KB',
        category: formData.get('category'),
        hasThumbnail: formData.get('thumbnail') && formData.get('thumbnail').size > 0
    });
    
    // 显示上传进度
    const uploadButton = document.querySelector('#uploadModal .btn-primary');
    const originalText = uploadButton.innerHTML;
    uploadButton.disabled = true;
    uploadButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>上传中...';
    
    try {
        const response = await fetch('/api/admin/games/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        console.log('📡 服务器响应状态:', response.status);
        
        const data = await response.json();
        console.log('📡 服务器响应数据:', data);
        
        if (response.ok && data.success) {
            console.log('✅ 游戏上传成功!');
            showSuccessMessage('游戏上传成功！');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
            modal.hide();
            
            // 重置表单
            form.reset();
            document.getElementById('fileInfo').classList.add('d-none');
            document.getElementById('uploadArea').style.borderColor = '';
            document.getElementById('uploadArea').style.backgroundColor = '';
            
            // 重新加载游戏列表
            if (currentSection === 'games') {
                loadGames();
            }
            // 如果在仪表盘页面，也更新数据
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        } else {
            console.log('❌ 游戏上传失败:', data.error);
            let errorMsg = data.error || '上传失败，请重试';
            
            // 提供更友好的错误信息
            if (errorMsg.includes('ZIP文件中必须包含index.html文件')) {
                errorMsg += '\n\n提示：\n1. 确保ZIP文件根目录或子目录中有index.html文件\n2. 检查文件名是否正确（大小写不敏感）\n3. 确保这是一个HTML5游戏项目';
            }
            
            alert(errorMsg);
        }
    } catch (error) {
        console.error('❌ 上传错误:', error);
        alert('上传时发生网络错误，请检查网络连接后重试');
    } finally {
        // 恢复按钮状态
        uploadButton.disabled = false;
        uploadButton.innerHTML = originalText;
    }
}

// 切换游戏状态
async function toggleGameStatus(gameId, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? '上线' : '下线';
    
    if (!confirm(`确定要${action}这个游戏吗？`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/games/${gameId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: newStatus })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`✅ 游戏${action}成功`);
            showSuccessMessage(`游戏${action}成功`);
            loadGames(); // 重新加载列表
        } else {
            console.log(`❌ 游戏${action}失败:`, data.error);
            alert(data.error || `${action}失败，请重试`);
        }
    } catch (error) {
        console.error(`❌ ${action}游戏错误:`, error);
        alert(`${action}时发生错误，请重试`);
    }
}

// 编辑游戏
function editGame(gameId) {
    console.log('✏️ 编辑游戏:', gameId);
    // TODO: 实现编辑功能
    alert('编辑功能开发中，敬请期待...');
}

// 删除游戏
async function deleteGame(gameId) {
    if (!confirm('确定要删除这个游戏吗？\n删除后无法恢复，请谨慎操作！')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/games/${gameId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ 游戏删除成功');
            showSuccessMessage('游戏删除成功');
            loadGames(); // 重新加载列表
        } else {
            console.log('❌ 游戏删除失败:', data.error);
            alert(data.error || '删除失败，请重试');
        }
    } catch (error) {
        console.error('❌ 删除游戏错误:', error);
        alert('删除时发生错误，请重试');
    }
}

// 加载广告配置
async function loadAdConfigs() {
    console.log('📢 加载广告配置...');
    // TODO: 实现广告配置加载
}

// 保存广告配置
async function saveAdConfig(position, form) {
    console.log('💾 保存广告配置:', position);
    
    const formData = new FormData(form);
    const adCode = formData.get('ad_code');
    const enabled = formData.get('enabled') === 'on';
    
    try {
        const response = await fetch('/api/admin/ad-configs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                position: position,
                ad_code: adCode || '',
                enabled: enabled
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ 广告配置保存成功');
            showSuccessMessage('广告配置保存成功！');
        } else {
            console.log('❌ 广告配置保存失败:', data.error);
            alert(data.error || '保存失败，请重试');
        }
    } catch (error) {
        console.error('❌ 保存广告配置错误:', error);
        alert('保存时发生网络错误，请重试');
    }
}

// 工具函数
function formatNumber(num) {
    return num.toLocaleString();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCategoryName(category) {
    const categoryMap = {
        'casual': '休闲',
        'puzzle': '益智',
        'action': '动作',
        'arcade': '街机'
    };
    return categoryMap[category] || category;
}

function showError(message) {
    if (elements.loginError) {
        elements.loginError.textContent = message;
        elements.loginError.classList.remove('d-none');
    }
}

function hideError() {
    if (elements.loginError) {
        elements.loginError.classList.add('d-none');
    }
}

function showLoading(message) {
    // TODO: 实现加载状态显示
}

function hideLoading() {
    // TODO: 实现加载状态隐藏
}

function showSuccessMessage(message) {
    // 简单的成功提示
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

function handleAuthError() {
    console.log('❌ 认证失败，清除token');
    localStorage.removeItem('adminToken');
    authToken = null;
    showLoginInterface();
}

// 调试功能
window.adminDebug = {
    showAdmin: () => showAdminInterface(),
    showLogin: () => showLoginInterface(),
    getToken: () => authToken,
    loadDashboard: () => loadDashboard(),
    loadGames: () => loadGames()
};

console.log('🎮 乐玩小游戏管理后台已加载完成！');
console.log('💡 调试命令: adminDebug.showAdmin(), adminDebug.loadDashboard()'); 