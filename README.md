# UnQVision - AI Video Generator

## Architecture Overview

UnQVision now uses a Colab-based backend to handle resource-intensive video generation:

- **Frontend (client)**: React application that handles user interface and API calls
- **Backend (Colab)**: Python-based Flask server running on Google Colab that processes video generation using ffmpeg-python

This architecture allows the application to work on devices with limited resources by offloading the heavy processing to Google Colab's free computing resources.

## 🚀 Run the Backend on Google Colab

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Sandeepgaddam5432/unqvision2/blob/main/UnQVision_Video_Server.ipynb)

1. Click the "Open in Colab" button above to open the notebook
2. Follow the notebook instructions to:
   - Enter your API keys (Google Gemini, Pexels)
   - Run all cells to start the server
   - Copy the Cloudflare Tunnel URL provided at the end

The notebook creates a Flask server and exposes it using Cloudflare Tunnels, giving you a stable HTTPS URL that you can use with the frontend.

## Running the Frontend

```sh
# Install dependencies
npm install

# Set the Colab backend URL in .env.local
echo "VITE_API_URL=https://your-cloudflare-tunnel-url.trycloudflare.com" > .env.local

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:8080

## Project Technologies

This project is built with:

- **Frontend**:
  - Vite
  - TypeScript
  - React
  - shadcn-ui
  - Tailwind CSS

- **Backend (Colab)**:
  - Python
  - Flask
  - ffmpeg-python
  - Cloudflare Tunnels

## Deployment

For production deployment:

1. Run the Colab notebook to get a stable Cloudflare Tunnel URL
2. Deploy the frontend to a hosting platform like Vercel
3. Configure the `VITE_API_URL` environment variable in your hosting platform to point to your Cloudflare Tunnel URL

## Important Notes

- The Colab backend will automatically disconnect after 90 minutes of inactivity
- You'll need to restart the notebook if it disconnects
- The Cloudflare Tunnel URL will remain stable across sessions as long as you authenticate with the same Cloudflare account

## Project Details

**URL**: https://lovable.dev/projects/61cd908a-2b47-41ae-8984-b6dce7b6b070

## Additional Resources

- [Google Colab Documentation](https://colab.research.google.com/)
- [Cloudflare Tunnels Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Flask Documentation](https://flask.palletsprojects.com/)

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/61cd908a-2b47-41ae-8984-b6dce7b6b070) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
