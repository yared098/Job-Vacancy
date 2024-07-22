const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file



const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const sendPhotoAndPin = require('./BotMethods/send'); // Corrected import statement
// const botUsername = 'yeneRide'; // Replace with your bot's username
const botUsername=process.env.BOT_USERNAME;

const bot = new TelegramBot(token, { polling: true });

const apiUrl = 'https://playapicevirtual-h012.com/api/job';


const contactInfo = `
⚫ ለተቀጣሪዎች

▫️ በለጠፍነው የስራ ቅጥር ማስታወቂያ ላይ በላኩት ማመልከቻ ቀጣሪዎቹ ያላቸውን ግምገማ እና ምላሽ በዚሁ ቦት / Bot/👆 ወደ ላይ scroll በማድረግ ይከታተሉ::

⚪ ለቀጣሪዎች

▪️ በለጠፉት የስራ ማስታወቂያ ላይ:👷‍♂️👷‍♀️ ያመለከቱ የስራ ፈላጊዎችን ማመልከቻ በዚሁ ቦት/Bot/👆ወደ ላይ scroll በማድረግ ያገኙታል::

▪️ በዚህ የቴሌግራም ቻናል ላይ ስራዎትን ለመለጠፍ እና ሀሳብ አስተያየትዎን ለመስጠት
ቴሌግራም:-@addis_ababa_jobs_1

➖➖➖➖💧💧💧💧➖➖➖➖

👆የተላከሎትን መልዕክት ወደ ላይ scroll አድርገው ይመልከቱ።

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
      // console.error('Unexpected response format:', response.data);
      return [];
    }
  } catch (error) {
    // console.error('Error fetching jobs data:', error.message);
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
      //  this is  for make to send image with
       // Generate the caption and truncate if necessary
       let caption = `${jobsItem.detailDescription}\n${jobsItem.jobURL}`;
       const captionMaxLength = 1024;
 
       if (caption.length > captionMaxLength) {
         caption = `${jobsItem.detailDescription}`;
         bot.sendMessage(chatId,caption,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Apply', callback_data: `apply_${jobsId}` }]
              ]
            }
         });
       }else{
        bot.sendPhoto(chatId,jobsItem.jobImage,{
          caption:caption,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Apply', callback_data: `apply_${jobsId}` }]
            ]
          }
        });
       }

    
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
  bot.sendMessage(chatId, 'ይጠብቁ........❕');
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
  // this callback function is used to send message to the channel and channel will reponse to the user 
  if (data.startsWith('send_response_')) {
    const [_, username, jobtitile,applayerId] = data.split('_').slice(1);
    bot.sendMessage(applayerId, ` ${jobtitile} \n ማመልከቻዎ ተቀባይነት አላገኘም ፣ @${username}.`);
    bot.answerCallbackQuery(callbackQuery.id);
  }
  // end of callback functions 

  if (data.startsWith('apply_')) {
    const jobsId = parseInt(data.split('_')[1], 10);
    const chatId = message.chat.id;
    const jobsData = await fetchJobsData();
    const job = jobsData.find(item => item.id === jobsId);
    // const jobtitile = job.title;
    const jobtitile = job.title ? job.title : '';
    const channel_id = job.channel_id;
    // console.log(channel_id);
    const phone_company=job.username;
    // console.log(phone_company);


    if (job) {
      if (!job.telegram_id) {
       await bot.sendMessage(chatId, `💼በዚህ የስራ ቅጥር ለማመልከት በተጠቀሰው አድራሻ ቀጣሪ ድርጅቱን ያነጋግሯቸው።`);
        return;
      }

      if (userApplications[chatId] && userApplications[chatId].includes(jobsId)) {
        await bot.sendMessage(chatId, '❌ከአንድ ጊዜ በላይ በአንድ የቅጥር ማስታወቂያ ላይ ማመልከት አይችሉም።');
        return;
      }

      if (job.deadline && job.created_at) {
        const deadlineTime = new Date(job.deadline).getTime();
        const createdTime = new Date(job.created_at).getTime();

        if (isNaN(deadlineTime) || isNaN(createdTime)) {
          await  bot.sendMessage(chatId, 'ይቅርታ \n⏰ ያመለከቱት የስራ ቅጥር ማስታወቂያ የማመልከቻ ጊዜ ገደብ ተጠናቋል።');
          return;
        }

        if (deadlineTime <= createdTime) {
          await  bot.sendMessage(chatId, 'ይቅርታ \n⏰ ያመለከቱት የስራ ቅጥር ማስታወቂያ የማመልከቻ ጊዜ ገደብ ተጠናቋል።');
          return;
        }
      }

      const askJobId = async (phoneNumber,username) => {
       await bot.sendMessage(chatId, 'ከተጠቀሱት የስራ መደቦች ውስጥ የሚያመለክቱበትን የስራ መደብ መጠሪያ ያስገቡ⁉️');

       bot.once('message', (msg) => {
          const whichjob_applay = msg.text;
           askAboutYourself(whichjob_applay, phoneNumber, username);
        });
      };

      const askAboutYourself =async (whichjob_applay,phoneNumber,username) => {
       await bot.sendMessage(chatId, `ለሚያመለክቱት ስራ ብቁ እንደሆኑ የሚገልጽ አጠር ያለ የማመልከቻ መልዕክት ይፃፋ⁉️`);
        bot.once('message', async(msg) => {
          const aboutText = msg.text;

          if (aboutText.length < 20 || aboutText.length > 250) {
          await  bot.sendMessage(chatId, '❌የሥራ ማመልከቻው ከ20 ፊደላት በታች መሆን አይችልም:: እባክዎትን ዳግም ይፃፋ።');
            askAboutYourself(whichjob_applay,phoneNumber,username);
            return;
          }

          // askForContact(aboutText, whichjob_applay);
          if (job.applytype === 'normal')  {
            try {

             // this is used to send to the comapany telegram id
              await bot.sendMessage(job.telegram_id, `#d${chatId}\nአዲስ አመልካች:\nየመ/ቁ፦: ${job.id}\nያመለከቱበት የስራ መደብ፦ ${whichjob_applay}\nየአመልካች ስልክ ቁጥር፦ +${phoneNumber}\nየአመልካች ቴሌግራም ፦ @${username}\nየአመልካች ሀሳብ እና አስተያየት፦\n👇👇👇👇👇👇👇👇👇👇👇👇👇👇\n ${aboutText}
                `, {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: 'Accept', callback_data: `accept_${chatId}_${job.id}` }],
                    [{ text: 'Decline', callback_data: `decline_${chatId}_${job.id}` }]
                  ]
                }
              });
              // this is used to send to the telegram channal
              await bot.sendMessage(job.channel_id, `#d${chatId}\nአዲስ አመልካች:\nየመ/ቁ፦: ${job.id}\nያመለከቱበት የስራ መደብ፦ ${whichjob_applay}\nየአመልካች ስልክ ቁጥር፦ +${phoneNumber}\nየአመልካች ቴሌግራም ፦ @${username}\nየአመልካች ሀሳብ እና አስተያየት፦\n👇👇👇👇👇👇👇👇👇👇👇👇👇👇\n ${aboutText}
                `, {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: 'Accept', callback_data: `accept_${chatId}_${job.id}` }],
                    [{ text: 'Decline', callback_data: `decline_${chatId}_${job.id}` }]
                  ]
                }
              });

              if (!userApplications[chatId]) {
                userApplications[chatId] = [];
              }
              userApplications[chatId].push(jobsId);
              // remove inline keyboard
             await bot.sendMessage(chatId, ` ማመልከቻዎ በተሳካ ሁኔታ ተልኳል‼️

