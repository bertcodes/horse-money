// ==================== 存储管理 ====================

// 保存数据到本地存储
function saveData(data) {
    try {
        localStorage.setItem('horseMoneyData', JSON.stringify(data));
    } catch (e) {
        console.log('保存数据失败：' + e.message);
    }
}

// 从本地存储加载数据
function loadData() {
    try {
        var data = localStorage.getItem('horseMoneyData');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.log('加载数据失败：' + e.message);
        return null;
    }
}

// 保存历史记录
function saveHistory(history) {
    try {
        localStorage.setItem('horseMoneyHistory', JSON.stringify(history));
    } catch (e) {
        console.log('保存历史记录失败：' + e.message);
    }
}

// 加载历史记录
function loadHistory() {
    try {
        var data = localStorage.getItem('horseMoneyHistory');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.log('加载历史记录失败：' + e.message);
        return [];
    }
}

// 添加历史记录
function addHistory(record) {
    var history = loadHistory();
    record.id = Date.now();
    record.time = new Date().toLocaleString('zh-CN');
    history.unshift(record);
    // 最多保存50条
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    saveHistory(history);
    return history;
}

// 删除历史记录
function deleteHistory(id) {
    var history = loadHistory();
    history = history.filter(function(item) { return item.id !== id; });
    saveHistory(history);
    renderHistory();
}

// ==================== Gist 同步 ====================

var GIST_TOKEN_KEY = 'horseMoneyGistToken';
var GIST_ID_KEY = 'horseMoneyGistId';
var GIST_FILENAME = 'horse-money-data.json';

// 获取 Gist Token
function getGistToken() {
    return localStorage.getItem(GIST_TOKEN_KEY);
}

// 保存 Gist Token
function setGistToken(token) {
    localStorage.setItem(GIST_TOKEN_KEY, token);
}

// 获取 Gist ID
function getGistId() {
    return localStorage.getItem(GIST_ID_KEY);
}

// 保存 Gist ID
function setGistId(id) {
    localStorage.setItem(GIST_ID_KEY, id);
}

// 同步到 Gist
function syncToGist() {
    var token = getGistToken();
    if (!token) {
        alert('请先配置 GitHub Token');
        openSyncSettings();
        return;
    }

    var history = loadHistory();
    var gistId = getGistId();
    var url, method, body;

    if (gistId) {
        // 更新现有 Gist
        url = 'https://api.github.com/gists/' + gistId;
        method = 'PATCH';
        body = {
            description: 'Horse Money 计算历史记录',
            files: {}
        };
        body.files[GIST_FILENAME] = {
            content: JSON.stringify(history, null, 2)
        };
    } else {
        // 创建新 Gist
        url = 'https://api.github.com/gists';
        method = 'POST';
        body = {
            description: 'Horse Money 计算历史记录',
            public: false,
            files: {}
        };
        body.files[GIST_FILENAME] = {
            content: JSON.stringify(history, null, 2)
        };
    }

    fetch(url, {
        method: method,
        headers: {
            'Authorization': 'token ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('同步失败: ' + response.status);
        }
        return response.json();
    })
    .then(function(data) {
        setGistId(data.id);
        alert('同步成功！');
    })
    .catch(function(error) {
        alert('同步失败: ' + error.message);
    });
}

// 从 Gist 恢复
function restoreFromGist() {
    var token = getGistToken();
    var gistId = getGistId();

    if (!token) {
        alert('请先配置 GitHub Token');
        openSyncSettings();
        return;
    }

    if (!gistId) {
        alert('没有找到 Gist 记录，请先同步');
        return;
    }

    fetch('https://api.github.com/gists/' + gistId, {
        headers: {
            'Authorization': 'token ' + token
        }
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('恢复失败: ' + response.status);
        }
        return response.json();
    })
    .then(function(data) {
        var file = data.files[GIST_FILENAME];
        if (file) {
            var history = JSON.parse(file.content);
            saveHistory(history);
            renderHistory();
            alert('恢复成功！共恢复 ' + history.length + ' 条记录');
        } else {
            alert('Gist 中没有找到数据文件');
        }
    })
    .catch(function(error) {
        alert('恢复失败: ' + error.message);
    });
}

// ==================== 计算逻辑 ====================

// 保存当前计算结果到历史记录
function saveCalculation(result) {
    var history = addHistory(result);
    renderHistory();
}

