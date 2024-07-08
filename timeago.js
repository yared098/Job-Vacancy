const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const channelId = process.env.TELEGRAM_CHANNEL_ID;

// Declare timerInterval, startTime, and goInterval globally
let timerInterval;
let startTime;
let goInterval;
let goMessageId; // Store the message ID for the /go command response

// Function to update the message with countdown timer
const updateMessageWithTimer = async (chatId, messageId, originalText, startTime) => {
  const currentTime = new Date();
  const elapsedTime = Math.floor((currentTime - startTime) / 1000); // Elapsed time in seconds
  const remainingTime = 60 - elapsedTime % 60; // Countdown from 1 minute

  if (remainingTime > 0) {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const timerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    const newText = `YeneRide channel new job post with countdown timer\nAllowed time: ${originalText}\nTime left: ${timerText}`;
    await bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: messageId,
    });
  } else {
    const newText = `${originalText}\nTime's up!`;
    await bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: messageId,
    });
  }
};

// Function to start countdown timer updates
const startUpdatingTimer = (chatId, messageId, originalText, startTime) => {
  // Update timer every second
  timerInterval = setInterval(() => {
    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000); // Elapsed time in seconds

    // Update the timer if elapsed time is less than 10 seconds
    if (elapsedTime < 10) {
      updateMessageWithTimer(chatId, messageId, originalText, startTime);
    } else {
      // Clear interval after 10 seconds
      clearInterval(timerInterval);
    }
  }, 1000);
};

// Command to post a new message with countdown timer to the channel
bot.onText(/\/post (.+)/, async (msg, match) => {
  const postText = match[1];
  startTime = new Date();

  // Send the initial message to the channel
  const sentMessage = await bot.sendMessage(channelId, `new post job with timer\n${postText}\nTimer: 1:00`);

  // Start updating the message with countdown timer
  startUpdatingTimer(channelId, sentMessage.message_id, postText, startTime);
});

// Function to update the elapsed time message every second
const startUpdatingElapsedTime = async (chatId) => {
  goInterval = setInterval(async () => {
    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000); // Elapsed time in seconds
    const elapsedTimeText = `New job has been posted!\nPosted ${elapsedTime} seconds ago.`;
    await bot.editMessageText(elapsedTimeText, {
      chat_id: chatId,
      message_id: goMessageId,
    });
  }, 1000);
};

// Command to show how much time has passed since the start time
bot.onText(/\/go/, async (msg) => {
  const chatId = msg.chat.id;

  if (startTime) {
    if (goInterval) {
      clearInterval(goInterval); // Clear any existing interval to avoid multiple intervals
    }
    // Send the initial message and store the message ID
    const goMessage = await bot.sendMessage(chatId, "New job has been posted!\nPosted 0 seconds ago.");
    goMessageId = goMessage.message_id;
    startUpdatingElapsedTime(chatId);
  } else {
    bot.sendMessage(chatId, "No timer has been started yet.");
  }
});

// Handle /start command to greet the user
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Welcome! Use /post <your message> to post a message with a countdown timer to the channel. Use /go to see how much time has passed since the timer started.");
});

console.log("Bot started polling.");
