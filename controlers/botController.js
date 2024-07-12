const TelegramBot = require('node-telegram-bot-api');
const sendPhotoAndPin = require('../send');
const { contactInfo, getJobMessage } = require('../views/messages');
const { fetchJobsData } = require('../Models/jobs');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const bot = new TelegramBot(token, { polling: true });
const botUsername = 'addis_ababa_job_bot'; // Replace with your bot's username

bot.onText(/\/pin/, (msg) => {
  const chatId = msg.chat.id;
  sendPhotoAndPin(bot, botUsername, channelId);
});

bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const param = match[1];

  if (param.startsWith("contact")) {
    bot.sendMessage(chatId, contactInfo);
  } else if (param.startsWith('jobs_')) {
    const jobsId = parseInt(param.split('_')[1], 10);
    const jobsData = await fetchJobsData();
    const jobsItem = jobsData.find(item => item.id === jobsId);

    if (jobsItem) {
      const jobMessage = getJobMessage(jobsItem, jobsId);
      bot.sendPhoto(chatId, jobsItem.jobImage);
      bot.sendMessage(chatId, jobMessage);
    } else {
      bot.sendMessage(chatId, 'Invalid job ID. Please try again.');
    }
  } else {
    bot.sendMessage(chatId, 'Welcome! Use the button in the channel to get the latest job details.');
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'ይጠብቁ......!');
});

bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, contactInfo);
});

bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (data.startsWith('send_response_')) {
    const [_, username, jobtitile] = data.split('_').slice(1);
    bot.sendMessage(username, `Job Title : ${jobtitile} \n your application for the job is not accepted, @${username}.`);
    bot.answerCallbackQuery(callbackQuery.id);
  } else if (data.startsWith('apply_')) {
    // Handle apply logic here...
  } else if (data.startsWith('accept_')) {
    // Handle accept logic here...
  } else if (data.startsWith('decline_')) {
    // Handle decline logic here...
  }
});

module.exports = bot;
