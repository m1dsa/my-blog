// 全局变量
let isAdmin = false;
let posts = {
    musings: [],
    observations: [],
    thoughts: []
};
let saveTimer = null;

// 管理员密码（在实际使用中应该使用更安全的方式）
const ADMIN_PASSWORD = 'admin123';

// 本地存储键名
const STORAGE_KEY = 'personal_blog_posts';
const ADMIN_KEY = 'personal_blog_admin';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadPostsFromStorage();
    loadAdminState();
    setupEventListeners();
    setupAutoSave();
});

// 设置事件监听器
function setupEventListeners() {
    // 管理按钮点击
    document.getElementById('adminBtn').addEventListener('click', toggleAdminPanel);
    
    // 编辑表单提交
    document.getElementById('editForm').addEventListener('submit', savePost);
    
    // 点击模态框外部关闭
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Ctrl+S 保存
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (isAdmin) {
                saveToStorage();
                showSaveIndicator();
            }
        }
        // ESC 关闭弹窗
        if (e.key === 'Escape') {
            closeEditModal();
        }
    });
}

// 设置自动保存
function setupAutoSave() {
    // 监听所有输入变化
    document.addEventListener('input', function(e) {
        if (isAdmin && (e.target.id === 'postTitle' || e.target.id === 'postContent')) {
            // 延迟保存，避免频繁操作
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                autoSaveCurrentPost();
            }, 1000); // 1秒后自动保存
        }
    });
}

// 自动保存当前编辑的文章
function autoSaveCurrentPost() {
    const postId = document.getElementById('editPostId').value;
    const category = document.getElementById('editCategory').value;
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!title && !content) return; // 如果都为空就不保存
    
    // 保存到草稿
    const draftKey = `draft_${category}_${postId || 'new'}`;
    const draft = {
        title: title,
        content: content,
        category: category,
        postId: postId,
        timestamp: Date.now()
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
    showSaveIndicator('草稿已保存');
}

// 加载草稿
function loadDraft(category, postId = '') {
    const draftKey = `draft_${category}_${postId || 'new'}`;
    const draftData = localStorage.getItem(draftKey);
    if (draftData) {
        const draft = JSON.parse(draftData);
        document.getElementById('postTitle').value = draft.title || '';
        document.getElementById('postContent').value = draft.content || '';
        return true;
    }
    return false;
}

// 清除草稿
function clearDraft(category, postId = '') {
    const draftKey = `draft_${category}_${postId || 'new'}`;
    localStorage.removeItem(draftKey);
}

// 显示保存指示器
function showSaveIndicator(text = '已自动保存') {
    const indicator = document.getElementById('saveIndicator');
    const textEl = indicator.querySelector('.save-text');
    textEl.textContent = text;
    indicator.classList.remove('hidden');
    
    setTimeout(() => {
        indicator.classList.add('hidden');
    }, 2000);
}

// 切换管理员面板
function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (isAdmin) {
        // 如果已经是管理员，退出管理模式
        logout();
    } else {
        // 显示登录面板
        panel.classList.toggle('hidden');
    }
}

// 管理员登录
function login() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('adminPanel').classList.add('hidden');
        document.getElementById('adminBtn').textContent = '退出管理';
        document.getElementById('adminPassword').value = '';
        toggleAdminMode();
        saveAdminState();
        alert('登录成功！现在可以编辑文章了。');
    } else {
        alert('密码错误！');
    }
}

// 管理员登出
function logout() {
    isAdmin = false;
    document.getElementById('adminBtn').textContent = '管理';
    toggleAdminMode();
    clearAdminState();
    // 清除所有草稿
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('draft_')) {
            localStorage.removeItem(key);
        }
    });
}

// 保存管理员状态
function saveAdminState() {
    localStorage.setItem(ADMIN_KEY, 'true');
}

// 清除管理员状态
function clearAdminState() {
    localStorage.removeItem(ADMIN_KEY);
}

// 加载管理员状态
function loadAdminState() {
    const adminState = localStorage.getItem(ADMIN_KEY);
    if (adminState === 'true') {
        isAdmin = true;
        document.getElementById('adminBtn').textContent = '退出管理';
        toggleAdminMode();
    }
}

// 切换管理模式
function toggleAdminMode() {
    const addBtns = document.querySelectorAll('.add-btn');
    const deleteAllBtns = document.querySelectorAll('.delete-all-btn');
    const actionBtns = document.querySelectorAll('.post-actions');
    
    if (isAdmin) {
        addBtns.forEach(btn => btn.classList.remove('hidden'));
        deleteAllBtns.forEach(btn => btn.classList.remove('hidden'));
        actionBtns.forEach(btn => btn.style.display = 'flex');
    } else {
        addBtns.forEach(btn => btn.classList.add('hidden'));
        deleteAllBtns.forEach(btn => btn.classList.add('hidden'));
        actionBtns.forEach(btn => btn.style.display = 'none');
    }
}

