const socket = io();

const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('file');

let userName = prompt("Please enter your name:");
if (userName) {
  alert("Hello, " + userName + "!");
  nameInput.value = userName;
} else {
  alert("You didn’t enter a name.");
}
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!messageInput.value.trim()) return;

  const data = {
    name: nameInput.value,
    message: messageInput.value,
    type: 'text',
    dateTime: new Date(),
  };
  socket.emit('message', data);
  addMessageToUI(true, data);
  messageInput.value = '';
});

socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`;
});
socket.on('chat-message', (data) => {
  addMessageToUI(false, data);
});

function addMessageToUI(isOwnMessage, data) {
  clearFeedback();
  let content = '';

  if (data.type === 'image') {
    content = `<img src="${data.message}" style="max-width:200px; border-radius:8px;">`;
  } else if (data.type === 'file') {
    const filename = data.message.split('/').pop();
    content = `<a href="${data.message}" download="${filename}">📂 Download ${filename}</a>`;
  } else {
    content = data.message;
  }

  const element = `
    <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
      <p class="message">
        ${content}
        <span>${data.name}</span>
      </p>
    </li>
  `;

  messageContainer.innerHTML += element;
  scrollToBottom();
}

function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}
messageInput.addEventListener('focus', () => {
  socket.emit('feedback', { feedback: `✍️ ${nameInput.value} is typing...` });
});
messageInput.addEventListener('keypress', () => {
  socket.emit('feedback', { feedback: `✍️ ${nameInput.value} is typing...` });
});
messageInput.addEventListener('blur', () => {
  socket.emit('feedback', { feedback: '' });
});

socket.on('feedback', (data) => {
  clearFeedback();
  const element = `
    <li class="message-feedback">
      <p class="feedback" id="feedback">${data.feedback}</p>
    </li>
  `;
  messageContainer.innerHTML += element;
});

function clearFeedback() {
  document.querySelectorAll('li.message-feedback').forEach((el) => el.remove());
}
uploadButton.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  fetch('/upload', { method: 'POST', body: formData })
    .then((res) => res.json())
    .then((data) => {
      if (data.url) {
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        const messageData = {
          name: nameInput.value,
          message: data.url,
          type: type,
          dateTime: new Date(),
        };
        socket.emit('message', messageData);
        addMessageToUI(true, messageData);
        fileInput.value = '';
      }
    })
    .catch(() => alert('Upload failed!'));
});
