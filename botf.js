const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const bot = new Telegraf(token);

const apiUrl = 'https://playapicevirtual-h012.com/api/job';

const contactInfo = `
Phone Number: 0909090904
Telegram Username: @johdan2

Description: Hi, I am Johdan2. Feel free to reach out to me!
`;

// Function to fetch jobs data from the API
const fetchJobsData = async () => {
    try {
        const response = await axios.get(apiUrl);
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        } else {
            console.error('Unexpected response format:', response.data);
            return [];
        }
    } catch (error) {
        console.error('Error fetching jobs data:', error.message);
        return [];
    }
};

// Handle /start command with and without parameters
bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const param = ctx.startPayload; // Access the parameter passed with /start
    if (param === 'contact') {
        ctx.reply(contactInfo);
    } else if (param.startsWith('jobs_')) {
        const jobsId = parseInt(param.split('_')[1], 10);
        const jobsData = await fetchJobsData();
        const jobsItem = jobsData.find(item => item.id === jobsId);
        if (jobsItem) {
            ctx.replyWithPhoto(jobsItem.jobImage, {
                caption: `${jobsItem.title}\n${jobsItem.detailDescription}\n${jobsItem.jobURL}`,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Apply', callback_data: `apply_${jobsId}` }]
                    ]
                }
            });
        } else {
            ctx.reply('Invalid job ID. Please try again.');
        }
    } else {
        ctx.reply('Welcome! Use the button in the channel to get the latest job details.');
    }
});

// Handle /pin command
bot.command('pin', (ctx) => {
    const chatId = ctx.chat.id;
    // Implement sendMessageAndPin logic here
    ctx.reply('Implement your /pin command logic here...');
});

// Handle /contact command
bot.command('contact', (ctx) => {
    ctx.reply(contactInfo);
});

// Handle button clicks or callbacks
bot.action(/apply_(\d+)/, async (ctx) => {
    const jobsId = parseInt(ctx.match[1], 10);
    const jobsData = await fetchJobsData();
    const job = jobsData.find(item => item.id === jobsId);
    if (job) {
        // Handle application logic here
        ctx.reply('Handle application logic here...');
    } else {
        ctx.reply('Invalid job ID. Please try again.');
    }
});

// Handle other actions as needed...

// Handle /post command
bot.command('post', async (ctx) => {
    ctx.reply('Please provide the job ID you are interested in:');
    bot.on('text', async (msg) => {
        const jobsId = parseInt(msg.message.text, 10);
        const jobsData = await fetchJobsData();
        const jobsItem = jobsData.find(item => item.id === jobsId);

        if (jobsItem) {
            const deepLinkUrl = `https://t.me/${bot.options.username}?start=jobs_${jobsId}`;
            const caption = `${jobsItem.smalldescription}\n${jobsItem.jobURL}`;

            // Prepare message options
            let messageOptions = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Apply', callback_data: `apply_${jobsId}` }]
                    ]
                },
                caption: caption
            };

            if (jobsItem.jobImage) {
                try {
                    await ctx.replyWithPhoto(jobsItem.jobImage, messageOptions);
                    await ctx.reply(`Successfully posted\nJob ID: ${jobsItem.id}\nTitle: ${jobsItem.title}\nCompany Username: ${jobsItem.username}`);
                } catch (error) {
                    console.error('Error sending message:', error.response.body);
                    ctx.reply('There was an error sending the job details. Please try again later.');
                }
            } else {
                ctx.reply(`Title: ${jobsItem.title}\nDescription: ${jobsItem.detailDescription}\n${jobsItem.jobURL}`, messageOptions);
            }
        } else {
            ctx.reply('Invalid job ID. Please try again.');
        }
    });
});

// Handle /webapp command
bot.command('webapp', (ctx) => {
    const webAppUrl = 'https://safecrop1.com.lewetat.com/'; // Replace with your web app URL
    ctx.reply('Click the button below to open the web app:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Open Web App', url: webAppUrl }]
            ]
        }
    });
});

// Handle errors
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}`, err);
});

// Start polling
bot.launch().then(() => {
    console.log('Bot started polling.');
}).catch((err) => {
    console.error('Error starting bot:', err);
});
