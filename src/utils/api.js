const APIUtil = {
  async fetch(url, opts){
    try {
      const response = await fetch(url, opts);

      if (!response.ok) {
        // Server responded with a status outside the 200–299 range
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Handles both HTTP errors and network errors
      console.error('Error fetching data:', error.message);
      return null;
    }

  }
}

export default APIUtil;