ባመለከቱት ማመልከቻ ላይ የቀጣሪዎቹን ምላሽ ለማወቅ

1️⃣ ወደ ቴሌግራም ቻናላችን Addis Ababa Jobs👉 @addis_ababa_jobs መግባት።
   
 2️⃣  በስተቀኝ በኩል ከላይ (pin) የተደረገውን < ይቅጠሩ / ይቀጠሩ > የሚለውን button መንካት።

3️⃣ ከቀጣሪዎች የሚደርሶትን መልክት 
👆ወደ ላይ (sclor) በማድረግ መከታተል።

መልካም እድል እንዲገጥሞት እንመኛለን።`,
                {
                  reply_markup: {
                    remove_keyboard: true
                  }
                });
            } catch (error) {
              console.error('Error sending application data:', error);
              await bot.sendMessage(chatId, 'There was an error submitting your application. Please try again later.');
            }
          } else {
            pendingCVApplications[chatId] = {
              job,
              phoneNumber,
              username,
              aboutText,
              whichjob_applay
            };

            await bot.sendMessage(chatId, 'እባክዎትን \nCV ዎትን በPDF ወይም በ . docx መልክ ያጋሩ⁉️', {
              reply_markup: {
                remove_keyboard: true
              }
            });
          }
        });
      };

      const askForContact =async () => {
       await bot.sendMessage(chatId, `እባክዎትን
