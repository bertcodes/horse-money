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

        document.getElementById('targetPrice').textContent = targetPrice.toFixed(3);
        document.getElementById('buyPrice').textContent = buyPrice.toFixed(3);
        document.getElementById('stopPrice').textContent = stopPrice.toFixed(3);
        document.getElementById('ratio').textContent = ratio.toFixed(3);

        // 保存数据
        saveData({
            neckline: neckline,
            headPrice: headPrice,
            targetPrice: targetPrice,
            buyPrice: buyPrice,
            stopPrice: stopPrice,
            ratio: ratio,
            customRatio: customRatio
        });
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

        document.getElementById('targetPrice').textContent = targetPrice.toFixed(3);
        document.getElementById('buyPrice').textContent = buyPrice.toFixed(3);
        document.getElementById('stopPrice').textContent = stopPrice.toFixed(3);
        document.getElementById('ratio').textContent = customRatio.toFixed(3);

        // 保存数据
        saveData({
            neckline: neckline,
            headPrice: headPrice,
            targetPrice: targetPrice,
            buyPrice: buyPrice,
            stopPrice: stopPrice,
            ratio: customRatio,
            customRatio: customRatio
        });
    } catch (e) {
        alert('计算出错：' + e.message);
    }
};

// 页面加载完成后绑定事件并恢复数据
window.addEventListener('load', function() {
    var calculateBtn = document.getElementById('calculateBtn');
    var ratioBtn = document.getElementById('ratioBtn');

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
