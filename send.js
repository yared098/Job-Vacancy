async function sendPhotoAndPin(bot, botUsername, channelId) {

  const photoUrl="https://i.ibb.co/6sjntdb/addis-ababa-jobs.jpg";
  try {
    // Create inline keyboard markup with a single button
    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: 'ይቅጠሩ/ይቀጠሩ', url: `https://t.me/${botUsername}?start=contact` }]
      ]
    };

    // Send a photo with inline keyboard to the channel
    const sentMessage = await bot.sendPhoto(channelId, photoUrl, {
      caption: `💫ለቀጣሪዎች

🔹ውድ ደንበኛችን በዚህ የቴሌግራም ቻናል ላይ ስራዎትን ለመለጠፍ እና ሀሳብ አስተያየትዎን ለመስጠት👇
📮ቴሌግራም: @addis_ababa_jobs_1
🔸 የለጠፉት የስራ ማስታወቂያ ላይ:👷‍♂️👷‍♀️ ያመለከቱ የስራ ፈላጊዎችን አድራሻ በዚሁ ቦት/Bot/ ላይ የምንልክልዎት ይሆናል ::

💫ለተቀጣሪዎች

💼 ውድ ደንበኛችን በለጠፍነው የስራ ቅጥር ማስታወቂያ ላይ ባመለከቱት የስራ አይነት ቀጣሪዎቹ ያላቸውን ግምገማ እና ምላሽ ለማወቅ ይህንኑ ቦት ይከታተሉ::

👆 ወደ ላይ ይመልከቱ

🙏ምርጫዎት ስላደረጉን ከልብ እናመስግናለን::`,
      reply_markup: inlineKeyboard
    });

    // Pin the sent message to the top of the channel
    await bot.pinChatMessage(channelId, sentMessage.message_id);

    console.log('Photo sent with buttons and pinned successfully.');
  } catch (error) {
    console.error('Error sending photo with buttons and pinning:', error);
  }
}

module.exports = sendPhotoAndPin;
