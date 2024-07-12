const axios = require('axios');
const apiUrl = 'https://playapicevirtual-h012.com/api/job';

const fetchJobsData = async () => {
  try {
    const response = await axios.get(apiUrl);

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

module.exports = {
  fetchJobsData,
};
