
function displayTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    return timeString;
}

const socket = io();

document.addEventListener('DOMContentLoaded', function () {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const chatScroll = document.getElementById('chat-scroll');

    function addMessageToChat(message) {
        chatWindow.innerHTML += `<p>${message}</p>`;
        // Прокрутка вниз при добавлении нового сообщения
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }

    function sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('message', message);

            const formattedMessage = `[Вы, ${displayTime()}]: ${message}`;

            addMessageToChat(formattedMessage);

            // сохранениее сообщения в локальное хранилище браузера
            const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
            storedMessages.push(formattedMessage);
            localStorage.setItem('chatMessages', JSON.stringify(storedMessages));

            messageInput.value = '';
        }
    }

    // принятие "message"
    socket.on('message', (message) => {
        addMessageToChat(message);
        const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        storedMessages.push(message);
        localStorage.setItem('chatMessages', JSON.stringify(storedMessages));
    });

    // загрузка сообщений из локал хранилища брауз
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    storedMessages.forEach((message) => {
        addMessageToChat(message);
    });

    // отправка сообщения по ентеру
    messageInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
});