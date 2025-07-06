# UnQVision Server

This is the backend server for UnQVision, handling the resource-intensive video generation process.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Install FFmpeg:
   For Ubuntu/Debian:
   ```
   sudo apt-get update
   sudo apt-get install -y ffmpeg
   ```
   
   For macOS (using Homebrew):
   ```
   brew install ffmpeg
   ```
   
   For Windows, download and install from [ffmpeg.org](https://ffmpeg.org/download.html)

3. Start the server:
   ```
   npm start
   ```
   
   Or for development with auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

- `POST /generate-video`: Generates a video based on the provided configuration
  - Request body:
    ```json
    {
      "projectTitle": "My Video",
      "mainPrompt": "A serene beach at sunset",
      "languages": ["English"],
      "googleApiKeys": "YOUR_GOOGLE_API_KEY",
      "pexelsApiKeys": "YOUR_PEXELS_API_KEY",
      "textModel": "gemini-1.5-pro-latest",
      "voiceModel": "gemini-audio-1.0-pro"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "videoUrl": "/temp/My_Video_1234567890.mp4",
      "progressUpdates": [
        {
          "id": 1234567890,
          "message": "✅ Validating inputs...",
          "timestamp": "10:30:45 AM",
          "type": "success"
        }
      ]
    }
    ```

- `GET /status`: Check if the server is running
  - Response:
    ```json
    {
      "status": "Server is running"
    }
    ```

## Environment Variables

- `PORT`: The port the server will run on (default: 3001)

## Notes

- Generated videos are stored in the `temp` directory and are automatically deleted after one hour
- This server should be deployed on a machine with sufficient resources for video processing 