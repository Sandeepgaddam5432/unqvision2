const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { generateVideo } = require('./videoService');

const app = express();
const PORT = process.env.PORT || 3001;

// Create temp directory for storing videos
const tempDir = path.join(__dirname, 'temp');
fs.ensureDirSync(tempDir);

// Configure multer for file uploads
const upload = multer({ dest: tempDir });

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'temp' directory
app.use('/temp', express.static(tempDir));

// API Routes
app.post('/generate-video', async (req, res) => {
  try {
    const config = req.body;
    
    // Validate inputs
    if (!config.projectTitle || !config.mainPrompt) {
      return res.status(400).json({ error: 'Project title and prompt are required' });
    }
    if (!config.googleApiKeys || !config.pexelsApiKeys) {
      return res.status(400).json({ error: 'API keys are required' });
    }
    if (config.languages.length === 0) {
      return res.status(400).json({ error: 'At least one language must be selected' });
    }
    
    // Setup progress tracking
    const progressUpdates = [];
    const onLogUpdate = (message, type = 'info') => {
      const update = { 
        id: Date.now(), 
        message, 
        timestamp: new Date().toLocaleTimeString(),
        type
      };
      progressUpdates.push(update);
    };
    
    // Start the generation process
    const videoFilePath = await generateVideo({
      ...config,
      onLogUpdate,
      tempDir
    });
    
    // Generate a unique filename
    const filename = `${config.projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`;
    const outputPath = path.join(tempDir, filename);
    
    // Copy the video to the output path (if not already there)
    if (videoFilePath !== outputPath) {
      await fs.copy(videoFilePath, outputPath);
      // Clean up the original temporary file
      await fs.remove(videoFilePath);
    }
    
    // Return the video URL and progress updates
    res.json({
      success: true,
      videoUrl: `/temp/${filename}`,
      progressUpdates
    });
    
    // Schedule cleanup of the video file after 1 hour
    setTimeout(async () => {
      try {
        await fs.remove(outputPath);
        console.log(`Cleaned up temporary file: ${outputPath}`);
      } catch (err) {
        console.error(`Failed to clean up file: ${outputPath}`, err);
      }
    }, 60 * 60 * 1000);
    
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unknown error occurred during video generation',
      progressUpdates: []
    });
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Cleanup on server exit
process.on('exit', () => {
  fs.emptyDirSync(tempDir);
}); 