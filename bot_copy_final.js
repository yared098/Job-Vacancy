const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file



const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const sendPhotoAndPin = require('./send'); // Corrected import statement
const botUsername = 'addis_ababa_job_bot'; // Replace with your bot's username

const bot = new TelegramBot(token, { polling: true });

const apiUrl = 'https://playapicevirtual-h012.com/api/job';


const contactInfo = `
💫ለቀጣሪዎች

🔹ውድ ደንበኛችን በዚህ የቴሌግራም ቻናል ላይ ስራዎትን ለመለጠፍ እና ሀሳብ አስተያየትዎን ለመስጠት👇
📮ቴሌግራም: @addis_ababa_jobs_1
🔸 የለጠፉት የስራ ማስታወቂያ ላይ:👷‍♂️👷‍♀️ ያመለከቱ የስራ ፈላጊዎችን አድራሻ በዚሁ ቦት/Bot/ ላይ የምንልክልዎት ይሆናል ::

💫ለተቀጣሪዎች

💼 ውድ ደንበኛችን በለጠፍነው የስራ ቅጥር ማስታወቂያ ላይ ባመለከቱት የስራ አይነት ቀጣሪዎቹ ያላቸውን ግምገማ እና ምላሽ ለማወቅ ይህንኑ ቦት ይከታተሉ::

👆 ወደ ላይ ይመልከቱ

🙏ምርጫዎት ስላደረጉን ከልብ እናመስግናለን::
`;

// Handle the /pin command
bot.onText(/\/pin/, (msg) => {
  const chatId = msg.chat.id;

  // Call the sendPhotoAndPin function
  sendPhotoAndPin(bot, botUsername, channelId);
});

// Function to fetch jobs data from the API
const fetchJobsData = async () => {
  try {
    const response = await axios.get(apiUrl);

    // Check if the response contains data and return it, otherwise return an empty array
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
  if (param.startsWith("contact")) {
    // console.log("well pin message ")
    bot.sendMessage(chatId, contactInfo);
  }

  if (param.startsWith('jobs_')) {
    const jobsId = parseInt(param.split('_')[1], 10);
    const jobsData = await fetchJobsData();
    const jobsItem = jobsData.find(item => item.id === jobsId);
    if (jobsItem) {
      // Generate the caption and truncate if necessary
      let captiontitle = `${jobsItem.title}`;
      bot.sendPhoto(chatId, `${jobsItem.jobImage}`);
      bot.sendMessage(chatId, ` ${jobsItem.title}\n ${jobsItem.detailDescription}\n ${jobsItem.jobURL}`, {
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
    // bot.sendMessage(chatId, 'Welcome! Use the button in the channel to get the latest job details.');
  }
});

// Handle /start command without parameter
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'ይጠብቁ......!');
});



// Handle the /contact command
bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, contactInfo);
});

// Record of user applications
const userApplications = {};

