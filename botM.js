const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();
const Post_jobs = require('./BotMethods/post');
const sendPhotoAndPin = require('./BotMethods/send');

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const botUsername = process.env.BOT_USERNAME;
const bot = new TelegramBot(token, { polling: true });
const apiUrl = 'https://playapicevirtual-h012.com/api/job';

// State management
const userState = {};
// Record of user applications
const userApplications = {};

let pendingCVApplications = {};

// Handle /post command
Post_jobs(bot);

// Handle /start command without parameters
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 0 };
  bot.sendMessage(chatId, 'ይጠብቁ........❕');
});

// Handle apply button click
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (data.startsWith('send_response_')) {
    const [_, username, jobTitle, applayerId] = data.split('_').slice(1);
    bot.sendMessage(applayerId, `${jobTitle} \n ማመልከቻዎ ተቀባይነት አላገኘም ፣ @${username}.`);
    bot.answerCallbackQuery(callbackQuery.id);
  } else if (data.startsWith('apply_')) {
    const jobsId = parseInt(data.split('_')[1], 10);
    const chatId = message.chat.id;
    const jobsData = await fetchJobsData();
    const job = jobsData.find(item => item.id === jobsId);

    if (job) {
      if (!job.telegram_id) {
        await bot.sendMessage(chatId, `💼በዚህ የስራ ቅጥር ለማመልከት በተጠቀሰው አድራሻ ቀጣሪ ድርጅቱን ያነጋግሯቸው።`);
        return;
      }

      if (userApplications[chatId] && userApplications[chatId].includes(jobsId)) {
        await bot.sendMessage(chatId, '❌ከአንድ ጊዜ በላይ በአንድ የቅጥር ማስታወቂያ ላይ ማመልከት አይችሉም።');
        return;
      }

      const deadlineTime = new Date(job.deadline).getTime();
      const createdTime = new Date(job.created_at).getTime();

      if (isNaN(deadlineTime) || isNaN(createdTime) || deadlineTime <= createdTime) {
        await bot.sendMessage(chatId, 'ይቅርታ \n⏰ ያመለከቱት የስራ ቅጥር ማስታወቂያ የማመልከቻ ጊዜ ገደብ ተጠናቋል።');
        return;
      }

      userState[chatId].job = job;
      userState[chatId].step = 1; // Move to the next step
      askForContact(message, chatId, job);
    } else {
      await bot.sendMessage(chatId, 'Invalid job ID. Please try again.');
    }
  } else if (data.startsWith('accept_')) {
    await Accepted_jobApplay(data, message);
  } else if (data.startsWith('decline_')) {
    await Declined_Applayjobs(data, message);
  }
});

// Handle contact sharing
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  if (userState[chatId] && userState[chatId].step === 2) {
    const phoneNumber = msg.contact.phone_number;
    const username = msg.from.username;
    userState[chatId].phoneNumber = phoneNumber;
    userState[chatId].username = username;

    // Remove the custom keyboard
    await bot.sendMessage(chatId, '.', {
      reply_markup: {
        remove_keyboard: true
      }
    });

    const job = userState[chatId].job;
    if (job.jobamount === false) {
      userState[chatId].step = 3; // Move to the next step
      console.log("applay with no more jobs ");
      await askAboutYourself(chatId, job);
    } else {
      console.log("applay with more than one jobs ")
      userState[chatId].step = 3; // Move to the next step
      await askJobId(chatId, job);
    }
  }
});

// Handle messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!userState[chatId]) return;

  switch (userState[chatId].step) {
    case 3:
      if (userState[chatId].job.jobamount !== false) {
        const whichJobApply = msg.text;
        userState[chatId].whichJobApply = whichJobApply;
        userState[chatId].step = 4; // Move to the next step
        await askAboutYourself(chatId, userState[chatId].job);
      }
      break;
    case 4:
      const aboutText = msg.text;
      if (!aboutText || aboutText.length < 20 || aboutText.length > 250) {
        await bot.sendMessage(chatId, '❌የሥራ ማመልከቻው ከ20 ፊደላት በታች መሆን አይችልም:: እባክዎትን ዳግም ይፃፋ።');
        await askAboutYourself(chatId, userState[chatId].job);
      } else {
        userState[chatId].aboutText = aboutText;
        console.log(userState[chatId].job.applytype);
        console.log("applay type is ")
        if (userState[chatId].job.applytype === 'normal') {
          await Applaywith_Normal(chatId, userState[chatId].job);
          console.log("should  not ask the use cv")
        } else {
          await Applay_withcv(chatId, userState[chatId].job, msg);
          console.log("should ask the user cv cv cv cv")
        }
       
      }
      break;
    default:
      userState[chatId]=[];
      break;
  }
});