// 暴露到全局作用域
window.calculate = function() {
    try {
        var neckline = parseFloat(document.getElementById('neckline').value);
        var headPrice = parseFloat(document.getElementById('headPrice').value);
        var customRatio = parseFloat(document.getElementById('ratioInput').value) || 15;

        if (isNaN(neckline) || isNaN(headPrice)) {
            alert('请输入有效的颈线位和头部价格！');
            return;
        }

        // 目标价格 = 颈线位 + 颈线位 - 头部价格
        var targetPrice = neckline + neckline - headPrice;
        // 买入价格 = 颈线位 * 1.03
        var buyPrice = neckline * 1.03;
        // 止损价格 = 颈线位
        var stopPrice = neckline;
        // 收益比 = (目标价 - 止损价) ÷ (买入价 - 止损价)
        var ratio = (targetPrice - stopPrice) / (buyPrice - stopPrice);

        var result = {
            neckline: neckline,
            headPrice: headPrice,
            targetPrice: targetPrice,
            buyPrice: buyPrice,
            stopPrice: stopPrice,
            ratio: ratio,
            customRatio: customRatio,
            type: 'standard'
        };

        document.getElementById('targetPrice').textContent = targetPrice.toFixed(3);
        document.getElementById('buyPrice').textContent = buyPrice.toFixed(3);
        document.getElementById('stopPrice').textContent = stopPrice.toFixed(3);
        document.getElementById('ratio').textContent = ratio.toFixed(3);

        // 保存当前数据和历史记录
        saveData(result);
        saveCalculation(result);
    } catch (e) {
        alert('计算出错：' + e.message);
    }
};

window.setRatio15 = function() {
    try {
        var neckline = parseFloat(document.getElementById('neckline').value);
        var headPrice = parseFloat(document.getElementById('headPrice').value);
        var customRatio = parseFloat(document.getElementById('ratioInput').value) || 15;

        if (isNaN(neckline) || isNaN(headPrice)) {
            alert('请输入有效的颈线位和头部价格！');
            return;
        }

        // 目标价格 = 颈线位 + 颈线位 - 头部价格
        var targetPrice = neckline + neckline - headPrice;
        // 止损价格 = 颈线位
        var stopPrice = neckline;
        // 根据自定义收益比反推买入价格
        // R = (目标价 - 止损价) ÷ (买入价 - 止损价)
        // R * (买入价 - 止损价) = 目标价 - 止损价
        // R * 买入价 - R * 止损价 = 目标价 - 止损价
        // R * 买入价 = 目标价 - 止损价 + R * 止损价
        // R * 买入价 = 目标价 + (R - 1) * 止损价
        // 买入价 = (目标价 + (R - 1) * 止损价) / R
        var buyPrice = (targetPrice + (customRatio - 1) * stopPrice) / customRatio;

        var result = {
            neckline: neckline,
            headPrice: headPrice,
            targetPrice: targetPrice,
            buyPrice: buyPrice,
            stopPrice: stopPrice,
            ratio: customRatio,
            customRatio: customRatio,
            type: 'custom'
        };

        document.getElementById('targetPrice').textContent = targetPrice.toFixed(3);
        document.getElementById('buyPrice').textContent = buyPrice.toFixed(3);
        document.getElementById('stopPrice').textContent = stopPrice.toFixed(3);
        document.getElementById('ratio').textContent = customRatio.toFixed(3);

        // 保存当前数据和历史记录
        saveData(result);
        saveCalculation(result);
    } catch (e) {
        alert('计算出错：' + e.message);
    }
};

// ==================== UI 交互 ====================

// 打开历史记录
window.openHistory = function() {
    renderHistory();
    document.getElementById('historyPopup').classList.add('active');
};

// 关闭历史记录
window.closeHistory = function(event) {
    if (!event || event.target.id === 'historyPopup') {
        document.getElementById('historyPopup').classList.remove('active');
    }
};

// 渲染历史记录
function renderHistory() {
    var history = loadHistory();
    var container = document.getElementById('historyList');

    if (history.length === 0) {
        container.innerHTML = '<div class="empty-tip">暂无历史记录</div>';
        return;
    }

    container.innerHTML = history.map(function(item) {
        return '<div class="history-item">' +
            '<div class="history-header">' +
                '<span class="history-time">' + item.time + '</span>' +
                '<button class="history-delete" onclick="deleteHistory(' + item.id + ')">删除</button>' +
            '</div>' +
            '<div class="history-data">' +
                '<div><span class="history-label">颈线位:</span> <span class="history-value">' + item.neckline.toFixed(3) + '</span></div>' +
                '<div><span class="history-label">头部价格:</span> <span class="history-value">' + item.headPrice.toFixed(3) + '</span></div>' +
                '<div><span class="history-label">目标价:</span> <span class="history-value target">' + item.targetPrice.toFixed(3) + '</span></div>' +
                '<div><span class="history-label">买入价:</span> <span class="history-value buy">' + item.buyPrice.toFixed(3) + '</span></div>' +
                '<div><span class="history-label">止损价:</span> <span class="history-value stop">' + item.stopPrice.toFixed(3) + '</span></div>' +
                '<div><span class="history-label">收益比:</span> <span class="history-value">' + item.ratio.toFixed(3) + '</span></div>' +
            '</div>' +
        '</div>';
    }).join('');
}

// 打开 Gist 同步设置
window.openSyncSettings = function() {
    var token = getGistToken();
    var gistId = getGistId();
    var tokenSection = document.getElementById('tokenSection');
    var tokenSaved = document.getElementById('tokenSaved');

    if (token) {
        tokenSection.style.display = 'none';
        tokenSaved.style.display = 'block';
        document.getElementById('tokenDisplay').textContent = token.substring(0, 4) + '••••••••' + token.substring(token.length - 4);
        document.getElementById('currentGistId').value = gistId || '';
    } else {
        tokenSection.style.display = 'block';
        tokenSaved.style.display = 'none';
        document.getElementById('githubToken').value = '';
        document.getElementById('gistId').value = gistId || '';
    }

    document.getElementById('syncPopup').classList.add('active');
};

