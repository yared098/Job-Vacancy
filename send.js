// send.js

async function sendMessageAndPin(bot, botUsername, channelId) {
    try {
      // Create inline keyboard markup with a single button
      const inlineKeyboard = {
        inline_keyboard: [
          [{ text: 'ይቅጠሩ /ይቀጠሩ', url: `https://t.me/${botUsername}?start=contact` }]
        ]
      };
  
      // Send a message with inline keyboard to the channel
      const sentMessage = await bot.sendMessage(channelId, 'Click below to apply:', {
        reply_markup: inlineKeyboard
      });
  
      // Pin the sent message to the top of the channel
      await bot.pinChatMessage(channelId, sentMessage.message_id);
  
      console.log('Message sent with buttons and pinned successfully.');
    } catch (error) {
      console.error('Error sending message with buttons and pinning:', error);
    }
  }
  
  module.exports = sendMessageAndPin;
  