
// Handle apply button click
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
  
    if (data.startsWith('apply_')) {
      const jobsId = parseInt(data.split('_')[1], 10);
      const jobsData = await fetchJobsData();
      const job = jobsData.find(item => item.id === jobsId);
      if (job) {
        bot.sendMessage(message.chat.id, 'Please share your phone number and username:', {
          reply_markup: {
            keyboard: [
              [{ text: 'Share my phone number', request_contact: true }]
            ],
            one_time_keyboard: true
          }
        });
  
        bot.once('contact', async (msg) => {
          try {
            const phoneNumber = msg.contact.phone_number;
            const username = msg.from.username;
            // Send the data to the job poster
            await bot.sendMessage(job.username, `New job application:\nJob ID: ${job.id}\nTitle: ${job.title}\nPhone Number: ${phoneNumber}\nApplicant Username: ${username}`, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Accept', callback_data: `accept_${username}_${phoneNumber}` }],
                  [{ text: 'Decline', callback_data: `decline_${username}` }],
                  [{ text: 'send to jop poster', callback_data: `send_${username}` }]
                ]
              }
            });
  
            bot.sendMessage(message.chat.id, 'Your application has been submitted successfully!');
          } catch (error) {
            console.error('Error sending application data:', error);
            bot.sendMessage(message.chat.id, 'There was an error submitting your application. Please try again later.');
          }
        });
      } else {
        bot.sendMessage(message.chat.id, 'Invalid job ID. Please try again.');
      }
    } else if (data.startsWith('accept_')) {
      const [_, username, phoneNumber] = data.split('_');
      console.log(username)+"user name";
      console.log(phoneNumber+"phone number ");
      
      bot.sendMessage(message.chat.id, `Application accepted for user @${username}. Phone number: ${phoneNumber}`);
      bot.sendMessage(username, 'Your application has been accepted!');
    } else if (data.startsWith('decline_')) {
  
      const username = data.split('_')[1];
      console.log("user name "+username);
      bot.sendMessage(message.chat.id, `Application declined for user @${username}.`);
      bot.sendMessage(username, 'Your application has been rejected.');
    } 
  });
  