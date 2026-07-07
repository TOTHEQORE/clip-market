# ClipMarket

An original demo marketplace for UGC "clipping" campaigns: brands post campaigns with a budget and a per-1,000-views rate, and creators submit clips and earn based on performance. Built as a learning/starter project. Not affiliated with or copied from any existing clipping platform.

## Features

Brands and creators can register with email and password and choose a role. Brands can publish campaigns with a title, brief, requirements, total budget and CPM rate. Creators can browse open campaigns and submit a link to their posted clip. Brands can then review submissions, enter the clip's view count, and approve or reject it. Payout is calculated automatically as (views divided by 1000) times the campaign CPM rate. The creator dashboard shows total approved earnings. Data is stored in a simple JSON file on disk at data/db.json, so no external database is needed to run it locally.

## Running it locally

Install Node.js 18 or newer. From the project folder run "npm install" to install dependencies, then run "npm start" to start the server. Open http://localhost:3000 in your browser.

## What is a placeholder, and why

This is a starter and demo app. Two pieces are intentionally left as placeholders because they require you personally to set up accounts and credentials, which is not something that can be safely automated on your behalf. First, real view-count tracking: right now brands manually type in a submission's view count. Pulling real view counts automatically from TikTok, Instagram or YouTube would require registering developer apps with each platform and adding their official APIs into routes/submissions.js. Second, real payouts: approving a submission currently only increases an internal balance number stored in data/db.json. Actually moving money to creators requires connecting a real payment processor such as Stripe Connect. That means creating your own Stripe account, adding the Stripe SDK, and replacing the balance-update logic in routes/submissions.js with real payout calls, using only your own credentials.

## Project structure

server.js is the Express app entry point. routes/auth.js handles register, login, logout and the current-user endpoint. routes/campaigns.js handles creating and listing campaigns. routes/submissions.js handles submitting clips, listing submissions, and updating views and status. lib/store.js is a tiny JSON-file data layer. lib/auth.js contains password hashing and token helpers. middleware/auth.js handles request authentication and role checks. The public folder holds the frontend, which is plain HTML, CSS and JavaScript with no build step required.

## Security notes

Passwords are hashed with Node's built-in scrypt function and are never stored in plain text. That said, this is a learning project and has not been audited for production use. Before handling real money or real user data, add HTTPS, rate limiting, input validation, and a real database.
