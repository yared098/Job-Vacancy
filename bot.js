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
      bot.sendMessage(chatId, ` ${jobsItem.title}\n ${jobsItem.dis}\nURL: ${jobsItem.url}`, {
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
  bot.sendMessage(chatId, 'Loading jobs detail.....!');
});


let pendingCVApplications = {};
// let jobDataStore = {}; // Store job data separately
// Handle apply button click
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (data.startsWith('apply_')) {
    const jobsId = parseInt(data.split('_')[1], 10);
    const jobsData = await fetchJobsData();
    const job = jobsData.find(item => item.id === jobsId);
    // const img_url=job.imgurl;
    // const img_url = encodeURIComponent(job.imgurl);

    if (job) {
      bot.sendMessage(message.chat.id, 'ስልክ ቁጥርዎን ያጋሩ and @username:', {
        reply_markup: {
          keyboard: [
            [{ text: 'እባክዎን ስልክ ቁጥርዎን ያጋሩ', request_contact: true }]
          ],
          one_time_keyboard: true
        }
      });

      bot.once('contact', async (msg) => {
        const phoneNumber = msg.contact.phone_number;
        const username = msg.from.username;
        const chatid = msg.chat.id;

        if (job.applytype === 'normal') {
          try {
            // Send the data to the job poster
            await bot.sendMessage(job.telegram_id, `New job application:\nJob ID: ${job.id}\nTitle: ${job.title}\nPhone Number: ${phoneNumber}\nApplicant Username: ${username}`, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Accept', callback_data: `accept_${chatid}_${phoneNumber}`}],
                  [{ text: 'Decline', callback_data: `decline_${chatid}` }]
                ]
              }
            });

            bot.sendMessage(message.chat.id, 'Your application has been submitted successfully!');
          } catch (error) {
            console.error('Error sending application data:', error);
            bot.sendMessage(message.chat.id, 'There was an error submitting your application. Please try again later.');
          }
        } else {
          pendingCVApplications[message.chat.id] = {
            job,
            phoneNumber,
            username
          };

          bot.sendMessage(message.chat.id, 'Please send your CV as a PDF file.',
            {
              reply_markup: {
                remove_keyboard: true
              }
            }
          );
        }
      });
    } else {
      bot.sendMessage(message.chat.id, 'Invalid job ID. Please try again.');
    }
  } else if (data.startsWith('accept_')) {
    const data_value = data.split('_');
    const [_, username, phoneNumber] = data.split('_');
    // console.log(data_value)

    bot.sendMessage(message.chat.id, `Application accepted for user @${username} phone number ${phoneNumber}. Phone number:${data_value[2]} `);
    const caption = 'Your application has been accepted!';
    bot.sendPhoto(username, `https://mycvcreator.com/administrator/postimages/64f4ccbe60a898.50803560.jpg`, { caption: caption })
      .then((response) => {
        // console.log('Photo sent successfully:', response);
      })
      .catch((error) => {
        console.error('Error sending photo:', error);
      });
    // bot.sendPhoto(username, 'Your application has been accepted!');
  } else if (data.startsWith('decline_')) {
    const username = data.split('_')[1];

    bot.sendMessage(message.chat.id, `Application declined for user @${username}.`);
    bot.sendMessage(username, 'Your application has been rejected.');
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;

  if (pendingCVApplications[chatId]) {
    try {
      const { job, phoneNumber, username } = pendingCVApplications[chatId];
      delete pendingCVApplications[chatId];

      if (msg.document.mime_type === 'application/pdf') {
        const fileId = msg.document.file_id;

        // Send the CV PDF to the job poster
        await bot.sendDocument(job.telegram_id, fileId, {}, {
          caption: `New job application:\nJob ID: ${job.id}\nTitle: ${job.title}\nApplicant Username: @${username}\nPhone Number: ${phoneNumber}`
        });

        bot.sendMessage(chatId, 'Your application has been submitted successfully!');
      } else {
        bot.sendMessage(chatId, 'Please upload a valid PDF file.');
      }
    } catch (error) {
      console.error('Error sending CV:', error);
      bot.sendMessage(chatId, 'There was an error submitting your application. Please try again later.');
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


      // Generate the caption and truncate if necessary
      let caption = `${jobsItem.title}\n${jobsItem.sdes}\n${jobsItem.url}`;
      const captionMaxLength = 1024;

      if (caption.length > captionMaxLength) {
        caption = caption.substring(0, captionMaxLength - 3) + '...';
      }

      // Prepare message options
      let messageOptions = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Apply', callback_data: `apply_${jobsId}` }]
          ]
        },
        parse_mode: 'Markdown',
        //  caption: `${jobsItem.title}\n ${jobsItem.dis}\nURL: ${jobsItem.url}`
        caption: caption
      };

      // this is send to the  channel  deap linking 
      let messageOptions_channel = {
        reply_markup: {
          inline_keyboard: [
            [{ text: `${jobsItem.btnname}`, url: deepLinkUrl }]
          ]
        },
        caption: caption
      }

      if (jobsItem.imgurl) {
        try {
          // Send photo with caption and inline keyboard  in the channel
          const sentMessage = await bot.sendPhoto(channelId, jobsItem.imgurl, messageOptions_channel);
          // send message to the bot 
          await bot.sendMessage(chatId, `successfully posted \nJob id :${jobsItem.id}  \n${jobsItem.title} \n Company user name ${jobsItem.username}`);
          // Send a separate message to the channel with a truncated description and apply button
          // await bot.sendMessage(chatId, ` ${jobsItem.title}\n ${truncateText(jobsItem.dis, 10)}`, {
          //   messageOptions
          // });
          // console.log('Message sent successfully:', sentMessage);
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