// ==================== ИНИЦИАЛИЗАЦИЯ VK ==================== //
// Эта часть должна быть в самом начале файла!

console.log('Загрузка приложения Копейка...');

// Проверяем, запущены ли мы внутри VK Mini App
if (typeof vkBridge !== 'undefined') {
    console.log('Запуск внутри VK...');
    
    // Обязательная инициализация для VK
    vkBridge.send('VKWebAppInit', {})
        .then(data => {
            console.log('VK успешно инициализирован!');
            startApp();
        })
        .catch(error => {
            console.error('Ошибка инициализации VK:', error);
            // Все равно запускаем приложение
            startApp();
        });
} else {
    console.log('Запуск в обычном браузере');
    // Запускаем приложение без VK
    startApp();
}

// ==================== ОСНОВНОЕ ПРИЛОЖЕНИЕ ==================== //

function startApp() {
    console.log('Запуск основного приложения...');
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM загружен!');
        
        // Находим все элементы
        const addButton = document.getElementById('add-operation-btn');
        const modal = document.getElementById('modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const saveBtn = document.getElementById('save-btn');
        const operationsList = document.getElementById('operations-list');
        const totalBalanceElement = document.getElementById('total-balance');
        
        console.log('Элементы найдены:', {addButton, modal, cancelBtn, saveBtn});
        
        // Массив для операций
        let operations = [];
        
        // Загружаем сохраненные данные
        loadOperations();
        
        // Обработчики событий
        addButton.addEventListener('click', showModal);
        cancelBtn.addEventListener('click', hideModal);
        saveBtn.addEventListener('click', saveOperation);
        
        // Функция показа модального окна
        function showModal() {
            console.log('Открываем окно добавления');
            modal.style.display = 'block';
            // Фокусируемся на поле суммы
            setTimeout(() => {
                document.getElementById('amount-input').focus();
            }, 100);
        }
        
        // Функция скрытия модального окна
        function hideModal() {
            console.log('Закрываем окно');
            modal.style.display = 'none';
            // Очищаем поля
            document.getElementById('amount-input').value = '';
            document.getElementById('comment-input').value = '';
        }
        
        // Функция сохранения операции
        function saveOperation() {
            const amountInput = document.getElementById('amount-input');
            const categorySelect = document.getElementById('category-select');
            const commentInput = document.getElementById('comment-input');
            
            const amount = amountInput.value;
            const category = categorySelect.value;
            const comment = commentInput.value;
            
            console.log('Сохранение операции:', {amount, category, comment});
            
            if (amount && !isNaN(amount)) {
                const newOperation = {
                    id: Date.now(),
                    amount: parseFloat(amount),
                    category: category,
                    comment: comment,
                    date: new Date().toLocaleDateString('ru-RU'),
                    timestamp: new Date().getTime()
                };
                
                operations.push(newOperation);
                saveOperations();
                updateOperationsList();
                updateBalance();
                hideModal();
                
                // Показываем анимацию успеха
                if (typeof vkBridge !== 'undefined') {
                    vkBridge.send('VKWebAppShowSnackbar', {
                        text: 'Операция сохранена!'
                    });
                }
            } else {
                // Показываем ошибку
                amountInput.style.borderColor = '#f44336';
                setTimeout(() => {
                    amountInput.style.borderColor = '#e0e0e0';
                }, 1000);
            }
        }
        
        // Загрузка операций из localStorage
        function loadOperations() {
            try {
                const saved = localStorage.getItem('kopeyka_operations');
                if (saved) {
                    operations = JSON.parse(saved);
                    // Сортируем по дате (новые сверху)
                    operations.sort((a, b) => b.timestamp - a.timestamp);
                    updateOperationsList();
                    updateBalance();
                }
                console.log('Загружено операций:', operations.length);
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
                operations = [];
            }
        }
        
        // Сохранение операций в localStorage
        function saveOperations() {
            try {
                localStorage.setItem('kopeyka_operations', JSON.stringify(operations));
                console.log('Операции сохранены:', operations.length);
            } catch (error) {
                console.error('Ошибка сохранения данных:', error);
            }
        }
        
        // Обновление списка операций
        function updateOperationsList() {
            operationsList.innerHTML = '';
            
            if (operations.length === 0) {
                operationsList.innerHTML = `
                    <div class="empty-state">
                        <div style="text-align: center; padding: 40px 20px; color: #666;">
                            <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                            <div style="font-size: 16px;">Нет операций</div>
                            <div style="font-size: 14px; margin-top: 5px;">Добавьте первую операцию!</div>
                        </div>
                    </div>
                `;
                return;
            }
            
            operations.forEach(operation => {
                const operationElement = document.createElement('div');
                operationElement.className = 'operation-item';
                
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
        
        // Получение иконки для категории
        function getCategoryIcon(category) {
            const icons = {
                'food': '🍔',
                'transport': '🚗',
                'entertainment': '🎬',
                'health': '💊',
                'income': '💰',
                'other': '📁'
            };
            return icons[category] || '📁';
        }
        
        // Получение русского названия категории
        function getCategoryName(category) {
            const names = {
                'food': 'Еда',
                'transport': 'Транспорт',
                'entertainment': 'Развлечения',
                'health': 'Здоровье',
                'income': 'Доход',
                'other': 'Другое'
            };
            return names[category] || category;
        }
        
        // Обновление баланса
        function updateBalance() {
            const total = operations.reduce((sum, operation) => sum + operation.amount, 0);
            totalBalanceElement.textContent = `${total.toFixed(2)} ₽`;
            
            // Меняем цвет в зависимости от баланса
            if (total >= 0) {
                totalBalanceElement.style.color = '#4caf50';
            } else {
                totalBalanceElement.style.color = '#f44336';
            }
        }
        
        // Закрытие модального окна по клику вне его
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                hideModal();
            }
        });
        
        // Закрытие по клавише Escape
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                hideModal();
            }
        });
        
        console.log('Приложение запущено успешно!');
    });
}