let pendingCVApplications = {};
// Handle apply button click
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (data.startsWith('apply_')) {
    const jobsId = parseInt(data.split('_')[1], 10);
    const chatId = message.chat.id;
    const jobsData = await fetchJobsData();
    const job = jobsData.find(item => item.id === jobsId);
    const jobtitile=job.title;

    if (job) {
      if (!job.telegram_id) {
        bot.sendMessage(chatId, `ይቅርታ በዚህ የስራ ዘርፍ ለማመልከት 
ቀጣሪ ድርጅቱን ባስቀመጥንሎት
አድራሻ ያነጋግሩአቸው።`);
        return;
      }

      if (userApplications[chatId] && userApplications[chatId].includes(jobsId)) {
        bot.sendMessage(chatId, 'ይቅርታ  ከአንድ ጊዜ በላይ በአንድ የቅጥር ማስታወቂያ ላይ ማመልከት አይችሉም።');
        return;
      }

      if (job.deadline && job.created_at) {
        const deadlineTime = new Date(job.deadline).getTime();
        const createdTime = new Date(job.created_at).getTime();

        if (isNaN(deadlineTime) || isNaN(createdTime)) {
          bot.sendMessage(chatId, 'ይቅርታ ያመለከቱን የስራ ማስታወቂያ የማመልከቻ ጊዜ ገደብ ተጠናቋል።');
          return;
        }

        if (deadlineTime <= createdTime) {
          bot.sendMessage(chatId, 'ይቅርታ ያመለከቱን የስራ ማስታወቂያ የማመልከቻ ጊዜ ገደብ ተጠናቋል።');
          return;
        }
      }

      const askJobId = () => {
        bot.sendMessage(chatId, 'የመረጡትን የስራ ዘርፍ መጠሪያ ያስገቡ');
        bot.once('message', (msg) => {
          const whichjob_applay = msg.text;
          askAboutYourself(whichjob_applay);
        });
      };

      const askAboutYourself = (whichjob_applay) => {
        bot.sendMessage(chatId, `ለሚያመለክቱት ስራ ብቁ እንደሆኑ የሚገልጽ አጠር ያለ የማመልከቻ መልዕክት ይፃፉ፤ ማመልከቻዎን በሚገመግሙበት ጊዜ ቀጣሪዎች ይህንን መረጃ ግምት ውስጥ ያስገባል።

* መልእክትዎ ከ450 ፊደላት በታች መሆኑን ያረጋግጡ።`);
        bot.once('message', (msg) => {
          const aboutText = msg.text;

          if (aboutText.length < 50 || aboutText.length > 450) {
            bot.sendMessage(chatId, 'የሥራ ማመልከቻው ከ50 ፊደላት በታች መሆን አይችልም: እባክዎ ዳግም ይሞክሩ');
            askAboutYourself(whichjob_applay);
            return;
          }

          askForContact(aboutText, whichjob_applay);
        });
      };

      const askForContact = (aboutText, whichjob_applay) => {
        bot.sendMessage(chatId, `እባክዎ ከታች ያለውን 'ስልክ ቁጥርዎን ያጋሩ' የሚለውን በመጫን ስልክ ቁጥርዎን ያጋሩ
ሊያገኙት ካልቻሉ እንዲታይ ለማድረግ ከታች ያለውን ባለአራት ነጥብ ምልክት ይጫኑ`, {
          reply_markup: {
            keyboard: [
              [{ text: 'ስልክ ቁጥሮትን ለማጋራት እዚህጋር ይጫኑ👇', request_contact: true }]
            ],
            one_time_keyboard: true
          }
        });
      
        bot.once('contact', async (msg) => {
          const phoneNumber = msg.contact.phone_number;
          const username = msg.from.username;
          console.log(job);
          

          if (job.applytype === 'normal') {
            try {
              // bot.sendMessage(chatId, 'succussfully added your contactcontact  added', {
              //   reply_markup: {
              //     remove_keyboard: true
              //   }
              // });
              // await bot.sendMessage(job.channel_id, `👷‍♂️👷‍♀️አዲስ አመልካች:\nየመ/ቁ፦: ${job.id}\nያመለከቱበት የስራ ዘርፉ፦ ${whichjob_applay}\nየአመልካች ስልክ ቁጥር፦ +${phoneNumber}\nየአመልካች ቴሌግራም ፦ @${username}\nየአመልካች ሀሳብ እና አስተያየት፦\n👇👇👇👇👇👇👇👇👇👇👇👇👇👇\n ${aboutText}`);
              await bot.sendMessage(job.telegram_id, `👷‍♂️👷‍♀️አዲስ አመልካች:\nየመ/ቁ፦: ${job.id}\nያመለከቱበት የስራ ዘርፉ፦ ${whichjob_applay}\nየአመልካች ስልክ ቁጥር፦ +${phoneNumber}\nየአመልካች ቴሌግራም ፦ @${username}\nየአመልካች ሀሳብ እና አስተያየት፦\n👇👇👇👇👇👇👇👇👇👇👇👇👇👇\n ${aboutText}
                `, {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: 'Accept', callback_data: `accept_${chatId}_${phoneNumber}` }],
                    [{ text: 'Decline', callback_data: `decline_${chatId}_${jobtitile}`}]
                  ]
                }
              });

              if (!userApplications[chatId]) {
                userApplications[chatId] = [];
              }
              userApplications[chatId].push(jobsId);
              // remove inline keyboard
              bot.sendMessage(chatId, `ማመልከቻዎ በተሳካ ሁኔታ ተጠናቋል ።

ባመለከቱት የስራ ዓይነት ላይ የቀጣሪዎቹን ምላሽ ወደ  ቴሌግራም ቻናላችን Addis Ababa Jobs 
ወይም @addis_ababa_jobs
በመግባት 
በስተቀኝ በኩል ከላይ (pin) የተደረገውን < ይቅጠሩ / ይቀጠሩ > button በመንካት ይከታተሉ ።`,
{
  reply_markup: {
    remove_keyboard: true
  }
});
            } catch (error) {
              console.error('Error sending application data:', error);
              bot.sendMessage(chatId, 'There was an error submitting your application. Please try again later.');
            }
          } else {
            pendingCVApplications[chatId] = {
              job,
              phoneNumber,
              username,
              aboutText,
              whichjob_applay
            };

            bot.sendMessage(chatId, 'እባክዎትን CVዎትን በPDF ወይም በ . docx መልክ ያጋሩ ', {
              reply_markup: {
                remove_keyboard: true
              }
            });
          }
        });
      };

      askJobId();
    } else {
      bot.sendMessage(chatId, 'Invalid job ID. Please try again.');
    }
  } else if (data.startsWith('accept_')) {
    const [_, chatId, phoneNumber] = data.split('_');
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: message.chat.id, message_id: message.message_id });

    bot.sendMessage(message.chat.id, `ማመልከቻው ለተጠቃሚው ተቀባይነት አግኝቷል @${chatId}. ስልክ ቁጥር: ${phoneNumber}`);
    const caption = `🎆🎆🎆 እንኳን ደስ አሎት
 
💫Addis Ababa jobs በእርስዎ ማሽነፈ ደስታ ይሰማዋል።
 
⁉️ማሳሰቢያ፦ ይህ መልዕክት የተላለፈው ከቀጣሪዎ ሲሆን ለመልክቱ ቀጣሪዎ ሙሉ ኃላፊነቱን ይወስዳል ።

♦️ለበለጠ መረጃ
📲 +${phoneNumber}

👷‍♂️👷‍♀️አመልካች ከታች በተጠቀሰው የስራ ዘርፍ ላይ በቀጣሪዎ ተቀባይነት አግኝተዋል።👇👇👇`;
    bot.sendPhoto(chatId, `https://i.ibb.co/1fhgnrJ/photo1720728411.jpg`, { caption: caption })
      .then((response) => {
        console.log('Photo sent successfully:', response);
      })
      .catch((error) => {
        console.error('Error sending photo:', error);
      });
  } else if (data.startsWith('decline_')) {
    const [_, username, jtitile] = data.split('_');
    // const username = data.split('_')[1];
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: message.chat.id, message_id: message.message_id });

    bot.sendMessage(message.chat.id, ` @${username} መተግበሪያው ለተጠቃሚው ተቀባይነት አላገኘም .`);
    bot.sendMessage(username, `${jtitile} ውድ ደንበኛችን ከዚህ በታች ባመለከቱት የስራ ዘርፍ ላይ ቀጣሪው ድርጅት በቂ የሰው ኃይል አግኝቱዓል👇👇👇`);
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;

  if (pendingCVApplications[chatId]) {
    try {
      const { job, phoneNumber, username, aboutText, whichjob_applay } = pendingCVApplications[chatId];
      delete pendingCVApplications[chatId];

      if (msg.document.mime_type === 'application/pdf') {
        const fileId = msg.document.file_id;
        const caption = `👷‍♂️👷‍♀️አዲስ አመልካች:\nየመ/ቁ፦ ${job.id}\ያመለከቱበት የስራ ዘርፉ፦: ${job.title}\nየአመልካች ቴሌግራም ፦ @${username}\nየአመልካች ስልክ ቁጥር፦ ${phoneNumber}\nያመለከቱበት የስራ ዘርፉ፦  ${whichjob_applay}\nስለ አመልካች: ${aboutText}`;
        bot.sendPhoto(job.telegram_id, job.jobImage, {
          caption: caption,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Accept', callback_data: `accept_${msg.chat.id}_${phoneNumber}` }],
              [{ text: 'Decline', callback_data: `decline_${msg.chat.id}` }]
            ]
          }
        });
        bot.sendPhoto(job.channel_id, job.jobImage, {
          caption: caption,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Accept', callback_data: `accept_${msg.chat.id}_${phoneNumber}` }],
              [{ text: 'Decline', callback_data: `decline_${msg.chat.id}` }]
            ]
          }
        });

        // Send the CV PDF to the job poster
        await bot.sendDocument(job.telegram_id, fileId, {}, {
          caption: `New job application:\nJob ID: ${job.id}\nTitle: ${job.title}\nየአመልካች ቴሌግራም ፦ @${username}\nየአመልካች ስልክ ቁጥር፦ ${phoneNumber}`,
          reply_markup: {
            remove_keyboard: true
          }
        });

        // Record the application
        if (!userApplications[chatId]) {
          userApplications[chatId] = [];
        }
        userApplications[chatId].push(job.id);

        bot.sendMessage(chatId, 'ማመልከቻዎ በተሳካ ሁኔታ ገብቷል!');
      } else {
        bot.sendMessage(chatId, 'የቀረበው የሰነድ አይነት አይደገፍም። እባክዎን CVዎን በፒዲኤፍ፣ .doc ወይም .docx ቅርጸት ያስገቡ።');
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
      const botUsername = 'addis_ababa_job_bot'; // Replace with your bot's username
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
      }

      if (jobsItem.jobImage) {
        try {
          // Send photo with caption and inline keyboard  in the channel
          const sentMessage = await bot.sendPhoto(channelId, jobsItem.jobLogo, messageOptions_channel);
          // send message to the bot 
          await bot.sendMessage(chatId, `successfully posted \nJob id :${jobsItem.id}  \n${jobsItem.title} \n Company user name ${jobsItem.username}`);
        } catch (error) {
          console.error('Error sending message:', error.response.body);
          bot.sendMessage(chatId, 'There was an error sending the job details. Please try again later.');
        }
      } else {
        bot.sendMessage(chatId, `Title: ${jobsItem.title}\nDescription: ${jobsItem.detailDescription}\ ${jobsItem.jobURL}`, messageOptions);
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