// 关闭 Gist 同步设置
window.closeSyncSettings = function(event) {
    if (!event || event.target.id === 'syncPopup') {
        document.getElementById('syncPopup').classList.remove('active');
    }
};

// 保存 Token 和 Gist ID
window.saveToken = function() {
    var token = document.getElementById('githubToken').value.trim();
    var gistIdInput = document.getElementById('gistId').value.trim();

    if (!token) {
        alert('请输入 GitHub Token');
        return;
    }

    setGistToken(token);
    if (gistIdInput) {
        setGistId(gistIdInput);
    }

    document.getElementById('githubToken').value = '';
    document.getElementById('gistId').value = '';
    openSyncSettings();
    alert('配置已保存');
};

// 删除 Token
window.deleteToken = function() {
    if (confirm('确定要删除已保存的配置吗？')) {
        localStorage.removeItem(GIST_TOKEN_KEY);
        localStorage.removeItem(GIST_ID_KEY);
        openSyncSettings();
        alert('配置已删除');
    }
};

// ==================== 页面初始化 ====================

// 页面加载完成后绑定事件并恢复数据
window.addEventListener('load', function() {
    var calculateBtn = document.getElementById('calculateBtn');
    var ratioBtn = document.getElementById('ratioBtn');
    var historyBtn = document.getElementById('historyBtn');
    var syncBtn = document.getElementById('syncBtn');
    var restoreBtn = document.getElementById('restoreBtn');
    var settingsBtn = document.getElementById('settingsBtn');
    var saveTokenBtn = document.getElementById('saveTokenBtn');
    var deleteTokenBtn = document.getElementById('deleteTokenBtn');

    if (calculateBtn) {
        if (calculateBtn.addEventListener) {
            calculateBtn.addEventListener('click', window.calculate);
        } else if (calculateBtn.attachEvent) {
            calculateBtn.attachEvent('onclick', window.calculate);
        }
    }

    if (ratioBtn) {
        if (ratioBtn.addEventListener) {
            ratioBtn.addEventListener('click', window.setRatio15);
        } else if (ratioBtn.attachEvent) {
            ratioBtn.attachEvent('onclick', window.setRatio15);
        }
    }

    if (historyBtn) {
        if (historyBtn.addEventListener) {
            historyBtn.addEventListener('click', window.openHistory);
        } else if (historyBtn.attachEvent) {
            historyBtn.attachEvent('onclick', window.openHistory);
        }
    }

    if (syncBtn) {
        if (syncBtn.addEventListener) {
            syncBtn.addEventListener('click', syncToGist);
        } else if (syncBtn.attachEvent) {
            syncBtn.attachEvent('onclick', syncToGist);
        }
    }

    if (restoreBtn) {
        if (restoreBtn.addEventListener) {
            restoreBtn.addEventListener('click', restoreFromGist);
        } else if (restoreBtn.attachEvent) {
            restoreBtn.attachEvent('onclick', restoreFromGist);
        }
    }

    if (settingsBtn) {
        if (settingsBtn.addEventListener) {
            settingsBtn.addEventListener('click', openSyncSettings);
        } else if (settingsBtn.attachEvent) {
            settingsBtn.attachEvent('onclick', openSyncSettings);
        }
    }

    if (saveTokenBtn) {
        if (saveTokenBtn.addEventListener) {
            saveTokenBtn.addEventListener('click', window.saveToken);
        } else if (saveTokenBtn.attachEvent) {
            saveTokenBtn.attachEvent('onclick', window.saveToken);
        }
    }

    if (deleteTokenBtn) {
        if (deleteTokenBtn.addEventListener) {
            deleteTokenBtn.addEventListener('click', window.deleteToken);
        } else if (deleteTokenBtn.attachEvent) {
            deleteTokenBtn.attachEvent('onclick', window.deleteToken);
        }
    }

    // 恢复上次的数据
    var savedData = loadData();
    if (savedData) {
        document.getElementById('neckline').value = savedData.neckline || '';
        document.getElementById('headPrice').value = savedData.headPrice || '';
        document.getElementById('ratioInput').value = savedData.customRatio || 15;
        document.getElementById('targetPrice').textContent = savedData.targetPrice ? savedData.targetPrice.toFixed(3) : '--';
        document.getElementById('buyPrice').textContent = savedData.buyPrice ? savedData.buyPrice.toFixed(3) : '--';
        document.getElementById('stopPrice').textContent = savedData.stopPrice ? savedData.stopPrice.toFixed(3) : '--';
        document.getElementById('ratio').textContent = savedData.ratio ? savedData.ratio.toFixed(3) : '--';
    }

    console.log('页面加载完成');
});
