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

const getJobMessage = (job, jobsId) => {
  return `${job.title}\n${job.detailDescription}\n${job.jobURL}`;
};

module.exports = {
  contactInfo,
  getJobMessage,
};
