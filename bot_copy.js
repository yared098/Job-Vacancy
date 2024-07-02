const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const token = '7051041206:AAEBD-hiCbbbKgEp-rypgfQ2JUZWIj0O1T4'; // Replace with your actual bot token
const channelId = '@yeneRide'; // Replace with your channel username or ID

const bot = new TelegramBot(token, { polling: true });

// Load news data
const newsDataPath = path.join(__dirname, 'news.json');
let newsData = JSON.parse(fs.readFileSync(newsDataPath, 'utf8'));

// Handle /start command with parameter
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const param = match[1]; // the parameter passed to the /start command

  if (param.startsWith('news_')) {
    const newsId = parseInt(param.split('_')[1], 10);
    const newsItem = newsData.find(item => item.id === newsId);
    if (newsItem) {
      bot.sendMessage(chatId, `Title: ${newsItem.title}\nDescription: ${newsItem.disc}\nURL: ${newsItem.url}` );
    } else {
      bot.sendMessage(chatId, 'Invalid news ID. Please try again.');
    }
  } else {
    bot.sendMessage(chatId, 'Welcome! Use the button in the channel to get the latest news details.');
  }
});

// Handle /start command without parameter
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use the button in the channel to get the latest news details.');
});

// Handle /news command
bot.onText(/\/news/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Please provide the news ID you are interested in:');
  bot.once('message', (msg) => {
    const newsId = parseInt(msg.text, 10);
    const newsItem = newsData.find(item => item.id === newsId);
    if (newsItem) {
      bot.sendMessage(chatId, `Title: ${newsItem.title}\nDescription: ${newsItem.disc}\nURL: ${newsItem.url}`);
      const botUsername = 'yeneridebot'; // Replace with your bot's username
      const deepLinkUrl = `https://t.me/${botUsername}?start1=news_${newsId}`;
      bot.sendMessage(channelId, `Title: ${newsItem.title}\nDescription: ${newsItem.disc}\nURL: ${newsItem.url}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'see more', url: deepLinkUrl }]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, 'Invalid news ID. Please try again.');
    }
  });
});

// Function to send a message with an inline button to the channel
const sendInlineButtonToChannel = async () => {
  try {
    const botUsername = 'yeneridebot'; // Replace with your bot's username
    const deepLinkUrl = `https://t.me/${botUsername}?start=get_latest_news`;

    await bot.sendMessage(channelId, 'Today new Jobs news:', {
    //   reply_markup: {
    //     inline_keyboard: [
    //       [{ text: 'Apply', url: deepLinkUrl }]
    //     ]
    //   }
    });
    console.log('Message with inline button sent to the channel.');
  } catch (error) {
    console.error('Error sending message to the channel:', error);
  }
};

// Log bot start
bot.on('polling_error', (error) => console.error('Polling error:', error));

console.log('Bot started polling.');

// Send an inline button message to the channel when the bot starts
sendInlineButtonToChannel();
