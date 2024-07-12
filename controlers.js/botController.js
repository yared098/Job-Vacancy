const { fetchJobsData } = require('../Models/');
const { contactInfo, formatJobMessage } = require('../views/messages');
const sendPhotoAndPin = require('../send');

const handleStartCommand = (bot) => {
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
        bot.sendPhoto(chatId, `${jobsItem.jobImage}`);
        bot.sendMessage(chatId, formatJobMessage(jobsItem), {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Apply', callback_data: `apply_${jobsId}` }]
            ]
          }
        });
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

  bot.onText(/\/pin/, (msg) => {
    const chatId = msg.chat.id;
    sendPhotoAndPin(bot, botUsername, channelId);
  });
  // add post /post command 
  bot.onText(/\/pin/,(msg)=>{
    const chatId=msg.chat.id;

  })
};

const handleCallbackQuery = (bot) => {
  bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;

    // Callback logic for different types of callback queries

    if (data.startsWith('apply_')) {
      // Logic for handling apply button click
    } else if (data.startsWith('accept_')) {
      // Logic for handling accept button click
    } else if (data.startsWith('decline_')) {
      // Logic for handling decline button click
    }
  });
};

module.exports = {
  handleStartCommand,
  handleCallbackQuery,
};
