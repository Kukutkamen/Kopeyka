// Ждем загрузки страницы
document.addEventListener('DOMContentLoaded', function () {
    // Находим все нужные элементы
    const addButton = document.getElementById('add-operation-btn');
    const modal = document.getElementById('modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    const operationsList = document.getElementById('operations-list');
    const totalBalanceElement = document.getElementById('total-balance');

    // Массив для хранения операций
    let operations = [];

    // Загружаем сохраненные операции
    loadOperations();

    // Показываем окно добавления
    addButton.addEventListener('click', function () {
        modal.style.display = 'block';
    });

    // Закрываем окно
    cancelBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // Сохраняем новую операцию
    saveBtn.addEventListener('click', function () {
        const amount = document.getElementById('amount-input').value;
        const category = document.getElementById('category-select').value;
        const comment = document.getElementById('comment-input').value;

        if (amount) {
            // Создаем новую операцию
            const newOperation = {
                id: Date.now(), // уникальный ID
                amount: parseFloat(amount),
                category: category,
                comment: comment,
                date: new Date().toLocaleDateString('ru-RU')
            };

            // Добавляем в массив
            operations.push(newOperation);

            // Сохраняем и обновляем
            saveOperations();
            updateOperationsList();
            updateBalance();

            // Закрываем окно и очищаем поля
            modal.style.display = 'none';
            document.getElementById('amount-input').value = '';
            document.getElementById('comment-input').value = '';
        }
    });

    // Загружаем операции из localStorage
    function loadOperations() {
        const saved = localStorage.getItem('kopeyka_operations');
        if (saved) {
            operations = JSON.parse(saved);
            updateOperationsList();
            updateBalance();
        }
    }

    // Сохраняем операции в localStorage
    function saveOperations() {
        localStorage.setItem('kopeyka_operations', JSON.stringify(operations));
    }

    // Обновляем список операций
    function updateOperationsList() {
        operationsList.innerHTML = '';

        operations.forEach(operation => {
            const operationElement = document.createElement('div');
            operationElement.className = 'operation-item';

            operationElement.innerHTML = `
                <div class="operation-info">
                    <div class="category">${getCategoryName(operation.category)}</div>
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

    // Получаем русское название категории
    function getCategoryName(category) {
        const names = {
            'food': '🍔 Еда',
            'transport': '🚗 Транспорт',
            'other': '📁 Другое'
        };
        return names[category] || category;
    }

    // Обновляем баланс
    function updateBalance() {
        const total = operations.reduce((sum, op) => sum + op.amount, 0);
        totalBalanceElement.textContent = `${total} ₽`;

        // Меняем цвет в зависимости от баланса
        if (total >= 0) {
            totalBalanceElement.style.color = '#4bb34b';
        } else {
            totalBalanceElement.style.color = '#e64646';
        }
    }

    // Закрываем окно при клике вне его
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});