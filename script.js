// ==================== БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ VK ==================== //
console.log('🚀 Запуск приложения Копейка...');

// Функция для безопасной инициализации VK Bridge
function initializeVKSafely() {
    return new Promise((resolve) => {
        // Проверяем, есть ли VK Bridge и доступен ли он
        if (typeof vkBridge !== 'undefined' && vkBridge && typeof vkBridge.send === 'function') {
            console.log('🔗 VK Bridge обнаружен, пытаемся инициализировать...');
            
            // Пытаемся инициализировать, но не блокируем приложение при ошибке
            vkBridge.send('VKWebAppInit', {})
                .then((data) => {
                    console.log('✅ VK Bridge успешно инициализирован');
                    resolve(true);
                })
                .catch((error) => {
                    console.log('⚠️ VK Bridge инициализация не удалась, работаем в браузере:', error);
                    resolve(false);
                });
            
            // Таймаут на случай если VK Bridge не ответит
            setTimeout(() => {
                console.log('⏰ Таймаут VK Bridge, работаем в браузере');
                resolve(false);
            }, 3000);
        } else {
            console.log('🌐 VK Bridge не найден, работаем в обычном браузере');
            resolve(false);
        }
    });
}

// Запускаем приложение после инициализации
initializeVKSafely().then((isVK) => {
    console.log(isVK ? '🎯 Режим VK' : '🖥️ Режим браузера');
    startApp();
});

// ==================== ОСНОВНОЕ ПРИЛОЖЕНИЕ ==================== //
let chart = null;

