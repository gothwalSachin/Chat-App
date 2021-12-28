const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $message = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// autoscroll functionality

const autoscroll = () => {
  const $newMessage = $message.lastElementChild; // new message

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom); // marghin heights for new message
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin; //new message height

  const visibleHeight = $message.offsetHeight; // visible height

  const containerHeight = $message.scrollHeight; // height of message container

  const scrollOffset = $message.scrollTop + visibleHeight; // how far we have scrolled

  if (containerHeight - newMessageHeight <= scrollOffset) {
    //are we at the bottom or not
    $message.scrollTop = $message.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);

  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $message.insertAdjacentHTML("beforeend", html);

  autoscroll();
});

socket.on("locationMessage", (message) => {
  console.log(message);

  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $message.insertAdjacentHTML("beforeend", html);

  autoscroll();
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");

  let textMessage = $messageFormInput.value;
  socket.emit("sendMessage", textMessage, (message) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    console.log(message);
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation)
    return alert("Geolocation is not supported by your browser!");

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (message) => {
        console.log(message);
        $sendLocationButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});