// Function to ask for job ID
const askJobId = async (chatId, job) => {
  await bot.sendMessage(chatId, 'ከተጠቀሱት የስራ መደቦች ውስጥ የሚያመለክቱበትን የስራ መደብ መጠሪያ ያስገቡ⁉️');
  userState[chatId].step = 3; // Move to the next step
};

// Function to ask for about text
const askAboutYourself = async (chatId, job) => {
  await bot.sendMessage(chatId, 'ለሚያመልክቱት ስራ ብቁ እንደሆኑ የሚገልጽ አጠር ያለ የማመልከቻ መልዕክት ይፃፋ⁉️');
  userState[chatId].step = 4; // Move to the next step
};

// Function to handle contact request
const askForContact = (msg, chatId, job) => {
  bot.sendMessage(chatId, 'እባክዎትን\n☎️ ከታች ያለውን "ስልክ ቁጥርዎን ያጋሩ" የሚለውን በመጫን ስልክ ቁጥሮን ያጋሩ::', {
    reply_markup: {
      keyboard: [
        [{ text: 'ስልክ ቁጥሮትን ለማጋራት እዚህ ጋር ይጫኑ👇', request_contact: true }]
      ],
      one_time_keyboard: true
    }
  });
};

// // Function to ask for job ID
// const askJobId = async (chatId,job) => {
//   await bot.sendMessage(chatId, 'ከተጠቀሱት የስራ መደቦች ውስጥ የሚያመለክቱበትን የስራ መደብ መጠሪያ ያስገቡ⁉️');
//   bot.once('message', async (msg) => {
//     const whichJobApply = msg.text;
//     userState[chatId].whichJobApply = whichJobApply;
//     await askAboutYourself(chatId,job);
//   });
// };

//       // Function to ask for about text
//  const askAboutYourself = async (chatId,job) => {
//     await bot.sendMessage(chatId, `ለሚያመለክቱት ስራ ብቁ እንደሆኑ የሚገልጽ አጠር ያለ የማመልከቻ መልዕክት ይፃፋ⁉️`);
//     bot.once('message', async (msg) => {
//       const aboutText = msg.text;
//       if (aboutText.length < 20 || aboutText.length > 250) {
//         await bot.sendMessage(chatId, '❌የሥራ ማመልከቻው ከ20 ፊደላት በታች መሆን አይችልም:: እባክዎትን ዳግም ይፃፋ።');
//         await askAboutYourself(chatId,job);
//       } 
//         else{
//           //  console.log(job);
//         userState[chatId].aboutText = aboutText;
//         if (job.applytype === 'normal') {
//           console.log("normal applay")
//           await Applaywith_Normal(chatId,job);
//         } else {
//           console.log(userState[chatId].whichJobApply)
//           console.log("applay with cv")
//           userState[chatId].step = 4; // Move to the next step
//           await  Applay_withcv(chatId,job,msg);
//         }
//         }
//     });
//   };
// // Function to handle contact request
//   const askForContact = (msg,chatId,job) => {
//     bot.sendMessage(chatId, `እባክዎትን\n☎️ ከታች ያለውን 'ስልክ ቁጥርዎን ያጋሩ' የሚለውን በመጫን ስልክ ቁጥሮን ያጋሩ::`, {
//       reply_markup: {
//         keyboard: [
//           [{ text: 'ስልክ ቁጥሮትን ለማጋራት እዚህ ጋር ይጫኑ👇', request_contact: true }]
//         ],
//         one_time_keyboard: true
//       }
//     });

//     bot.once('contact', async (msg) => {
//       const phoneNumber = msg.contact.phone_number;
//       const username = msg.from.username;
//       userState[chatId].phoneNumber = phoneNumber;
//       userState[chatId].username = username;

//       // Remove the custom keyboard
//       bot.sendMessage(chatId, `.`, {
//         reply_markup: {
//           remove_keyboard: true
//         }
//       });
       
//       // if (userState[chatId].jobId) {
//       //   askJobId(chatId);
//       // } else {
//       //   await askAboutYourself(chatId);
//       // }
//       if (job.jobamount == false) {
//         console.log("job amount is false ");
//         userState[chatId].step = 3; // Move to the next step
//         askAboutYourself(chatId,job);
//       } else {
//         userState[chatId].step = 3; // Move to the next step
//         await askJobId(chatId,job);
//         console.log("job amount is true ask job id ");
//       }
//     });
//   };

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


