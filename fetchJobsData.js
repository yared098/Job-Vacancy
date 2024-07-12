const axios = require('axios');
const apiUrl = 'https://playapicevirtual-h012.com/api/job';

module.exports = async () => {
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
