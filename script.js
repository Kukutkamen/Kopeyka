// ==================== УПРОЩЕННЫЙ РАБОЧИЙ КОД ==================== //
console.log('Запуск приложения Копейка...');

// Ждем загрузки всех ресурсов
window.addEventListener('load', function() {
    console.log('Все ресурсы загружены!');
    startApp();
});

function startApp() {
    console.log('Запуск основного приложения...');
    
    // Проверяем элементы
    const addButton = document.getElementById('add-operation-btn');
    const modal = document.getElementById('modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    
    console.log('Найдены элементы:', {
        addButton: !!addButton,
        modal: !!modal,
        cancelBtn: !!cancelBtn,
        saveBtn: !!saveBtn
    });
    
    // Простые обработчики
    if (addButton) {
        addButton.addEventListener('click', function() {
            console.log('Кнопка + нажата');
            modal.style.display = 'block';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('Кнопка Отмена нажата');
            modal.style.display = 'none';
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            console.log('Кнопка Сохранить нажата');
            const amount = document.getElementById('amount-input').value;
            const category = document.getElementById('category-select').value;
            const comment = document.getElementById('comment-input').value;
            
            if (amount) {
                console.log('Сохранение:', {amount, category, comment});
                // Здесь будет логика сохранения
                modal.style.display = 'none';
            }
        });
    }
    
    // Закрытие по клику вне окна
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}
