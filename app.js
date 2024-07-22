const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN1;
const bot = new TelegramBot(token, { polling: true });

// State management
const userState = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userState[chatId] = { step: 2 };
    bot.sendMessage(chatId, 'Welcome! What is your name?');
});

bot.on('message', (msg) => {
  
    const chatId = msg.chat.id;
    console.log(userState[chatId]);

    if (!userState[chatId]) return;
    
    

    const currentStep = userState[chatId].step;
    console.log(currentStep);
    switch (currentStep) {
        case 1:
            userState[chatId].name = msg.text;
            userState[chatId].step = 2;
            bot.sendMessage(chatId, 'What is your age?');
            break;
        case 2:
            userState[chatId].age = msg.text;
            userState[chatId].step = 3;
            bot.sendMessage(chatId, 'Please share your phone number.', {
                reply_markup: {
                    keyboard: [
                        [{ text: 'Share contact', request_contact: true }]
                    ],
                    one_time_keyboard: true
                }
            });
            break;
        case 3:
            if (msg.contact && msg.contact.phone_number) {
                userState[chatId].phone = msg.contact.phone_number;
                userState[chatId].step = 4;
                bot.sendMessage(chatId, 'What is your address?');
            } else {
                bot.sendMessage(chatId, 'Please share your phone number using the button.');
            }
            break;
        case 4:
            const address = msg.text;
            if (address.length < 15) {
                bot.sendMessage(chatId, 'Your address is too short. Please enter an address that is at least 15 characters long.');
            } else if (address.length > 100) {
                bot.sendMessage(chatId, 'Your address is too long. Please enter an address that is no more than 100 characters long.');
            } else {
                userState[chatId].address = address;
                bot.sendMessage(chatId, `Thank you! Here is the information you provided:\n\nName: ${userState[chatId].name}\nAge: ${userState[chatId].age}\nPhone: ${userState[chatId].phone}\nAddress: ${userState[chatId].address}`);
                delete userState[chatId]; // Clear the state
            }
            break;
        default:
            bot.sendMessage(chatId, 'Invalid state.');
            delete userState[chatId]; // Clear the state
            break;
    }
});

// const TelegramBot = require('node-telegram-bot-api');
// require('dotenv').config();

// const token = process.env.TELEGRAM_BOT_TOKEN1;
// const bot = new TelegramBot(token, { polling: true });

// // State management
// const userState = {};

// // Define states
// const STATES = {
//   INIT: 'init',
//   ASK_NAME: 'ask_name',
//   ASK_AGE: 'ask_age',
//   ASK_PHONE: 'ask_phone',
//   ASK_ADDRESS: 'ask_address',
//   DONE: 'done'
// };

// // Transitions
// const transitions = {
//   [STATES.INIT]: (context, msg) => {
//     context.step = STATES.ASK_NAME;
//     bot.sendMessage(msg.chat.id, 'Welcome! What is your name?');
//   },
//   [STATES.ASK_NAME]: (context, msg) => {
//     context.name = msg.text;
//     context.step = STATES.ASK_AGE;
//     bot.sendMessage(msg.chat.id, 'What is your age?');
//   },
//   [STATES.ASK_AGE]: (context, msg) => {
//     context.age = msg.text;
//     context.step = STATES.ASK_PHONE;
//     bot.sendMessage(msg.chat.id, 'Please share your phone number.', {
//       reply_markup: {
//         keyboard: [[{ text: 'Share contact', request_contact: true }]],
//         one_time_keyboard: true,
//       },
//     });
//   },
//   [STATES.ASK_PHONE]: (context, msg) => {
//     if (msg.contact && msg.contact.phone_number) {
//       context.phone = msg.contact.phone_number;
//       context.step = STATES.ASK_ADDRESS;
//       bot.sendMessage(msg.chat.id, 'What is your address?');
//     } else {
//       bot.sendMessage(msg.chat.id, 'Please share your phone number using the button.');
//     }
//   },
//   [STATES.ASK_ADDRESS]: (context, msg) => {
//     const address = msg.text;
//     if (address.length < 15) {
//       bot.sendMessage(msg.chat.id, 'Your address is too short. Please enter an address that is at least 15 characters long.');
//     } else if (address.length > 100) {
//       bot.sendMessage(msg.chat.id, 'Your address is too long. Please enter an address that is no more than 100 characters long.');
//     } else {
//       context.address = address;
//       context.step = STATES.DONE;
//       bot.sendMessage(msg.chat.id, `Thank you! Here is the information you provided:\n\nName: ${context.name}\nAge: ${context.age}\nPhone: ${context.phone}\nAddress: ${context.address}`);
//       delete userState[msg.chat.id]; // Clear the state
//     }
//   },
//   [STATES.DONE]: (context, msg) => {
//     bot.sendMessage(msg.chat.id, 'You have already completed the process.');
//   }
// };

// // Handle /start command
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   if (!userState[chatId] || userState[chatId].step === STATES.DONE) {
//     userState[chatId] = { step: STATES.INIT };
//     transitions[STATES.INIT](userState[chatId], msg);
//   } else {
//     bot.sendMessage(chatId, 'You are already in the middle of the process. Please complete the current step.');
//   }
// });

// // Handle other messages
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   if (!userState[chatId]) return;

//   const context = userState[chatId];
//   transitions[context.step](context, msg);
// });

