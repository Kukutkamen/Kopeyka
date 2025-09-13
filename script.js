// ==================== ОСНОВНОЕ ПРИЛОЖЕНИЕ ==================== //

console.log('🚀 Запуск приложения Копейка...');

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ DOM загружен!');

    // Находим все элементы
    const addButton = document.getElementById('add-operation-btn');
    const modal = document.getElementById('modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    const operationsList = document.getElementById('operations-list');
    const totalBalanceElement = document.getElementById('total-balance');

    console.log('🔍 Найдены элементы:', {
        addButton: !!addButton,
        modal: !!modal,
        cancelBtn: !!cancelBtn,
        saveBtn: !!saveBtn,
        operationsList: !!operationsList
    });

    // Массив для хранения операций
    let operations = [];

    // Загружаем данные из localStorage
    loadOperations();

    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ==================== //

    // Кнопка добавления операции
    addButton.addEventListener('click', function () {
        console.log('➕ Кнопка добавления нажата');
        showModal();
    });

    // Кнопка отмены
    cancelBtn.addEventListener('click', function () {
        console.log('❌ Кнопка отмены нажата');
        hideModal();
    });

    // Кнопка сохранения
    saveBtn.addEventListener('click', function () {
        console.log('💾 Кнопка сохранения нажата');
        saveOperation();
    });

    // Закрытие модального окна по клику вне его
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            console.log('📌 Клик вне модального окна');
            hideModal();
        }
    });

    // Закрытие по клавише Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            console.log('⌨️ Клавиша Escape нажата');
            hideModal();
        }
    });

    // ==================== ФУНКЦИИ ==================== //

    // Показать модальное окно
    function showModal() {
        console.log('📋 Открываем модальное окно');
        modal.style.display = 'block';

        // Фокусируемся на поле ввода суммы
        setTimeout(function () {
            document.getElementById('amount-input').focus();
        }, 100);
    }

    // Скрыть модальное окно
    function hideModal() {
        console.log('📋 Закрываем модальное окно');
        modal.style.display = 'none';

        // Очищаем поля формы
        document.getElementById('amount-input').value = '';
        document.getElementById('comment-input').value = '';
    }

    // Сохранить операцию
    function saveOperation() {
        const amount = document.getElementById('amount-input').value;
        const category = document.getElementById('category-select').value;
        const comment = document.getElementById('comment-input').value;

        console.log('💾 Данные для сохранения:', { amount, category, comment });

        // Проверяем что сумма указана
        if (amount && !isNaN(amount)) {
            // Создаем новую операцию
            const newOperation = {
                id: Date.now(), // Уникальный ID
                amount: parseFloat(amount),
                category: category,
                comment: comment,
                date: new Date().toLocaleDateString('ru-RU'),
                timestamp: Date.now()
            };

            // Добавляем операцию в массив
            operations.push(newOperation);

            // Сохраняем и обновляем интерфейс
            saveOperations();
            updateOperationsList();
            updateBalance();
            hideModal();

            console.log('✅ Операция сохранена:', newOperation);
        } else {
            console.log('⚠️ Ошибка: неверная сумма');
            // Подсвечиваем поле с ошибкой
            const amountInput = document.getElementById('amount-input');
            amountInput.style.borderColor = '#f56565';
            setTimeout(function () {
                amountInput.style.borderColor = '#e2e8f0';
            }, 1000);
        }
    }

    // Загрузить операции из localStorage
    function loadOperations() {
        try {
            const saved = localStorage.getItem('kopeyka_operations');
            if (saved) {
                operations = JSON.parse(saved);
                console.log('📥 Загружено операций:', operations.length);
                updateOperationsList();
                updateBalance();
            } else {
                console.log('📥 Нет сохраненных операций');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            operations = [];
        }
    }

    // Сохранить операции в localStorage
    function saveOperations() {
        try {
            localStorage.setItem('kopeyka_operations', JSON.stringify(operations));
            console.log('💾 Операции сохранены:', operations.length);
        } catch (error) {
            console.error('❌ Ошибка сохранения данных:', error);
        }
    }

    // Обновить список операций
    function updateOperationsList() {
        console.log('🔄 Обновление списка операций');
        operationsList.innerHTML = '';

        // Если операций нет - показываем заглушку
        if (operations.length === 0) {
            operationsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-text">Нет операций</div>
                    <div class="empty-subtext">Добавьте первую операцию!</div>
                </div>
            `;
            return;
        }

        // Показываем операции в обратном порядке (новые сверху)
        operations.slice().reverse().forEach(function (operation) {
            const operationElement = document.createElement('div');
            operationElement.className = 'operation-item';

            operationElement.innerHTML = `
                <div class="operation-info">
                    <div class="operation-category">${getCategoryIcon(operation.category)} ${getCategoryName(operation.category)}</div>
                    <div class="operation-comment">${operation.comment || ''}</div>
                    <div class="operation-date">${operation.date}</div>
                </div>
                <div class="operation-amount ${operation.amount > 0 ? 'amount-income' : 'amount-expense'}">
                    ${operation.amount > 0 ? '+' : ''}${operation.amount} ₽
                </div>
            `;

            operationsList.appendChild(operationElement);
        });
    }

    // Обновить баланс
    function updateBalance() {
        const total = operations.reduce(function (sum, operation) {
            return sum + operation.amount;
        }, 0);

        totalBalanceElement.textContent = total.toFixed(2) + ' ₽';

        // Меняем цвет в зависимости от баланса
        if (total >= 0) {
            totalBalanceElement.style.color = '#48bb78';
        } else {
            totalBalanceElement.style.color = '#f56565';
        }

        console.log('💰 Баланс обновлен:', total);
    }

    // Получить иконку категории
    function getCategoryIcon(category) {
        const icons = {
            'food': '🍔',
            'transport': '🚗',
            'entertainment': '🎬',
            'other': '📁'
        };
        return icons[category] || '📁';
    }

    // Получить русское название категории
    function getCategoryName(category) {
        const names = {
            'food': 'Еда',
            'transport': 'Транспорт',
            'entertainment': 'Развлечения',
            'other': 'Другое'
        };
        return names[category] || category;
    }

    console.log('✅ Приложение успешно запущено!');
});

// Простая инициализация VK Bridge если он есть
if (typeof vkBridge !== 'undefined') {
    console.log('🔗 VK Bridge обнаружен');
    try {
        vkBridge.send('VKWebAppInit', {});
        console.log('✅ VK Bridge инициализирован');
    } catch (error) {
        console.log('⚠️ VK Bridge не доступен');
    }
}