import DiceBox from '@3d-dice/dice-box';

class DiceRoller {
    constructor() {
        this.selectedDice = 'd20';
        this.modifier = 0;
        this.rollHistory = [];
        this.diceBox = null;
        this.isRolling = false;
        this.isInitialized = false;
    }
    
    async init() {
        await this.initElements();
        this.initEventListeners();
        await this.initDiceBox();
        this.isInitialized = true;
    }
    
    async initElements() {
        // Даем время DOM полностью загрузиться
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    document.addEventListener('DOMContentLoaded', resolve);
                }
            });
        }
        
        // Ищем элементы с небольшим таймаутом на случай асинхронной загрузки
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.diceBoxElement = document.getElementById('dice-box');
        this.modifierInput = document.getElementById('modifier');
        this.rollButton = document.getElementById('roll-btn');
        this.clearButton = document.getElementById('clear-btn');
        this.currentResult = document.getElementById('current-result');
        this.historyElement = document.getElementById('history');
        this.decreaseModBtn = document.getElementById('decrease-mod');
        this.increaseModBtn = document.getElementById('increase-mod');
        
        console.log('Найдены элементы:', {
            diceBox: !!this.diceBoxElement,
            rollButton: !!this.rollButton,
            clearButton: !!this.clearButton
        });
    }
    
    initEventListeners() {
        console.log('Инициализация обработчиков событий...');
        
        // Выбор дайса
        const diceButtons = document.querySelectorAll('.dice-btn');
        console.log('Найдено кнопок дайсов:', diceButtons.length);
        
        diceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.dice-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedDice = btn.dataset.dice;
                console.log('Выбран дайс:', this.selectedDice);
            });
        });
        
        // Активируем d20 по умолчанию
        const defaultDice = document.querySelector('[data-dice="d20"]');
        if (defaultDice) {
            defaultDice.classList.add('active');
        }
        
        // Модификатор
        if (this.modifierInput) {
            this.modifierInput.addEventListener('change', (e) => {
                this.modifier = parseInt(e.target.value) || 0;
            });
        }
        
        if (this.decreaseModBtn) {
            this.decreaseModBtn.addEventListener('click', () => {
                const value = parseInt(this.modifierInput.value) - 1;
                this.modifierInput.value = value;
                this.modifier = value;
            });
        }
        
        if (this.increaseModBtn) {
            this.increaseModBtn.addEventListener('click', () => {
                const value = parseInt(this.modifierInput.value) + 1;
                this.modifierInput.value = value;
                this.modifier = value;
            });
        }
        
        // Бросок дайса
        if (this.rollButton) {
            this.rollButton.addEventListener('click', () => {
                console.log('Нажата кнопка броска');
                this.rollDice();
            });
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                console.log('Нажата кнопка очистки');
                this.clearHistory();
            });
        }
    }
    
    async initDiceBox() {
    try {
        console.log('Начало инициализации DiceBox...');
        
        if (!this.diceBoxElement) {
            throw new Error('Элемент dice-box не найден в DOM');
        }
        
        // 1. Создаем внутри контейнер с определенным ID
        this.diceBoxElement.innerHTML = '<div id="dice-container"></div>';
        
        // 2. Минимальная рабочая конфигурация
        const config = {
            id: 'dice-canvas',
            assetPath: '/node_modules/@3d-dice/dice-box/dist/assets/',
            scale: 18,
            gravity: 6,
            angularDamping: 0.4,
            linearDamping: 0.4,
            lightIntensity: 1.0,
            theme: 'default',
            themeColor: '#ff0000',
        };
        
        console.log('Создание DiceBox с селектором #dice-container');
        
        // 3. ПЕРЕДАЕМ СЕЛЕКТОР СТРОКОЙ, а не элемент!
        this.diceBox = new DiceBox('#dice-container', config);
        
        console.log('Вызов diceBox.init()...');
        await this.diceBox.init();
        console.log('DiceBox успешно инициализирован!');
    } catch (error) {
        console.error('Фатальная ошибка инициализации DiceBox:', error);
        if (this.diceBoxElement) {
            this.diceBoxElement.innerHTML = `
                <div style="color: #ff4d4d; padding: 20px; text-align: center;">
                    <h3>Ошибка 3D-движка</h3>
                    <p>${error.message}</p>
                    <p>Исправьте вызов: new DiceBox("#dice-container", config)</p>
                </div>
            `;
        }
        throw error;
    }
}
    
    async rollDice() {
        if (!this.isInitialized) {
            console.error('DiceRoller еще не инициализирован!');
            return;
        }
        
        if (this.isRolling) {
            console.log('Уже идет бросок, ждем...');
            return;
        }
        
        if (!this.diceBox) {
            console.error('DiceBox не инициализирован!');
            return;
        }
        
        console.log(`Начало броска: ${this.selectedDice}, модификатор: ${this.modifier}`);
        
        this.isRolling = true;
        this.rollButton.disabled = true;
        const originalText = this.rollButton.innerHTML;
        this.rollButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Бросаем...';
        
        try {
            const notation = `1${this.selectedDice}`;
            console.log(`Выполняем бросок: ${notation}`);
            
            const results = await this.diceBox.roll(notation);
            console.log('Результаты броска:', results);
            
            const diceResult = results[0]?.value || results[0]?.roll || 0;
            const total = diceResult + this.modifier;
            
            console.log(`Итог: ${diceResult} + ${this.modifier} = ${total}`);
            
            this.displayResult(diceResult, total);
            this.addToHistory(diceResult, total);
            
        } catch (error) {
            console.error('Ошибка при броске:', error);
            this.currentResult.innerHTML = `<span style="color: #ff4d4d">Ошибка: ${error.message}</span>`;
        } finally {
            this.isRolling = false;
            this.rollButton.disabled = false;
            this.rollButton.innerHTML = originalText;
        }
    }
    
    displayResult(diceResult, total) {
        if (!this.currentResult) return;
        
        let resultHTML = `<div style="font-size: 2rem; color: #00d4ff;">${diceResult}</div>`;
        
        if (this.modifier !== 0) {
            const modifierSign = this.modifier > 0 ? '+' : '';
            resultHTML += `
                <div style="font-size: 1.2rem; color: #8a8a8a;">${modifierSign}${this.modifier}</div>
                <div style="font-size: 2.5rem; color: #00ff88; font-weight: bold;">= ${total}</div>
            `;
        }
        
        this.currentResult.innerHTML = resultHTML;
    }
    
    addToHistory(diceResult, total) {
        if (!this.historyElement) return;
        
        const timeString = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const historyItem = {
            dice: this.selectedDice,
            result: diceResult,
            modifier: this.modifier,
            total: total,
            time: timeString
        };
        
        this.rollHistory.unshift(historyItem);
        this.updateHistoryDisplay();
    }
    
    updateHistoryDisplay() {
        if (!this.historyElement) return;
        
        this.historyElement.innerHTML = '';
        
        this.rollHistory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'history-item';
            itemDiv.style.cssText = 'padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 5px;';
            
            const modifierText = item.modifier !== 0 ? 
                `<span style="color: #8a8a8a;">${item.modifier > 0 ? '+' : ''}${item.modifier}</span>` : '';
            
            const totalText = item.modifier !== 0 ?
                `<span style="margin: 0 5px; color: #8a8a8a">=</span>
                 <span style="color: #00ff88;">${item.total}</span>` : '';
            
            itemDiv.innerHTML = `
                <div>
                    <strong style="color: #00d4ff;">${item.dice.toUpperCase()}</strong>
                    <small style="color: #8a8a8a; margin-left: 10px;">${item.time}</small>
                </div>
                <div>
                    <span>${item.result}</span>
                    ${modifierText}
                    ${totalText}
                </div>
            `;
            
            this.historyElement.appendChild(itemDiv);
        });
    }
    
    clearHistory() {
        this.rollHistory = [];
        this.updateHistoryDisplay();
        if (this.currentResult) {
            this.currentResult.innerHTML = '-';
        }
    }
}

// Запуск приложения
async function initApp() {
    console.log('=== Запуск D&D Dice Roller ===');
    
    try {
        const roller = new DiceRoller();
        await roller.init();
        console.log('Приложение успешно инициализировано!');
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                roller.rollDice();
            }
            if (e.code === 'Escape') {
                roller.clearHistory();
            }
        });
        
        window.diceRoller = roller; // Для отладки в консоли
        
    } catch (error) {
        console.error('Критическая ошибка инициализации:', error);
        document.body.innerHTML += `
            <div style="position: fixed; top: 10px; right: 10px; background: #ff4d4d; color: white; padding: 15px; border-radius: 5px; z-index: 9999;">
                <strong>Ошибка приложения:</strong><br>
                ${error.message}
            </div>
        `;
    }
}

// Запускаем когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}