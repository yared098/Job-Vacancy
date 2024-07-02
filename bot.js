const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const bot = new TelegramBot(token, { polling: true });

const apiUrl = 'https://playapicevirtual-h012.com/api/job';

// Function to fetch jobs data from the API
const fetchJobsData = async () => {
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs data:', error);
    return [];
  }
};

// Function to truncate text to a specified number of lines
const truncateText = (text, maxLines) => {
  const lines = text.split('\n');
  if (lines.length > maxLines) {
    return lines.slice(0, maxLines).join('\n') + '...';
  }
  return text;
};

// Handle /start command with parameter
bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const param = match[1]; // the parameter passed to the /start command

  if (param.startsWith('jobs_')) {
    const jobsId = parseInt(param.split('_')[1], 10);
    const jobsData = await fetchJobsData();
    const jobsItem = jobsData.find(item => item.id === jobsId);
    if (jobsItem) {
      bot.sendMessage(chatId, `Title: ${jobsItem.title}\nDescription: ${jobsItem.dis}\nURL: ${jobsItem.url}`, {
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

// Handle /start command without parameter
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the job vacancy bot!');
});

// Handle apply button click
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (data.startsWith('apply_')) {
    const jobsId = parseInt(data.split('_')[1], 10);
    const jobsData = await fetchJobsData();
    const job = jobsData.find(item => item.id === jobsId);
    if (job) {
      bot.sendMessage(message.chat.id, 'Please share your phone number and username:', {
        reply_markup: {
          keyboard: [
            [{ text: 'Share my phone number', request_contact: true }]
          ],
          one_time_keyboard: true
        }
      });

      bot.once('contact', async (msg) => {
        try {
          const phoneNumber = msg.contact.phone_number;
          const username = msg.from.username;
          // console.log(username+ "is.................");
          // Send the data to the job poster
          await bot.sendMessage(job.username, `New job application:\nJob ID: ${job.id}\nTitle: ${job.title}\nPhone Number: ${phoneNumber}\nApplicant Username: ${username}`);

          bot.sendMessage(message.chat.id, 'Your application has been submitted successfully!');
        } catch (error) {
          console.error('Error sending application data:', error);
          bot.sendMessage(message.chat.id, 'There was an error submitting your application. Please try again later.');
        }
      });
    } else {
      bot.sendMessage(message.chat.id, 'Invalid job ID. Please try again.');
    }
  }
});

// Handle /post command
bot.onText(/\/post/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Please provide the job ID you are interested in:');
  
  bot.once('message', async (msg) => {
    const jobsId = parseInt(msg.text, 10);
    const jobsData = await fetchJobsData();
    const jobsItem = jobsData.find(item => item.id === jobsId);
    
    if (jobsItem) {
      const botUsername = 'yeneridebot'; // Replace with your bot's username
      const deepLinkUrl = `https://t.me/${botUsername}?start=jobs_${jobsId}`;
      
      // Prepare message options
      let messageOptions = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Apply', callback_data: `apply_${jobsId}` }]
          ]
        },
        parse_mode: 'Markdown'
      };

      if (jobsItem.imgurl) {
        // Truncate caption if it's too long
        const caption = `Title: ${jobsItem.title}\nDescription: ${jobsItem.dis}\nURL: ${jobsItem.url}`;
        messageOptions.caption = caption.length > 200 ? caption.substring(0, 200) + '...' : caption; // Example: Limiting caption to 200 characters
        
        try {
          const sentMessage = await bot.sendPhoto(chatId, jobsItem.imgurl, messageOptions); // Use sendPhoto method for sending images
          bot.sendMessage(channelId, `Title: ${jobsItem.title}\nDescription: ${truncateText(jobsItem.dis, 10)}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: `${jobsItem.btnname}`, url: deepLinkUrl }]
              ]
            }
          });
          console.log('Message sent successfully:', sentMessage);
        } catch (error) {
          console.error('Error sending message:', error.response.body);
          bot.sendMessage(chatId, 'There was an error sending the job details. Please try again later.');
        }
      } else {
        bot.sendMessage(chatId, `Title: ${jobsItem.title}\nDescription: ${jobsItem.dis}\nURL: ${jobsItem.url}`, messageOptions);
      }
    } else {
      bot.sendMessage(chatId, 'Invalid job ID. Please try again.');
    }
  });
});


// Handle /webapp command
bot.onText(/\/webapp/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = 'https://safecrop1.com.lewetat.com/'; // Replace with your web app HTTPS URL
  bot.sendMessage(chatId, 'Click the button below to open the web app:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Open Web App', url: webAppUrl }]
      ]
    }
  });
});

// Log bot start
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('Bot started polling.');
