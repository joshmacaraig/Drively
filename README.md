# 🚗 Drively - Your Key to Adventure

A peer-to-peer car rental platform connecting car owners with renters in the Philippines.

![Drively Logo](./public/images/logo.png)

## 📋 Features

### For Renters
- ✅ Secure verification process (PhilSys ID, Proof of Address, Driver's License)
- 🚗 Browse available cars with filters
- 📅 Easy booking system
- ✓ Pickup and return checklists
- 🔔 Automated reminders

### For Car Owners
- 🚙 List and manage vehicles
- 📸 Upload multiple car images
- 💰 Set custom pricing
- 📊 Track maintenance schedules
- ✓ Complete checklists with renters

### For Admins
- 👤 Verify renter documents
- 📋 Manage users and cars
- 📈 View platform analytics
- 🛠️ System oversight

## 🛠️ Tech Stack

- **Frontend:** Next.js 14+ with TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Deployment:** Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))

### Setup Instructions

1. **Navigate to project directory**
   ```bash
   cd "C:\Users\XIAOMI\Desktop\ClaudeProject\Drively App"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   a. Create a new Supabase project at [supabase.com](https://supabase.com)
   
   b. Get your project URL and anon key from Project Settings > API
   
   c. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Create the database schema**
   
   a. Go to your Supabase project dashboard
   
   b. Navigate to SQL Editor
   
   c. Copy the contents of `supabase-schema.sql` and run it
   
   d. This will create all tables, indexes, RLS policies, and seed data

5. **Set up Supabase Storage**
   
   a. Go to Storage in your Supabase dashboard
   
   b. Create a new bucket called `drively-storage`
   
   c. Set the bucket to **private** (not public)

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
drively-app/
├── app/                      # Next.js app directory
│   ├── auth/                # Auth routes (login, signup)
│   ├── renter/              # Renter dashboard & features
│   ├── owner/               # Car owner dashboard & features
│   ├── admin/               # Admin dashboard
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # Reusable components
│   ├── ui/                  # Base UI components
│   ├── auth/                # Auth-related components
│   ├── car/                 # Car-related components
│   └── layout/              # Layout components
├── lib/                     # Utility libraries
│   ├── supabase/            # Supabase clients
│   └── types/               # TypeScript types
├── public/images/           # Static assets
├── middleware.ts            # Auth middleware
└── supabase-schema.sql      # Database schema
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Database Schema

### Key Tables

- **profiles** - User profiles with roles
- **verification_documents** - Renter verification docs
- **cars** - Vehicle listings
- **rentals** - Booking records
- **checklist_templates** - Reusable checklists
- **maintenance_records** - Car maintenance logs

See `supabase-schema.sql` for complete schema.

## 🔐 User Roles

- **renter** - Can browse and rent cars
- **car_owner** - Can list and manage cars  
- **admin** - Full platform access

Users can have multiple roles and switch between them.

## 🗺️ Roadmap

### MVP (Current Phase)
- [x] Project setup
- [x] Database schema
- [x] Landing page
- [ ] Authentication system
- [ ] Verification workflow
- [ ] Car management
- [ ] Booking system
- [ ] Checklists

### Phase 2
- [ ] Payment integration (GCash, Maya)
- [ ] In-app messaging
- [ ] Rating & reviews
- [ ] Push notifications

### Phase 3
- [ ] Mobile app (React Native)
- [ ] GPS tracking
- [ ] Insurance integration

## 🐛 Troubleshooting

**"Supabase URL is missing"**
- Make sure `.env.local` exists with valid credentials

**"Table does not exist"**
- Run `supabase-schema.sql` in Supabase SQL Editor

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ in the Philippines**
