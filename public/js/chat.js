const socket = io();

const form = document.querySelector('#message-form');
const $messageFormInput = form.querySelector('#input');
const submitBtn = form.querySelector('#submit');
const sendLocationBtn = document.querySelector('#send-location');
const displayMessages = document.querySelector('#display-msg');
const locationMsg = document.querySelector('.location');
const title = document.querySelector('.title');
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const $messages = document.querySelector('#messages');

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });
const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

const printMessages = (msg) => {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `<span class="message__name">${msg.username}</span> ${moment(
    msg.createdAt
  ).format('hh:mm a')} - ${msg.text}`;
  displayMessages.insertAdjacentElement('beforeend', div);
  autoscroll();
};

function onSubmit(e) {
  e.preventDefault();
  submitBtn.setAttribute('disabled', 'disabled');
  const message = e.target.elements.message.value;

  socket.emit('sendMessage', message, () => {
    submitBtn.removeAttribute('disabled');
    e.target.elements.message.value = '';
    $messageFormInput.focus();
  });
}

form.addEventListener('submit', onSubmit);

socket.on('message', (message) => {
  printMessages(message);
});

socket.on('view-msg', (message) => {
  printMessages(message);
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});

sendLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  sendLocationBtn.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (str) => {
        sendLocationBtn.removeAttribute('disabled');
      }
    );
  });
});

socket.on('geo', (message) => {
  const div = document.createElement('div');
  const a = document.createElement('a');
  a.href = message.url;
  div.innerHTML = `${message.username} ${moment(message.createdAt).format('h:mm a')} - `;
  a.innerHTML = '<b>My current location</b>';
  div.append(a);
  displayMessages.append(div);
  autoscroll;
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    window.location.href = '/';
  }
});
