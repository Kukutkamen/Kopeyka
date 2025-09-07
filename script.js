// ==================== ПРАВИЛЬНАЯ ИНИЦИАЛИЗАЦИЯ VK ==================== //
console.log('Запуск приложения Копейка...');

// Функция для инициализации VK
async function initializeVK() {
    try {
        if (typeof vkBridge !== 'undefined') {
            console.log('Инициализация VK Bridge...');
            const result = await vkBridge.send('VKWebAppInit', {});

            if (result && result.result === true) {
                console.log('✅ VK успешно инициализирован!');
                return true;
            } else {
                console.log('❌ VK не инициализирован');
                return false;
            }
        } else {
            console.log('🚀 Запуск в обычном браузере');
            return true;
        }
    } catch (error) {
        console.error('⚠️ Ошибка инициализации VK:', error);
        return false;
    }
}

// Запускаем инициализацию
initializeVK().then(success => {
    if (success) {
        startApp();
    } else {
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2>⚠️ Ошибка загрузки</h2>
                <p>Попробуйте открыть приложение еще раз</p>
                <button onclick="location.reload()">Перезагрузить</button>
            </div>
        `;
    }
});

// ==================== ОСНОВНОЕ ПРИЛОЖЕНИЕ ==================== //
function startApp() {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('DOM загружен!');

        const addButton = document.getElementById('add-operation-btn');
        const modal = document.getElementById('modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const saveBtn = document.getElementById('save-btn');
        const operationsList = document.getElementById('operations-list');
        const totalBalanceElement = document.getElementById('total-balance');

        let operations = [];
        loadOperations();

        addButton.addEventListener('click', showModal);
        cancelBtn.addEventListener('click', hideModal);
        saveBtn.addEventListener('click', saveOperation);

        function showModal() {
            modal.style.display = 'block';
        }

        function hideModal() {
            modal.style.display = 'none';
        }

        function saveOperation() {
            const amount = document.getElementById('amount-input').value;
            const category = document.getElementById('category-select').value;
            const comment = document.getElementById('comment-input').value;

            if (amount) {
                const newOperation = {
                    id: Date.now(),
                    amount: parseFloat(amount),
                    category: category,
                    comment: comment,
                    date: new Date().toLocaleDateString('ru-RU')
                };

                operations.push(newOperation);
                saveOperations();
                updateOperationsList();
                updateBalance();
                hideModal();
            }
        }

        function loadOperations() {
            const saved = localStorage.getItem('kopeyka_operations');
            if (saved) {
                operations = JSON.parse(saved);
                updateOperationsList();
                updateBalance();
            }
        }

        function saveOperations() {
            localStorage.setItem('kopeyka_operations', JSON.stringify(operations));
        }

        function updateOperationsList() {
            operationsList.innerHTML = '';
            operations.forEach(op => {
                const div = document.createElement('div');
                div.className = 'operation-item';
                div.innerHTML = `
                    <div class="operation-info">
                        <div class="category">${getCategoryName(op.category)}</div>
                        <div class="comment">${op.comment || ''}</div>
                        <div class="date">${op.date}</div>
                    </div>
                    <div class="amount ${op.amount > 0 ? 'income' : 'expense'}">
                        ${op.amount > 0 ? '+' : ''}${op.amount} ₽
                    </div>
                `;
                operationsList.appendChild(div);
            });
        }

        function getCategoryName(category) {
            const names = {
                'food': '🍔 Еда',
                'transport': '🚗 Транспорт',
                'other': '📁 Другое'
            };
            return names[category] || category;
        }

        function updateBalance() {
            const total = operations.reduce((sum, op) => sum + op.amount, 0);
            totalBalanceElement.textContent = total + ' ₽';
            totalBalanceElement.style.color = total >= 0 ? '#4caf50' : '#f44336';
        }

        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                hideModal();
            }
        });
    });
}
