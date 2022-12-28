import bot from '../assets/bot.svg';
import user from '../assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat-container');
const micBtn = form.querySelector('#mic-btn');
const textArea = form.querySelector('textarea');

let loadInterval;

const loader = (elem) => {
    elem.textContent = '';

    loadInterval = setInterval(() => {
        elem.textContent += '.';

        if (elem.textContent === '....') {
            elem.textContent = '';    
        }
    }, 300);
};

const textTyping = (elem, text) => {
    let index = 0;

    let interval = setInterval(() => {
        if(index < text.length) {
            elem.innerHTML += text.charAt(index);
            index++;
        } else {
            clearInterval(interval);
        }
    }, 10);
};

const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
};

const chatStripe = (isAi, value, uniqueId) => {
    return (
        `
            <div class="wrapper ${isAi && 'ai'}">
                <div class="chat">
                    <div class="profile">
                        <img src="${isAi ? bot: user}" alt="${isAi ? 'bot': 'user'}">
                    </div>
                    <div class="message" id="${uniqueId}">
                        ${value}
                    </div>
                </div>
            </div>
        `
    );
};

const speechRecognitionFunc = () => {
    let speech = true;

    window.SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;

    const transcriptFunc = (e) => {
        const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript); 
        
        textArea.value = transcript;
    }

    recognition.addEventListener('result', transcriptFunc);

    if(speech) {
        recognition.start();
    }
}

const handleSubmit = async (e) => {
    e.preventDefault();  
    
    const data = new FormData(form);

    //user's
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

    form.reset();

    //bot's
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId);

    loader(messageDiv);

    //fetch data from server
    const response = await fetch('http://localhost:5000', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: data.get('prompt')
        })
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if(response.ok) {
        const data = await response.json();
        const parsedData = data.bot.trim();

        textTyping(messageDiv, parsedData);
    } else {
        const err = await response.text();

        messageDiv.innerHTML = 'Smth went wrong';
        alert(err);
    }
};

micBtn.addEventListener('click', speechRecognitionFunc);
form.addEventListener('submit', handleSubmit);
// form.addEventListener('keyup', (e) => {
//     if(e.keyCode === 13) {
//         handleSubmit(e);
//     }
// });