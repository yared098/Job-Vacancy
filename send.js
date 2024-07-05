// const TelegramBot = require('node-telegram-bot-api');
// require('dotenv').config(); // Load environment variables from .env file

// const token = process.env.TELEGRAM_BOT_TOKEN;
// const channelId = process.env.TELEGRAM_CHANNEL_ID; // Replace with your channel ID

// const bot = new TelegramBot(token, { polling: true });

// // Example function to send a message with an inline keyboard and pin it
// async function sendMessageAndPin() {
//   try {
//     const botUsername = 'yeneridebot'; // Replace with your bot's username

//     // Create inline keyboard markup with two rows of buttons
//     const inlineKeyboard = {
//       inline_keyboard: [
//         [{ text: 'ይፖስቱ/post jobs', callback_data: 'apply_job' }],
//         [{ text: 'ይቀጠሩ/apply', callback_data: 'show_job' }]
//       ]
//     };

//     // Send a message with inline keyboard to the channel
//     const sentMessage = await bot.sendMessage(channelId, 'Click below to apply for a job or to show something:', {
//       reply_markup: inlineKeyboard
//     });

//     // Pin the sent message to the top of the channel
//     await bot.pinChatMessage(channelId, sentMessage.message_id);

//     console.log('Message sent with buttons and pinned successfully.');
//   } catch (error) {
//     console.error('Error sending message with buttons and pinning:', error);
//   }
// }

// // Handle callback queries from inline keyboard buttons
// bot.on('callback_query', async (callbackQuery) => {
//   const chatId = callbackQuery.message.chat.id;
//   const data = callbackQuery.data;

//   if (data === 'apply_job') {
//     try {
//       // Replace with the username to contact
//       const contactUsername = 'yared_122';
      
//       // Send a contact message to the specified username
//       await bot.sendMessage(chatId, `Contact me @${contactUsername}`, {
//         reply_markup: {
//           keyboard: [
//             [{ text: 'Contact Me', request_contact: true }]
//           ],
//           one_time_keyboard: true
//         }
//       });
//     } catch (error) {
//       console.error('Error sending contact message:', error);
//       bot.sendMessage(chatId, 'There was an error processing your request. Please try again later.');
//     }
//   } else if (data === 'show_job') {
//     const botUsername = 'yeneridebot'; // Replace with your bot's username
//     const deepLinkUrl = `https://t.me/${botUsername}?start=jobs`; // Modify the URL as needed

//     try {
//       // Send a deep link message to show job details
//       await bot.sendMessage(chatId, deepLinkUrl);
//     } catch (error) {
//       console.error('Error sending show job message:', error);
//       bot.sendMessage(chatId, 'There was an error processing your request. Please try again later.');
//     }
//   }
// });

// // Call the function to send a message with buttons and pin it
// sendMessageAndPin();
