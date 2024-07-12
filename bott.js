const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config(); // Load environment variables from .env file


const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: { interval: 3000, timeout: 10 } });

bot.on("polling_error", (error) => {
  console.error(`Polling error: ${error.code}`, error.message);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to Addis! Use /reg to register.');
});

bot.onText(/\/reg/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Please enter your name:')
    .then((msg) => {
      const previousMessageId = msg.message_id;
      bot.once('message', async (msg) => {
        const name = msg.text;
        await bot.deleteMessage(chatId, previousMessageId);

        bot.sendMessage(chatId, 'Please enter your phone number:')
          .then((msg) => {
            const phoneMessageId = msg.message_id;
            bot.once('message', async (msg) => {
              const phone = msg.text;
              await bot.deleteMessage(chatId, phoneMessageId);

              bot.sendMessage(chatId, 'Please enter your address:')
                .then((msg) => {
                  const addressMessageId = msg.message_id;
                  bot.once('message', async (msg) => {
                    const address = msg.text;
                    await bot.deleteMessage(chatId, addressMessageId);

                    bot.sendMessage(chatId, `Thank you!\nName: ${name}\nPhone: ${phone}\nAddress: ${address}`);
                  });
                });
            });
          });
      });
    });
});