\n☎️ ከታች ያለውን 'ስልክ ቁጥርዎን ያጋሩ' የሚለውን በመጫን ስልክ ቁጥሮን ያጋሩ::`, {
          reply_markup: {
            keyboard: [
              [{ text: 'ስልክ ቁጥሮትን ለማጋራት እዚህ ጋር ይጫኑ👇', request_contact: true }]
            ],
            one_time_keyboard: true,
            // remove_keyboard :true
          }
        });

        bot.once('contact', async (msg) => {
          const phoneNumber = msg.contact.phone_number;
          const username = msg.from.username;
            // Remove the custom keyboard by sending an empty reply_markup
            await bot.sendMessage(chatId, `.`, {
              reply_markup: {
                  remove_keyboard: true
              }
          });

      if (job.jobamount == false) { 
       
        askAboutYourself("All", phoneNumber, username);
    } else {
        
        askJobId( phoneNumber, username);
    }
        });
      };
      if(job.jobamount==0)
        {
          askForContact();
        }
       else{
        askForContact();
       }
     
    } else {
      await bot.sendMessage(chatId, 'Invalid job ID. Please try again.');
    }
  } else if (data.startsWith('accept_')) {
    //  this method used to  accept jobs based on .....
    const [_, chatId,jobId ] = data.split('_');
    
    const job_id=parseInt(jobId);
    //  fetch jobs from database based on job id 
    const jobsData = await fetchJobsData();
    const job = jobsData.find(item => item.id === job_id);
    // console.log(job);
    
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: message.chat.id, message_id: message.message_id });
   

  // send message to the job accepted or company
    await bot.sendMessage(message.chat.id, `ማመልከቻው ተቀባይነት አግኝቷል #d${chatId}. ስልክ ቁጥር: ${job.username}`);
    // send message o the telegram channel  for track 
    await bot.sendMessage(`${job.channel_id}`, `${job.title}  \nየቴሌግራም ተጠቃሚ ስም #d${chatId} ተቀባይነት አግኝቷል  `);
    const caption = `🎆🎆🎆 እንኳን ደስ አሎት
        
  💫Addis Ababa jobs በእርስዎ ማሽነፈ ደስታ ይሰማዋል።
        
  ‼️ማሳሰቢያ፦ ይህ መልዕክት የተላለፈው ከቀጣሪዎ ሲሆን ለመልክቱ ቀጣሪዎ ሙሉ ኃላፊነቱን ይወስዳል ።

  ♦️ለበለጠ መረጃ
 📲 +251${job.username}\nከታች ባመለከቱት ቅጥር 👇👇👇\n${job.title}`;
