const pendingCVApplications = {};

module.exports = async (bot, msg) => {
  const chatId = msg.chat.id;

  if (pendingCVApplications[chatId]) {
    // Handle the document upload and process
  }
};
