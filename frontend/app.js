document.addEventListener('DOMContentLoaded', () => {
    const nodesInput = document.getElementById('nodesInput');
    const templateInput = document.getElementById('templateInput');
    const remoteTemplateUrl = document.getElementById('remoteTemplateUrl');
    const remoteTemplateSection = document.getElementById('remoteTemplateSection');
    const loadRemoteBtn = document.getElementById('loadRemoteBtn');
    const generateBtn = document.getElementById('generateBtn');
    const previewBtn = document.getElementById('previewBtn');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const previewSection = document.getElementById('preview');
    const previewContent = document.getElementById('previewContent');
    const previewProxyCount = document.getElementById('previewProxyCount');
    const resultSection = document.getElementById('result');
    const errorSection = document.getElementById('error');
    const subscriptionUrl = document.getElementById('subscriptionUrl');
    const proxyCount = document.getElementById('proxyCount');
    const errorMessage = document.getElementById('errorMessage');
    const copyBtn = document.getElementById('copyBtn');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const subscriptionName = document.getElementById('subscriptionName');
    const subscriptionList = document.getElementById('subscriptionList');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const deleteModal = document.getElementById('deleteModal');
    const deleteSubName = document.getElementById('deleteSubName');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    const DEFAULT_REMOTE_URL = 'https://raw.githubusercontent.com/242282218/clash-/add_full/proxy.ini';
    let currentTemplate = '';
    let deleteTargetId = null;

    remoteTemplateUrl.value = DEFAULT_REMOTE_URL;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabId = btn.dataset.tab + 'Tab';
            document.getElementById(tabId).classList.add('active');
            
            if (btn.dataset.tab === 'manage') {
                loadSubscriptionList();
            }
        });
    });

    const templateRadios = document.querySelectorAll('input[name="templateType"]');
    templateRadios.forEach(radio => {
        radio.addEventListener('change', async (e) => {
            const type = e.target.value;
            if (type === 'remote') {
                remoteTemplateSection.style.display = 'block';
                templateInput.readOnly = true;
                await loadRemoteTemplate(remoteTemplateUrl.value || DEFAULT_REMOTE_URL);
            } else if (type === 'local') {
                remoteTemplateSection.style.display = 'none';
                templateInput.readOnly = true;
                await loadLocalTemplate();
            } else {
                remoteTemplateSection.style.display = 'none';
                templateInput.readOnly = false;
                templateInput.value = '';
                templateInput.focus();
            }
        });
    });

    async function loadRemoteTemplate(url) {
        if (!url) {
            showError('请输入远程模板 URL');
            return;
        }

        showLoading(loadRemoteBtn, '加载中...');
        try {
            const response = await fetch('/api/template/default?url=' + encodeURIComponent(url));
            if (!response.ok) {
                throw new Error('加载失败');
            }
            const content = await response.text();
            templateInput.value = content;
            currentTemplate = content;
            hideError();
        } catch (error) {
            showError('加载远程模板失败: ' + error.message);
        } finally {
            hideLoading(loadRemoteBtn);
        }
    }

    async function loadLocalTemplate() {
        try {
            const response = await fetch('/clash.ini');
            if (!response.ok) {
                throw new Error('加载失败');
            }
            const content = await response.text();
            templateInput.value = content;
            currentTemplate = content;
            hideError();
        } catch (error) {
            showError('加载本地模板失败: ' + error.message);
        }
    }

    loadRemoteBtn.addEventListener('click', async () => {
        await loadRemoteTemplate(remoteTemplateUrl.value);
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const url = btn.dataset.url;
            remoteTemplateUrl.value = url;
            if (url.startsWith('http')) {
                await loadRemoteTemplate(url);
            } else {
                await loadLocalTemplate();
            }
        });
    });

    async function getTemplate() {
        const templateType = document.querySelector('input[name="templateType"]:checked').value;
        
        if (templateType === 'custom') {
            return templateInput.value.trim();
        }
        
        if (currentTemplate) {
            return currentTemplate;
        }

        if (templateType === 'remote') {
            await loadRemoteTemplate(remoteTemplateUrl.value || DEFAULT_REMOTE_URL);
        } else {
            await loadLocalTemplate();
        }
        
        return currentTemplate;
    }

    function showLoading(btn, text) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.textContent = text;
    }

    function hideLoading(btn) {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || '加载';
    }

    previewBtn.addEventListener('click', async () => {
        const nodes = nodesInput.value.trim();
        if (!nodes) {
            showError('请输入节点链接');
            return;
        }

        const template = await getTemplate();
        if (!template) {
            showError('请加载或输入配置模板');
            return;
        }

        showLoading(previewBtn, '预览中...');
        hideResult();
        hidePreview();

        try {
            const response = await fetch('/api/sub/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nodes, template })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                previewProxyCount.textContent = data.proxyCount;
                previewContent.textContent = data.config;
                previewSection.style.display = 'block';
                previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                showError(data.error || '预览失败');
            }
        } catch (error) {
            showError('网络错误: ' + error.message);
        } finally {
            hideLoading(previewBtn);
        }
    });

    closePreviewBtn.addEventListener('click', () => {
        hidePreview();
    });

    generateBtn.addEventListener('click', async () => {
        const nodes = nodesInput.value.trim();
        if (!nodes) {
            showError('请输入节点链接');
            return;
        }

        const template = await getTemplate();
        if (!template) {
            showError('请加载或输入配置模板');
            return;
        }

        const name = subscriptionName.value.trim() || undefined;

        showLoading(generateBtn, '生成中...');
        hideResult();
        hidePreview();

        try {
            const response = await fetch('/api/sub/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nodes, template, name })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showResult(data.subscriptionUrl, data.proxyCount);
            } else {
                showError(data.error || '生成失败');
            }
        } catch (error) {
            showError('网络错误: ' + error.message);
        } finally {
            hideLoading(generateBtn);
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(subscriptionUrl.value);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '已复制!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (error) {
            subscriptionUrl.select();
            document.execCommand('copy');
            copyBtn.textContent = '已复制!';
            setTimeout(() => {
                copyBtn.textContent = '复制';
            }, 2000);
        }
    });

    async function loadSubscriptionList() {
        try {
            const response = await fetch('/api/sub/list');
            const data = await response.json();

            if (data.success && data.configs.length > 0) {
                subscriptionList.innerHTML = data.configs.map(config => `
                    <div class="subscription-item" data-id="${config.id}">
                        <div class="subscription-info">
                            <h3>${escapeHtml(config.name)}</h3>
                            <p>节点数: ${config.proxyCount} | 创建: ${formatDate(config.createdAt)}</p>
                        </div>
                        <div class="subscription-actions">
                            <button class="btn-copy-url" data-url="${window.location.origin}/api/sub/${config.id}">复制链接</button>
                            <button class="btn-regenerate" data-id="${config.id}">更新</button>
                            <button class="btn-delete" data-id="${config.id}" data-name="${escapeHtml(config.name)}">删除</button>
                        </div>
                    </div>
                `).join('');

                subscriptionList.querySelectorAll('.btn-copy-url').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        try {
                            await navigator.clipboard.writeText(btn.dataset.url);
                            const originalText = btn.textContent;
                            btn.textContent = '已复制!';
                            setTimeout(() => btn.textContent = originalText, 2000);
                        } catch (error) {
                            console.error('复制失败:', error);
                        }
                    });
                });

                subscriptionList.querySelectorAll('.btn-regenerate').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const id = btn.dataset.id;
                        btn.disabled = true;
                        btn.textContent = '更新中...';
                        try {
                            const response = await fetch(`/api/sub/${id}/regenerate`, {
                                method: 'POST'
                            });
                            const data = await response.json();
                            if (data.success) {
                                btn.textContent = '已更新!';
                                setTimeout(() => {
                                    btn.textContent = '更新';
                                    btn.disabled = false;
                                }, 2000);
                            } else {
                                throw new Error(data.error);
                            }
                        } catch (error) {
                            btn.textContent = '失败';
                            setTimeout(() => {
                                btn.textContent = '更新';
                                btn.disabled = false;
                            }, 2000);
                        }
                    });
                });

                subscriptionList.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', () => {
                        deleteTargetId = btn.dataset.id;
                        deleteSubName.textContent = btn.dataset.name;
                        deleteModal.style.display = 'flex';
                    });
                });
            } else {
                subscriptionList.innerHTML = '<p class="empty-hint">暂无保存的订阅</p>';
            }
        } catch (error) {
            subscriptionList.innerHTML = '<p class="error-hint">加载订阅列表失败</p>';
        }
    }

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        deleteTargetId = null;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!deleteTargetId) return;

        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = '删除中...';

        try {
            const response = await fetch(`/api/sub/${deleteTargetId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                deleteModal.style.display = 'none';
                deleteTargetId = null;
                loadSubscriptionList();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            alert('删除失败: ' + error.message);
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = '删除';
        }
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function showResult(url, count) {
        subscriptionUrl.value = url;
        proxyCount.textContent = count;
        resultSection.style.display = 'block';
        errorSection.style.display = 'none';
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorSection.style.display = 'block';
        resultSection.style.display = 'none';
        errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideError() {
        errorSection.style.display = 'none';
    }

    function hideResult() {
        resultSection.style.display = 'none';
    }

    function hidePreview() {
        previewSection.style.display = 'none';
    }

    (async () => {
        const templateType = document.querySelector('input[name="templateType"]:checked').value;
        if (templateType === 'remote') {
            await loadRemoteTemplate(DEFAULT_REMOTE_URL);
        }
    })();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === '1') {
        nodesInput.value = 'vmess://eyJhZGQiOiJleGFtcGxlLmNvbSIsInBvcnQiOiI0NDMiLCJpZCI6InV1aWQiLCJwcyI6IuekuuS+iyJ9';
    }
});
