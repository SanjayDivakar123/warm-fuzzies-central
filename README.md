# Welcome to the RoleColorFinder project

## Project info

**URL**: [https://rolecolorfinder.vercel.app](https://rolecolorfinder.vercel.app)

This project was initially prototyped using Lovable. The platform has now fully migrated off Lovable and is maintained independently via GitHub and Vercel.

## How can I edit this code?

There are several ways of editing this application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and prepare changes.

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

* Navigate to the desired file(s).
* Click the "Edit" button (pencil icon) at the top right of the file view.
* Make your changes and commit them to a branch.

**Use GitHub Codespaces**

* Navigate to the main page of this repository.
* Click on the "Code" button (green button) near the top right.
* Select the "Codespaces" tab.
* Click on "New codespace" to launch a new Codespace environment.
* Edit files directly within the Codespace and commit your changes.

## Contribution & change control

All edits must be reviewed and approved by the **Team Lead** before being merged.

* Contributors may prepare changes using any of the methods above.
* Direct pushes to production branches are restricted.
* Final commits and merges are performed only by the Team Lead to ensure stability and controlled deployments.

## What technologies are used for this project?

This project is built with:

* Vite
* TypeScript
* React
* shadcn-ui
* Tailwind CSS

## How can I deploy this project?

This project is deployed using **Vercel**.

Any push to the `main` branch triggers an automatic production deployment.

Vercel build configuration:

* Framework: Vite
* Build command: `npm run build`
* Output directory: `dist`

## Notes

* Lovable is no longer used for editing, deployment, or domain management.
* GitHub and Vercel are the sole sources of version control and CI/CD.
