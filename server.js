const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import the cors package

const app = express();
const port = 3333;

// Enable CORS for all routes
app.use(cors());

// API Token Acount JWT has Expired
const token = ""; // Replace with your actual Zoom JWT token

async function getSessions() {
  const apiUrl = "https://api.zoom.us/v2/videosdk/sessions";

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Unexpected status code: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    if (error.response) {
      console.error(`Error response from API: ${error.response.status} - ${error.response.statusText}`);
      console.error(error.response.data);
    } else if (error.request) {
      console.error('No response received from API:', error.request);
    } else {
      console.error('Error in setting up the request:', error.message);
    }
    throw new Error(`Error fetching sessions: ${error.message}`);
  }
}

async function recordingCloud(sessionId) {
  let encodedSessionId = encodeURIComponent(sessionId);
  try {
    const response = await axios.patch(
      `https://api.zoom.us/v2/videosdk/sessions/${encodedSessionId}/events`,
      { method: "recording.start" },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status === 202) {
      console.log("Recording started successfully");
      return { message: "Recording started successfully" };
    } else {
      console.log(`Failed to start recording. Status: ${response.status}`);
      throw new Error(`Failed to start recording. Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error starting recording:", error.message);
    throw new Error(`Error starting recording: ${error.message}`);
  }
}

app.get('/sessions', async (req, res) => {
  try {
    const sessions = await getSessions();
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Updated route to accept sessionId as a URL parameter
app.patch('/recording/start/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  try {
    const result = await recordingCloud(sessionId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