function startApp() {
    // Ждем полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}

function initApp() {
    console.log('✅ DOM загружен!');
    
    // Находим все элементы с проверкой на существование
    const elements = {
        addButton: document.getElementById('add-operation-btn'),
        modal: document.getElementById('modal'),
        cancelBtn: document.getElementById('cancel-btn'),
        saveBtn: document.getElementById('save-btn'),
        operationsList: document.getElementById('operations-list'),
        totalBalanceElement: document.getElementById('total-balance'),
        periodSelect: document.getElementById('period-select'),
        tabButtons: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        chart: document.getElementById('chart')
    };
    
    console.log('🔍 Найдены элементы:', {
        addButton: !!elements.addButton,
        modal: !!elements.modal,
        cancelBtn: !!elements.cancelBtn,
        saveBtn: !!elements.saveBtn,
        operationsList: !!elements.operationsList,
        tabButtons: elements.tabButtons.length,
        tabContents: elements.tabContents.length
    });
    
    // Если основные элементы не найдены - выходим
    if (!elements.addButton || !elements.modal || !elements.operationsList) {
        console.error('❌ Критические элементы не найдены!');
        return;
    }
    
    let operations = [];
    
    // Загрузка данных
    loadOperations();
    
    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ==================== //
    
    // Кнопка добавления
    elements.addButton.addEventListener('click', showModal);
    
    // Кнопка отмены
    if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', hideModal);
    }
    
    // Кнопка сохранения
    if (elements.saveBtn) {
        elements.saveBtn.addEventListener('click', saveOperation);
    }
    
    // Переключение вкладок
    if (elements.tabButtons.length > 0) {
        elements.tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                
                // Обновляем активные кнопки
                elements.tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Показываем соответствующий контент
                elements.tabContents.forEach(content => content.classList.remove('active'));
                const activeTab = document.getElementById(`${tabName}-tab`);
                if (activeTab) {
                    activeTab.classList.add('active');
                }
                
                // Если переключились на статистику - обновляем диаграмму
                if (tabName === 'statistics') {
                    updateChart();
                }
            });
        });
    }
    
    // Выбор периода
    if (elements.periodSelect) {
        elements.periodSelect.addEventListener('change', updateChart);
    }
    
    // Закрытие модального окна
    window.addEventListener('click', function(event) {
        if (event.target === elements.modal) {
            hideModal();
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideModal();
        }
    });
    
    // ==================== ФУНКЦИИ ==================== //
    
    function showModal() {
        console.log('📋 Открываем модальное окно');
        elements.modal.style.display = 'block';
        setTimeout(() => {
            const amountInput = document.getElementById('amount-input');
            if (amountInput) amountInput.focus();
        }, 100);
    }
    
    function hideModal() {
        console.log('📋 Закрываем модальное окно');
        elements.modal.style.display = 'none';
        const amountInput = document.getElementById('amount-input');
        const commentInput = document.getElementById('comment-input');
        if (amountInput) amountInput.value = '';
        if (commentInput) commentInput.value = '';
    }
    
    function saveOperation() {
        const amountInput = document.getElementById('amount-input');
        const categorySelect = document.getElementById('category-select');
        const commentInput = document.getElementById('comment-input');
        
        const amount = amountInput ? amountInput.value : '';
        const category = categorySelect ? categorySelect.value : 'other';
        const comment = commentInput ? commentInput.value : '';
        
        console.log('💾 Сохранение:', { amount, category, comment });
        
        if (amount && !isNaN(amount)) {
            const newOperation = {
                id: Date.now(),
                amount: parseFloat(amount),
                category: category,
                comment: comment,
                date: new Date().toLocaleDateString('ru-RU'),
                timestamp: Date.now()
            };
            
            operations.unshift(newOperation);
            saveOperations();
            updateOperationsList();
            updateBalance();
            updateChart();
            hideModal();
            
            showNotification('Операция сохранена! ✅');
        } else {
            if (amountInput) {
                amountInput.style.borderColor = '#f56565';
                setTimeout(() => {
                    amountInput.style.borderColor = '#e2e8f0';
                }, 1000);
            }
        }
    }
    
    function loadOperations() {
        try {
            const saved = localStorage.getItem('kopeyka_operations');
            if (saved) {
                operations = JSON.parse(saved);
                console.log('📥 Загружено операций:', operations.length);
                updateOperationsList();
                updateBalance();
                // Откладываем инициализацию диаграммы
                setTimeout(updateChart, 100);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            operations = [];
        }
    }
    
    function saveOperations() {
        try {
            localStorage.setItem('kopeyka_operations', JSON.stringify(operations));
            console.log('💾 Операции сохранены:', operations.length);
        } catch (error) {
            console.error('❌ Ошибка сохранения данных:', error);
        }
    }
    
    function updateOperationsList() {
        if (!elements.operationsList) return;
        
        elements.operationsList.innerHTML = '';
        
        if (operations.length === 0) {
            elements.operationsList.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📊</div>
                    <div class="text">Нет операций</div>
                    <div class="subtext">Добавьте первую операцию!</div>
                </div>
            `;
            return;
        }
        
        operations.forEach(operation => {
            const operationElement = document.createElement('div');
            operationElement.className = `operation-item ${operation.amount > 0 ? 'income' : 'expense'}`;
            
            operationElement.innerHTML = `
                <div class="operation-info">
                    <div class="category">${getCategoryIcon(operation.category)} ${getCategoryName(operation.category)}</div>
                    <div class="comment">${operation.comment || ''}</div>
                    <div class="date">${operation.date}</div>
                </div>
                <div class="amount ${operation.amount > 0 ? 'income' : 'expense'}">
                    ${operation.amount > 0 ? '+' : ''}${operation.amount} ₽
                </div>
            `;
            
            elements.operationsList.appendChild(operationElement);
        });
    }
    
    function updateBalance() {
        if (!elements.totalBalanceElement) return;
        
        const total = operations.reduce((sum, op) => sum + op.amount, 0);
        elements.totalBalanceElement.textContent = `${total.toFixed(2)} ₽`;
        elements.totalBalanceElement.style.color = total >= 0 ? '#48bb78' : '#f56565';
    }
    
    function updateChart() {
        // Проверяем доступен ли Chart.js
        if (typeof Chart === 'undefined') {
            console.log('📊 Chart.js не загружен, пропускаем обновление диаграммы');
            return;
        }
        
        const periodSelect = document.getElementById('period-select');
        const chartCanvas = document.getElementById('chart');
        const chartLegend = document.getElementById('chart-legend');
        
        if (!periodSelect || !chartCanvas || !chartLegend) return;
        
        const period = periodSelect.value;
        const now = Date.now();
        let filteredOperations = operations;
        
        // Фильтрация по периоду
        if (period === 'week') {
            const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
            filteredOperations = operations.filter(op => op.timestamp > weekAgo);
        } else if (period === 'month') {
            const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
            filteredOperations = operations.filter(op => op.timestamp > monthAgo);
        }
        
        // Только расходы для диаграммы
        const expenses = filteredOperations.filter(op => op.amount < 0);
        
        if (expenses.length === 0) {
            chartLegend.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📈</div>
                    <div class="text">Нет данных</div>
                    <div class="subtext">Добавьте расходы для анализа</div>
                </div>
            `;
            if (chart) chart.destroy();
            return;
        }
        
        // Группировка по категориям
        const categories = {};
        expenses.forEach(op => {
            const category = op.category;
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += Math.abs(op.amount);
        });
        
        // Сортировка по сумме
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        
        // Данные для диаграммы
        const labels = sortedCategories.map(([category]) => getCategoryName(category));
        const data = sortedCategories.map(([_, amount]) => amount);
        const backgroundColors = [
            '#4facfe', '#ff6b6b', '#48bb78', '#f56565', 
            '#f6ad55', '#9f7aea', '#ed64a6', '#667eea'
        ];
        
        // Создаем или обновляем диаграмму
        const ctx = chartCanvas.getContext('2d');
        if (chart) chart.destroy();
        
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    borderRadius: 8,
                    hoverOffset: 12
                }]
            },
            options: {
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw.toFixed(2)} ₽`;
                            }
                        }
                    }
                },
                animation: { duration: 1000, easing: 'easeOutQuart' }
            }
        });
        
        // Обновляем легенду
        updateChartLegend(sortedCategories, backgroundColors);
    }
    
    function updateChartLegend(categories, colors) {
        const legend = document.getElementById('chart-legend');
        if (!legend) return;
        
        legend.innerHTML = '';
        
        categories.forEach(([category, amount], index) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-color" style="background: ${colors[index]}"></div>
                <div class="legend-text">${getCategoryName(category)}</div>
                <div class="legend-amount">${amount.toFixed(2)} ₽</div>
            `;
            legend.appendChild(legendItem);
        });
    }
    
    function getCategoryIcon(category) {
        const icons = {
            'food': '🍔', 'transport': '🚗', 'entertainment': '🎬',
            'health': '💊', 'shopping': '🛍️', 'income': '💰', 'other': '📁'
        };
        return icons[category] || '📁';
    }
    
    function getCategoryName(category) {
        const names = {
            'food': 'Еда', 'transport': 'Транспорт', 'entertainment': 'Развлечения',
            'health': 'Здоровье', 'shopping': 'Покупки', 'income': 'Доход', 'other': 'Другое'
        };
        return names[category] || category;
    }
    
    function showNotification(message) {
        // Пытаемся использовать VK уведомления если доступны
        if (typeof vkBridge !== 'undefined' && vkBridge && typeof vkBridge.send === 'function') {
            try {
                vkBridge.send('VKWebAppShowSnackbar', { text: message });
                return;
            } catch (error) {
                console.log('⚠️ VK уведомления недоступны');
            }
        }
        
        // Простое уведомление для браузера
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #48bb78;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }
    
    console.log('✅ Приложение успешно запущено!');
}
