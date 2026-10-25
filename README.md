Aaangan – Orphanage Management System

Aaangan is a responsive web application designed to simplify orphanage management by providing a centralized dashboard to manage children, staff, donations, expenses, and financial reports.

Features

- Admin Authentication: Secure login and logout.
- Dashboard: View important statistics and recent records.
- Children Management: Add, update, search, archive, and restore children's records.
- Staff Management: Manage staff details, roles, shifts, and contact information.
- Donations: Record and manage donations and payment methods.
- Expenses: Track expenses, categories, and payments.
- Reports: View financial summaries, spending categories, and monthly reports.
- Responsive Design: Works on desktop, tablet, and mobile devices.

Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- Authentication: JWT and HTTP-only cookies
- Deployment: Vercel and Render

Installation

1. Clone the frontend and backend repositories from GitHub.

2. Install dependencies in both project directories:

npm install

3. Configure environment variables.

Backend ".env":

PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
FRONTEND_URL=http://localhost:5173

Frontend ".env":

VITE_API_URL=http://localhost:5000

Replace the example values with your actual credentials and configuration.

4. Start the application. Run the backend using its configured npm start script and the frontend using:

npm run dev

Open the local URL provided by Vite.

Deployment

- Frontend: Deployed on Vercel.
- Backend: Deployed on Render.
- Database: Hosted on MongoDB Atlas.

Configure the production environment variables with your deployed frontend URL and backend URL.

---

Aaangan – Care, Coordination, and Transparency.
