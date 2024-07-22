const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

const channelId = process.env.TELEGRAM_CHANNEL_ID;

const apiUrl = 'https://playapicevirtual-h012.com/api/job';
function Post_jobs(bot) {
  bot.onText(/\/post/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Please provide the job ID you are interested in:');

    bot.once('message', async (msg) => {
      const jobsId = parseInt(msg.text, 10);
      const jobsData = await fetchJobsData();
      const jobsItem = jobsData.find(item => item.id === jobsId);




      if (jobsItem) {
        //this is bot user name send to the bot 
        const botUsername = process.env.BOT_USERNAME; // Replace with your bot's username
        const deepLinkUrl = `https://t.me/${botUsername}?start=jobs_${jobsId}`;

        // Generate the caption and truncate if necessary
        let caption = `${jobsItem.smalldescription}\n${jobsItem.jobURL}`;
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
          caption: caption
        };

        // this is send to the  channel  deep linking 
        let messageOptions_channel = {
          reply_markup: {
            inline_keyboard: [
              [{ text: `${jobsItem.buttonName}`, url: deepLinkUrl }]
            ]
          },
          caption: caption
        };

        if (jobsItem.jobImage) {
          try {
            // Send photo with caption and inline keyboard  in the channel
            const sentMessage = await bot.sendPhoto(`${channelId}`, jobsItem.jobLogo, messageOptions_channel);
            // send message to the bot 
            await bot.sendMessage(chatId, `successfully posted \nJob id :${jobsItem.id}  \n${jobsItem.title} \n Company user name ${jobsItem.username}`);
          } catch (error) {
            // console.error('Error sending message:', error.response.body);
            bot.sendMessage(chatId, 'There was an error sending the job details. Please try again later.');
          }
        } else {

          bot.sendMessage(chatId, `successfully posted with out job logo \nJob id :${jobsItem.id}  \n${jobsItem.title} \n Company user name ${jobsItem.username} `);
          await bot.sendPhoto(`${channelId}`, jobsItem.jobLogo, messageOptions_channel);
        }
      } else {
        bot.sendMessage(chatId, 'Invalid job ID. Please try again.....');
      }
    });
  });
}

// Function to fetch jobs data from the API
const fetchJobsData = async () => {
  try {
    const response = await axios.get(apiUrl);

    // Check if the response contains data and return it, otherwise return an empty array
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      // console.error('Unexpected response format:', response.data);
      return [];
    }
  } catch (error) {
    // console.error('Error fetching jobs data:', error.message);
    return [];
  }
};
module.exports=Post_jobs;