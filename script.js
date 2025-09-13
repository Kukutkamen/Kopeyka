// ==================== ПРАВИЛЬНАЯ ИНИЦИАЛИЗАЦИЯ VK ==================== //
console.log('Запуск приложения Копейка...');

async function initializeVK() {
    try {
        if (typeof vkBridge !== 'undefined') {
            console.log('Инициализация VK Bridge...');
            const result = await vkBridge.send('VKWebAppInit', {});

            if (result && result.result === true) {
                console.log('✅ VK успешно инициализирован!');
                return true;
            }
            return false;
        }
        console.log('🚀 Запуск в обычном браузере');
        return true;
    } catch (error) {
        console.error('⚠️ Ошибка инициализации VK:', error);
        return false;
    }
}

initializeVK().then(success => {
    if (success) startApp();
    else showError();
});

function showError() {
    document.body.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: white; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); min-height: 100vh;">
            <div style="font-size: 64px; margin-bottom: 20px;">😕</div>
            <h2 style="margin-bottom: 15px;">Не удалось загрузить</h2>
            <p style="margin-bottom: 25px; opacity: 0.9;">Попробуйте открыть приложение еще раз</p>
            <button onclick="location.reload()" style="background: white; color: #ff6b6b; border: none; padding: 15px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                Обновить
            </button>
        </div>
    `;
}

// ==================== ОСНОВНОЕ ПРИЛОЖЕНИЕ ==================== //
let chart = null;

function startApp() {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('DOM загружен!');

        // Элементы
        const addButton = document.getElementById('add-operation-btn');
        const modal = document.getElementById('modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const saveBtn = document.getElementById('save-btn');
        const operationsList = document.getElementById('operations-list');
        const totalBalanceElement = document.getElementById('total-balance');
        const periodSelect = document.getElementById('period-select');
        const tabButtons = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        let operations = [];

        // Загрузка данных
        loadOperations();

        // Обработчики
        addButton.addEventListener('click', showModal);
        cancelBtn.addEventListener('click', hideModal);
        saveBtn.addEventListener('click', saveOperation);
        periodSelect.addEventListener('change', updateChart);

        // Переключение вкладок
        tabButtons.forEach(button => {
            button.addEventListener('click', function () {
                const tabName = this.getAttribute('data-tab');

                // Обновляем активные кнопки
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                // Показываем соответствующий контент
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');

                // Если переключились на статистику - обновляем диаграмму
                if (tabName === 'statistics') {
                    updateChart();
                }
            });
        });

        function showModal() {
            modal.style.display = 'block';
            setTimeout(() => document.getElementById('amount-input').focus(), 100);
        }

        function hideModal() {
            modal.style.display = 'none';
            document.getElementById('amount-input').value = '';
            document.getElementById('comment-input').value = '';
        }

        function saveOperation() {
            const amount = document.getElementById('amount-input').value;
            const category = document.getElementById('category-select').value;
            const comment = document.getElementById('comment-input').value;

            if (amount && !isNaN(amount)) {
                const newOperation = {
                    id: Date.now(),
                    amount: parseFloat(amount),
                    category: category,
                    comment: comment,
                    date: new Date().toLocaleDateString('ru-RU'),
                    timestamp: Date.now()
                };

                operations.unshift(newOperation); // Добавляем в начало
                saveOperations();
                updateOperationsList();
                updateBalance();
                updateChart();
                hideModal();

                showNotification('Операция сохранена!');
            }
        }

        function loadOperations() {
            try {
                const saved = localStorage.getItem('kopeyka_operations');
                if (saved) {
                    operations = JSON.parse(saved);
                    operations.sort((a, b) => b.timestamp - a.timestamp);
                    updateOperationsList();
                    updateBalance();
                }
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                operations = [];
            }
        }

        function saveOperations() {
            try {
                localStorage.setItem('kopeyka_operations', JSON.stringify(operations));
            } catch (error) {
                console.error('Ошибка сохранения:', error);
            }
        }

        function updateOperationsList() {
            operationsList.innerHTML = '';

            if (operations.length === 0) {
                operationsList.innerHTML = `
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

                operationsList.appendChild(operationElement);
            });
        }

        function updateBalance() {
            const total = operations.reduce((sum, op) => sum + op.amount, 0);
            totalBalanceElement.textContent = `${total.toFixed(2)} ₽`;
            totalBalanceElement.style.color = total >= 0 ? '#48bb78' : '#f56565';
        }

        function updateChart() {
            const period = document.getElementById('period-select').value;
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
                document.getElementById('chart-legend').innerHTML = `
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
                .slice(0, 8); // Максимум 8 категорий

            // Данные для диаграммы
            const labels = sortedCategories.map(([category]) => getCategoryName(category));
            const data = sortedCategories.map(([_, amount]) => amount);
            const backgroundColors = [
                '#4facfe', '#ff6b6b', '#48bb78', '#f56565',
                '#f6ad55', '#9f7aea', '#ed64a6', '#667eea'
            ];

            // Создаем или обновляем диаграмму
            const ctx = document.getElementById('chart').getContext('2d');
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
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.label}: ${context.raw.toFixed(2)} ₽`;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });

            // Легенда
            updateChartLegend(sortedCategories, backgroundColors);
        }

        function updateChartLegend(categories, colors) {
            const legend = document.getElementById('chart-legend');
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
                'food': '🍔',
                'transport': '🚗',
                'entertainment': '🎬',
                'health': '💊',
                'shopping': '🛍️',
                'income': '💰',
                'other': '📁'
            };
            return icons[category] || '📁';
        }

        function getCategoryName(category) {
            const names = {
                'food': 'Еда',
                'transport': 'Транспорт',
                'entertainment': 'Развлечения',
                'health': 'Здоровье',
                'shopping': 'Покупки',
                'income': 'Доход',
                'other': 'Другое'
            };
            return names[category] || category;
        }

        function showNotification(message) {
            if (typeof vkBridge !== 'undefined') {
                vkBridge.send('VKWebAppShowSnackbar', { text: message });
            } else {
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
                    z-index: 1000;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                `;
                notification.textContent = message;
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.remove();
                }, 2000);
            }
        }

        window.addEventListener('click', function (event) {
            if (event.target === modal) hideModal();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') hideModal();
        });

        // Инициализация диаграммы при загрузке
        setTimeout(updateChart, 100);
    });
}