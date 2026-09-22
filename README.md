# Lumina Prints - Custom Printing Business Website

A modern, premium, and highly animated custom printing business website built with Next.js, React, and Framer Motion.

## Features

- **Premium Design:** Soft color palette, modern typography, glassmorphism, and smooth scroll animations.
- **Responsive Layout:** Works beautifully across Desktop, Tablet, and Mobile devices.
- **Animated Interactions:** Uses Framer Motion for scroll reveals, hover effects, and micro-interactions.
- **Secure Contact Form:** Next.js API route using `nodemailer` to securely forward customer inquiries directly to the business owner without exposing the email address on the frontend.
- **SEO Optimized:** Next.js App Router with metadata for better search engine visibility.

## Setup Instructions

### 1. Install Dependencies

First, install the necessary dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` or `.env.local` file in the root directory. You can copy the template from `.env.example`:

```bash
cp .env.example .env
```

Open the `.env` file and configure your SMTP credentials. For Gmail, you will need to generate an **App Password**:
1. Go to your Google Account settings.
2. Navigate to **Security**.
3. Enable 2-Step Verification if it's not already on.
4. Go to **App Passwords** and generate a new password for this app.
5. Paste it in the `SMTP_PASS` variable.

The inquiries will be sent to `pkashyap1506@gmail.com` (configurable via `CONTACT_EMAIL`).

### 3. Run the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

- **Frontend:** Next.js (App Router), React, CSS Modules, Framer Motion, Lucide React (Icons).
- **Backend/API:** Next.js Route Handlers (`app/api/contact/route.ts`).
- **Styling:** Custom CSS variables and modules (`globals.css` and `*.module.css`) for maximum flexibility without heavy frameworks.

## Deployment

This Next.js app can be easily deployed to [Vercel](https://vercel.com/new) or any other hosting provider that supports Node.js. Make sure to set the environment variables in your hosting provider's dashboard.
