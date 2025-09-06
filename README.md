# W&W QUAN Website Project

## Introduction
Greetings! I'm Leo, and I'm thrilled to present my first personal project in Australia: a website for W&W QUAN, an authentic Vietnamese restaurant located in South Australia. This project is currently in the testing phase, during which I am integrating Stripe to facilitate secure online payments for orders. Please note that any purchases made on the website at this stage are for testing purposes only, and I apologize for any inconvenience this may cause. If you encounter any issues or errors while exploring the site, I would greatly appreciate your feedback in the comments. Thank you for taking the time to review this project!

## Frameworks
The project utilizes the following frameworks:
- React: For building the dynamic and responsive frontend.
- Node.js: For powering the backend server and handling API requests.

## Deployment
The website has been deployed as follows:
- Frontend: Hosted on Vercel. You can access the live site here: https://wwwvietnamese-restaurant-website.vercel.app/.
- Backend: Deployed using Render, which manages the Stripe server, webhook, and database operations.
- Database: Hosted on PlanetScale, storing critical payment details such as customer names, phone numbers, dish details, and more.

## Data Flow
The website's payment and data flow process operates as follows:
- When a customer completes a successful payment on the website, the Stripe webhook verifies the payment status.
- Upon confirmation, the payment metadata is sent to the PlanetScale database for storage.
- The system then sends an email confirmation to the customer using the provided email address.

## Feedback
I welcome any suggestions or bug reports to help improve this project. Please feel free to leave your feedback in the comments or create an issue in this repository. Thank you for your support!