// 从本地存储加载文章数据
function loadPostsFromStorage() {
    const savedPosts = localStorage.getItem(STORAGE_KEY);
    if (savedPosts) {
        posts = JSON.parse(savedPosts);
    } else {
        // 如果没有保存的数据，使用示例数据
        posts = {
            musings: [
                {
                    id: 1,
                    title: '关于慢生活的思考',
                    content: '在这个快节奏的世界里，我越来越觉得慢下来是一种奢侈。今天早上泡茶的时候，看着茶叶在水中慢慢舒展，突然意识到生活的美好往往藏在这些被我们忽略的细节中。',
                    date: '2024-03-20'
                },
                {
                    id: 2,
                    title: '平凡中的不平凡',
                    content: '昨天路过小区花园，看到一位老爷爷在认真地修剪花草。他专注的神情让我想到，也许真正的幸福就是能在平凡的事情中找到意义和乐趣。',
                    date: '2024-03-18'
                }
            ],
            observations: [
                {
                    id: 3,
                    title: '数字化时代的孤独',
                    content: '地铁上每个人都在看手机，明明距离很近却彼此陌生。我们比以往任何时候都更容易联系，却也更容易感到孤独。这种矛盾现象值得我们深思。',
                    date: '2024-03-19'
                },
                {
                    id: 4,
                    title: '城市中的自然力量',
                    content: '今天看到墙缝里长出的小草，顽强地向阳光伸展。大自然的生命力总是让我惊叹，即使在最恶劣的环境中，生命也能找到出路。',
                    date: '2024-03-17'
                }
            ],
            thoughts: [
                {
                    id: 5,
                    title: '重新定义成功',
                    content: '成功不应该只用金钱和地位来衡量。真正的成功可能是内心的平静，是与他人建立真诚的连接，是为这个世界带来一点点正面的改变。',
                    date: '2024-03-21'
                },
                {
                    id: 6,
                    title: '提问的艺术',
                    content: '好的问题比标准答案更有价值。它们开启对话，激发思考，让我们看到新的可能性。学会提出好问题，也许是我们需要培养的最重要的能力之一。',
                    date: '2024-03-16'
                }
            ]
        };
        // 保存初始数据
        saveToStorage();
    }
    
    renderAllPosts();
}

// 保存数据到本地存储
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// 渲染所有文章
function renderAllPosts() {
    Object.keys(posts).forEach(category => {
        renderPosts(category);
    });
}

// 渲染指定分类的文章
function renderPosts(category) {
    const container = document.getElementById(`${category}-posts`);
    container.innerHTML = '';
    
    posts[category].forEach(post => {
        const postElement = createPostElement(post, category);
        container.appendChild(postElement);
    });
}

// 创建文章元素
function createPostElement(post, category) {
    const article = document.createElement('article');
    article.className = 'post';
    
    article.innerHTML = `
        <div class="post-header">
            <h3>${post.title}</h3>
            <div class="post-actions" style="display: ${isAdmin ? 'flex' : 'none'};">
                <button class="action-btn edit-btn" onclick="editPost('${category}', ${post.id})">编辑</button>
                <button class="action-btn delete-btn" onclick="deletePost('${category}', ${post.id})">删除</button>
            </div>
        </div>
        <div class="post-meta">${post.date}</div>
        <div class="post-content">${post.content}</div>
    `;
    
    return article;
}

// 添加新文章
function addPost(category) {
    if (!isAdmin) return;
    
    document.getElementById('modalTitle').textContent = '新增文章';
    document.getElementById('editPostId').value = '';
    document.getElementById('editCategory').value = category;
    
    // 尝试加载草稿
    const hasDraft = loadDraft(category, '');
    if (!hasDraft) {
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
    }
    
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('postTitle').focus();
}

// 编辑文章
function editPost(category, postId) {
    if (!isAdmin) return;
    
    const post = posts[category].find(p => p.id === postId);
    if (!post) return;
    
    document.getElementById('modalTitle').textContent = '编辑文章';
    document.getElementById('editPostId').value = postId;
    document.getElementById('editCategory').value = category;
    
    // 尝试加载草稿，如果没有草稿则加载原文章
    const hasDraft = loadDraft(category, postId);
    if (!hasDraft) {
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postContent').value = post.content;
    }
    
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('postTitle').focus();
}

// 删除文章
function deletePost(category, postId) {
    if (!isAdmin) return;
    
    if (confirm('确定要删除这篇文章吗？')) {
        posts[category] = posts[category].filter(p => p.id !== postId);
        renderPosts(category);
        saveToStorage();
        clearDraft(category, postId);
        showSaveIndicator('文章已删除');
    }
}

// 保存文章
function savePost(e) {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    const postId = document.getElementById('editPostId').value;
    const category = document.getElementById('editCategory').value;
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!title || !content) {
        alert('标题和内容不能为空！');
        return;
    }
    
    const now = new Date();
    const dateString = now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(now.getDate()).padStart(2, '0');
    
    if (postId) {
        // 编辑现有文章
        const post = posts[category].find(p => p.id === parseInt(postId));
        if (post) {
            post.title = title;
            post.content = content;
        }
        clearDraft(category, postId);
    } else {
        // 添加新文章
        const newId = Math.max(...posts[category].map(p => p.id), 0) + 1;
        posts[category].unshift({
            id: newId,
            title: title,
            content: content,
            date: dateString
        });
        clearDraft(category, '');
    }
    
    renderPosts(category);
    saveToStorage();
    closeEditModal();
    showSaveIndicator('文章已保存');
}

// 关闭编辑弹窗
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// 删除指定分类的所有文章
function deleteAllPosts(category) {
    if (!isAdmin) return;
    
    const categoryNames = {
        'musings': '思考感悟',
        'observations': '世界观察', 
        'thoughts': '思维输出'
    };
    
    const categoryName = categoryNames[category] || category;
    const postCount = posts[category].length;
    
    if (postCount === 0) {
        alert(`${categoryName}栏目中没有文章。`);
        return;
    }
    
    if (confirm(`确定要删除${categoryName}栏目中的所有 ${postCount} 篇文章吗？此操作不可恢复！`)) {
        posts[category] = [];
        renderPosts(category);
        saveToStorage();
        showSaveIndicator(`已清空${categoryName}栏目`);
        
        // 清除该分类的所有草稿
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(`draft_${category}_`)) {
                localStorage.removeItem(key);
            }
        });
    }
}

// 工具函数：格式化日期
function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-CN');
}