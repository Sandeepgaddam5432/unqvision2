# UnQVision - AI Video Generator

## Architecture Overview

UnQVision now uses a client-server architecture to handle resource-intensive video generation:

- **Frontend (client)**: React application that handles user interface and API calls
- **Backend (server)**: Node.js Express server that processes video generation using FFmpeg

This architecture allows the application to work on devices with limited resources, as the heavy processing is offloaded to the server.

## Setup and Development

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- FFmpeg - Required on the server machine (see server/README.md for installation instructions)

### Running the Frontend

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:8080

### Running the Backend

```sh
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server
npm start
```

The backend will be available at http://localhost:3001

## Project Technologies

This project is built with:

- **Frontend**:
  - Vite
  - TypeScript
  - React
  - shadcn-ui
  - Tailwind CSS

- **Backend**:
  - Node.js
  - Express
  - fluent-ffmpeg
  - fs-extra

## Deployment

For production deployment:

1. Deploy the backend server to a machine with sufficient resources
2. Update the frontend's `VITE_API_URL` environment variable to point to your backend server
3. Deploy the frontend to a hosting platform like Vercel

## Project Details

**URL**: https://lovable.dev/projects/61cd908a-2b47-41ae-8984-b6dce7b6b070

## Additional Resources

- For more information about the backend, see [server/README.md](server/README.md)
- To learn about API endpoints, consult the backend documentation

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