// Handle the /contact command
bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, contactInfo);
});



// Handle the /pin command
bot.onText(/\/pin/, (msg) => {
  const chatId = msg.chat.id;

  // Call the sendPhotoAndPin function
  sendPhotoAndPin(bot, botUsername, channelId);
});

// Handle document upload
bot.on('document', async (msg) => { const chatId = msg.chat.id;

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
          userState[chatId]=[]
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
        console.log("errror applay with cv ............")
        await bot.sendMessage(chatId, 'የቀረበው የሰነድ ዓይነት አይደገፍም። እባክዎትን CVዎን በPDF፣ .doc ወይም .docx መልክ ያስገቡ።');
        userState[chatId].pendingCV = { job, phoneNumber, username, aboutText, whichJobApply };
      }
    } catch (error) {
      console.error('Error sending CV:', error);
      await bot.sendMessage(chatId, 'There was an error submitting your application. Please try again later.');
    }
  }
});
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
        bot.sendMessage(chatId, caption,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Apply', callback_data: `apply_${jobsId}` }]
              ]
            }
          });
      } else {
        bot.sendPhoto(chatId, jobsItem.jobImage, {
          caption: caption,
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


// Log bot start
bot.on('polling_error', (error) => {
  // console.error('Polling error:', error);
});


async function Accepted_jobApplay(data, message) {
  const [_, chatId, jobId] = data.split('_');

  const job_id = parseInt(jobId);
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
    });
}

async function Declined_Applayjobs(data, message) {
  const [_, username, jobsId] = data.split('_');
  const job_id = parseInt(jobsId);
  //  fetch jobs from database based on job id 
  const jobsData = await fetchJobsData(); 1;
  const job = jobsData.find(item => item.id === job_id);


  const userchatId = message.chat.id;
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
  const channaltrack_id = job.channel_id;
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

async function Finish_ApplayCv( chatId, job,msg) {

  console.log("finish applay with cv is processing .....")
  // const fileId = msg.document.file_id;
 const  fileId=userState[chatId].fileId
 const whichjob_applay=userState[chatId].whichJobApply;
 const phoneNumber=userState[chatId].phoneNumber;
 const username=userState[chatId].username;
 const aboutText=userState[chatId].aboutText;

  const caption = `#d${chatId}\nአዲስ አመልካች:\nየመ/ቁ፦ #d${job.id}\nየአመልካች ቴሌግራም ፦ @${username}\nየአመልካች ስልክ ቁጥር፦ +${phoneNumber}\nያመለከቱበት የስራ ዘርፉ፦  ${whichjob_applay}\nስለ አመልካች:👇👇👇\n ${aboutText}`;


  //  thi is used to send message to the  company 
  await bot.sendMessage(job.telegram_id, caption, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Accept', callback_data: `accept_${msg.chat.id}_${job.id}` }],
        [{ text: 'Decline', callback_data: `decline_${msg.chat.id}_${job.id}` }]
      ]
    }
  });
  await bot.sendMessage(job.channel_id, caption, {
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
userData[userId] = {};
}

function Applay_withcv(chatId,job,msg) {
  const whichjob_applay=userState[chatId].whichJobApply;
  const phoneNumber=userState[chatId].phoneNumber;
  const username=userState[chatId].username;
  const aboutText=userState[chatId].aboutText;
  pendingCVApplications[chatId] = {
    job,
    phoneNumber,
    username,
    aboutText,
    whichjob_applay
  };
  console.log(pendingCVApplications);
  console.log("pending ..................")

  bot.sendMessage(chatId, 'እባክዎትን \nCV ዎትን በPDF ወይም በ . docx መልክ ያጋሩ⁉️', {
    reply_markup: {
      remove_keyboard: true
    }
  });
  console.log("procoss of sending cv for user")
  // Finish_ApplayCv( chatId, job,msg)
}

async function Applaywith_Normal(chatId,job) {
  // whichjob_applay, phoneNumber, username, aboutText, jobsId
  console.log(chatId);
  console.log(userState[chatId]);
  const whichjob_applay=userState[chatId].whichJobApply;
  const phoneNumber=userState[chatId].phoneNumber;
  const username=userState[chatId].username;
  const aboutText=userState[chatId].aboutText;
  console.log(job);
  try {

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
    userApplications[chatId].push(job.id);
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
}
// console.log('Bot started polling.');