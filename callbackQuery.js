const fetchJobsData = require('./fetchJobsData');

const userApplications = {};
let pendingCVApplications = {};

module.exports = async (bot, callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  // Handle the callback data
  if (data.startsWith('send_response_')) {
    const [_, username, jobtitile] = data.split('_').slice(1);
    bot.sendMessage(username, `Job Title : ${jobtitile} \n your application for the job is not accepted, @${username}.`);
    bot.answerCallbackQuery(callbackQuery.id);
  }

  if (data.startsWith('apply_')) {
    // Your apply logic here
  } else if (data.startsWith('accept_')) {
    // Your accept logic here
  } else if (data.startsWith('decline_')) {
    // Your decline logic here
  }
};