//   this message used to send congratulation message to the applayer
    await bot.sendPhoto(chatId, `https://i.ibb.co/1fhgnrJ/photo1720728411.jpg`, { caption: caption })
      .then((response) => {
        // console.log('Photo sent successfully:', response);
      })
      .catch((error) => {
        // console.error('Error sending photo:', error);
      });



  } else if (data.startsWith('decline_')) {
    //user name =chat user name and job id fetch jobs
    const [_, username, jobsId] = data.split('_');
    const job_id=parseInt(jobsId);
    //  fetch jobs from database based on job id 
    const jobsData = await fetchJobsData();1
    const job = jobsData.find(item => item.id === job_id);


    const userchatId=message.chat.id;
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: message.chat.id, message_id: message.message_id });

    await bot.sendMessage(userchatId, `channel id #d${username}   ${job.title} ማመልከቻዎ ተቀባይነት አላገኘም::`);
    // send message to the applayer/user
  
    // await bot.sendMessage(username, ` ቀጣሪው ድርጅት በቂ የሰው ኃይል አግኝቱዓል👇👇👇\n${job.title}`);
    try {
      if (job.jobLogo) {
        // Check if the jobLogo URL is valid
        const response = await axios.get(job.jobLogo);
        
        if (response.status === 200) {
          await bot.sendPhoto(username, job.jobLogo, {
            caption: `ቀጣሪው ድርጅት በቂ የሰው ኃይል አግኝቷል ፤ ከታች ባመለከቱት ቅጥር 👇👇👇\n${job.title}`
          });
        }
      }
  
      // Send the message regardless of the jobLogo status
      await bot.sendMessage(username, `ቀጣሪው ድርጅት በቂ የሰው ኃይል አግኝቷል ፤ ከታች ባመለከቱት ቅጥር 👇👇👇\n${job.title}`);
    } catch (error) {
      console.error('Error sending job message:', error);
      // Fallback to sending the message only
      await bot.sendMessage(username, `ቀጣሪው ድርጅት በቂ የሰው ኃይል አግኝቷል ፤ ከታች ባመለከቱት ቅጥር 👇👇👇\n${job.title}`);
    }
     //  console.log("befor sending to the telegram channel  backup message");
    // send message o the telegram channel
    console.log(job.channel_id);
    const channaltrack_id=job.channel_id;
    await bot.sendMessage(channaltrack_id, `የቴሌግራም ተጠቃሚ ስም #d${username} ማመልከቻው ውድቅ ተደርጓል\n ${job.title}`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Send reject response',
              callback_data: `send_response_${job.username}_${job.title}_${userchatId}`
            }
          ]
        ]
      }
    });
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;

  if (pendingCVApplications[chatId]) {
    try {
      const { job, phoneNumber, username, aboutText, whichjob_applay } = pendingCVApplications[chatId];
      delete pendingCVApplications[chatId];

      const validMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      // if (msg.document.mime_type === 'application/pdf') {
        if (validMimeTypes.includes(msg.document.mime_type)){

        const fileId = msg.document.file_id;
        const caption = `#d${chatId}\nአዲስ አመልካች:\nየመ/ቁ፦ #d${job.id}\nየአመልካች ቴሌግራም ፦ @${username}\nየአመልካች ስልክ ቁጥር፦ +${phoneNumber}\nያመለከቱበት የስራ ዘርፉ፦  ${whichjob_applay}\nስለ አመልካች:👇👇👇\n ${aboutText}`;
        
    
        //  thi is used to send message to the  company 
        await  bot.sendMessage(job.telegram_id, caption,{
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Accept', callback_data: `accept_${msg.chat.id}_${job.id}` }],
              [{ text: 'Decline', callback_data: `decline_${msg.chat.id}_${job.id}` }]
            ]
          }
         
        });
        await  bot.sendMessage(job.channel_id, caption,{
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Accept', callback_data: `accept_${msg.chat.id}_${job.id}` }],
              [{ text: 'Decline', callback_data: `decline_${msg.chat.id}_${job.id}` }]
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

        await bot.sendMessage(chatId, `ማመልከቻዎ በተሳካ ሁኔታ ተልኳል‼️

        ባመለከቱት ማመልከቻ ላይ የቀጣሪዎቹን ምላሽ ለማወቅ

        1️⃣ ወደ ቴሌግራም ቻናላችን Addis Ababa Jobs👉 @addis_ababa_jobs መግባት።
          
        2️⃣  በስተቀኝ በኩል ከላይ (pin) የተደረገውን < ይቅጠሩ / ይቀጠሩ > የሚለውን button መንካት።

        3️⃣ ከቀጣሪዎች የሚደርሶትን መልክት 
        👆ወደ ላይ (sclor) በማድረግ መከታተል።

        መልካም እድል እንዲገጥሞት እንመኛለን።`);
      } else {
        await bot.sendMessage(chatId, 'የቀረበው የሰነድ ዓይነት አይደገፍም። እባክዎትን CVዎን በPDF፣ .doc ወይም .docx መልክ ያስገቡ።');
        // pendingCVApplications[chatId] = { job, phoneNumber, username, aboutText, whichjob_applay };
        // Ask the user to upload again
        pendingCVApplications[chatId] = { job, phoneNumber, username, aboutText, whichjob_applay };
      }
    } catch (error) {
      console.error('Error sending CV:', error);
      await bot.sendMessage(chatId, 'There was an error submitting your application. Please try again later.');
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
      }

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
  // console.error('Polling error:', error);
});

// console.log('Bot started polling.');