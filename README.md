# 🥗 NutriLiz - Smart Nutrition Scanner

NutriLiz is an intelligent nutrition analysis system that combines barcode scanning hardware with AI-powered health assessments to help users make informed dietary decisions. The system provides comprehensive nutritional information, allergen warnings, and personalized health recommendations for both packaged foods and fresh produce.

## 📋 Table of Contents

- [Recent Feature Updates](#-recent-feature-updates)
- [Features](#features)
- [System Architecture](#system-architecture)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Testing](#testing)

## ✨ Features

### 🔍 Dual Data Source System
- **OpenFoodFacts Integration**: Access to millions of packaged food products worldwide
- **Custom Appwrite Database**: Local database for fresh foods and regional products (Philippines)
- Automatic fallback mechanism between data sources

### 🤖 AI-Powered Health Analysis
- **Google Gemini AI Integration**: Advanced nutritional risk assessment (Gemini 3.1 Flash-Lite)
- **Comorbidity-Aware Recommendations**: Tailored advice for users with specific health conditions
- **Allergen Detection**: Comprehensive allergen and trace detection
- **Processing Level Assessment**: NOVA group classification
- **Food Image Recognition**: Identify fresh foods from photos and get instant nutritional info
- **FNRI + USDA Nutrition Enrichment**: Image-recognized foods are enriched using FNRI first, then USDA fallback when needed

### 📊 Comprehensive Nutritional Data
- Macronutrients (carbs, proteins, fats, fiber, sugars)
- Micronutrients (vitamins, minerals, calcium, iron)
- Energy content (calories)
- Sodium/salt content
- Saturated fat analysis

### 🎯 Smart Product Recommendations
- **ML-Based Similarity Matching**: Cosine similarity algorithm for finding similar products
- **Multi-Factor Scoring System**: 
  - Nutritional profile matching
  - Category-based filtering
  - Regional availability (Philippines focus)
- Duplicate product detection

### 🏷️ Quality & Certification Tracking
- Nutri-Score grading
- Eco-Score environmental impact
- Labels and certifications
- Awards and recognitions

### 📸 Camera & Vision Features
- **Live Camera Feed**: MJPEG video stream from hardware camera (`/video`)
- **Real-time Barcode Detection**: Hardware barcode scanner integration via serial port
- **Food Image Analysis**: Upload or capture images of fresh food for AI-powered identification and nutrition lookup
- **Food Safety Guardrails**: Spoilage/expired-food signals to warn users before proceeding
- **Disambiguation Workflow**: User confirmation flow for ambiguous foods and sauce-heavy dishes before nutrition finalization

### 🛡️ Admin Panel
- **User Management**: List and view all registered users (`/api/admin/users`)
- **Scan History Tracking**: Per-user scan history access for admins (`/api/admin/users/<id>/scan-history`)
- **Admin-only Routes**: Role-based access control on both backend and frontend

### 🖥️ Multi-Platform Support
- **Web Frontend**: React 19 + TailwindCSS 4 responsive web application with TanStack Router
- **Mobile App**: React Native/Expo mobile application with camera and barcode scanning
- **Hardware Integration**: USB barcode scanner + Raspberry Pi camera support

## 🆕 Recent Feature Updates

- Added **food disambiguation flow** with confirmation support for medium/low confidence image results and ambiguous dishes.
- Added **food safety classification** for expired/spoiled detection with frontend-safe flags and warning messages.
- Added **nutrition-source cascade** for image-recognized foods: FNRI nutrition lookup first, then USDA FoodData Central fallback.
- Added **food validation + confirmation APIs** for safer and more accurate image-recognition finalization:
  - `POST /api/validate-food-input`
  - `POST /api/confirm-food-name`
- Improved mobile scan flow with stronger handling for duplicate barcode events and scan finalization states.

## 🏗️ System Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  Barcode Scanner│     │  Device Camera   │
│   (USB/Serial)  │     │  (Pi / Webcam)   │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         ▼                       ▼
┌────────────────────────────────────────────┐
│            Backend (Flask API)             │
│  ┌──────────────────────────────────────┐  │
│  │  barcode.py  │  food_recognition.py  │  │
│  └──────────────┴──────────────┬────────┘  │
│                                │           │
│                                ▼           │
│  ┌──────────────────────────────────────┐  │
│  │          Data Fetching Layer         │  │
│  │    • Appwrite (Custom DB)            │  │
│  │    • OpenFoodFacts API               │  │
│  └──────────────────┬───────────────────┘  │
│                     │                      │
│                     ▼                      │
│  ┌──────────────────────────────────────┐  │
│  │       Recommendation Engine          │  │
│  │       (scikit-learn / ML)            │  │
│  └──────────────────┬───────────────────┘  │
│                     │                      │
│                     ▼                      │
│  ┌──────────────────────────────────────┐  │
│  │    AI Risk Assessment & Vision       │  │
│  │    (Google Gemini 3.1 Flash-Lite)    │  │
│  └──────────────────┬───────────────────┘  │
│                     │                      │
│  ┌──────────────────────────────────────┐  │
│  │    Admin Blueprint (/api/admin)      │  │
│  └──────────────────────────────────────┘  │
└─────────────────────┬──────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │        Frontends        │
        │  • Web App (React/Vite) │
        │  • Mobile App (Expo)    │
        └─────────────────────────┘
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/video` | MJPEG live camera stream |
| GET | `/api/latest-barcode` | Fetch the last scanned barcode |
| GET | `/api/product/<barcode>` | Get product data (with optional `?recommendations=true`) |
| GET | `/api/recommendations/<barcode>` | Get similar product recommendations (`?limit=1-10`) |
| GET/POST | `/api/assess/<barcode>` | AI risk assessment; POST with user profile for personalized results |
| POST | `/api/analyze-food-image` | Analyze a food image (base64); returns identification + nutrition |
| POST | `/api/validate-food-input` | Validate user-typed food name for disambiguation confirmation |
| POST | `/api/confirm-food-name` | Apply confirmed food name and return updated nutrition data |
| POST | `/api/food-alternatives` | Get healthier food alternatives by food name |
| GET | `/api/admin/users` | *(Admin)* List all users |
| GET | `/api/admin/users/<user_id>` | *(Admin)* Get a specific user's details |
| GET | `/api/admin/users/<user_id>/scan-history` | *(Admin)* Get a user's scan history |

## 🛠️ Tech Stack

### Backend
- **Python 3.x** with Flask 3.1 + Gunicorn
- **PySerial**: Serial communication with barcode scanner
- **OpenCV** (`opencv-python-headless`): Camera capture and MJPEG streaming
- **OpenFoodFacts SDK**: Product data retrieval
- **scikit-learn + NumPy**: ML-based product recommendations (cosine similarity)
- **Google GenAI**: AI-powered health analysis and food image recognition (Gemini 3.1 Flash-Lite)
- **Appwrite SDK**: Custom database and user management

### Frontend (Web) — `fe-web/`
- **React 19** with **Vite 7**
- **TanStack Router v1**: File-based routing with lazy loading
- **TailwindCSS 4** + **DaisyUI 5**: Utility-first styling and component library
- **Lucide React**: Icon library
- **Appwrite JS SDK v21**: Auth, database, and storage
- **react-to-print**: Print support
- Pages: Dashboard (admin), Scan, Product Detail, Image Search, History, Profile, Login, Forgot Password

### Frontend (Mobile) — `fe-mob/`
- **React Native 0.81** with **Expo SDK 54**
- **Expo Router v6**: File-based navigation
- **React Native Paper**: Material Design UI components
- **expo-camera** + **expo-image-picker**: Camera and image capture
- **react-native-appwrite v0.18**: Auth, database, and storage
- **expo-print**: PDF/print support
- Screens: Home, Scan, Food Scan, Product Detail, Food Detail, List, Profile, Auth, Forgot Password, Reset Password, Admin Dashboard, User Details

### Database & Services
- **Appwrite Cloud**: Database, file storage, user auth, and real-time sync
- **OpenFoodFacts API**: Global food product database
- **Google Gemini API**: AI health analysis and food vision

## 📋 Prerequisites

### Hardware
- USB Barcode Scanner (serial communication compatible)
- Computer/Raspberry Pi with USB port and camera module
- Internet connection

### Software
- Python 3.8+
- Node.js 18+ and npm
- Git

### API Keys Required
1. **Google Gemini API Key** - [Get it here](https://makersuite.google.com/app/apikey)
2. **Appwrite Account** - [Sign up](https://cloud.appwrite.io)
   - Project ID, API Key, Database ID, Collection ID, Bucket ID

### Environment Variables

#### Backend (`backend/.env`)
```
GEMINI_API_KEY=your_gemini_api_key
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_COLLECTION_ID=your_collection_id
```

#### Frontend Web (`fe-web/.env`)
```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_BACKEND_URL=http://localhost:5000
```

## 🧪 Testing

Test individual backend components:

```bash
cd backend

# Test barcode scanner
python test_barcode.py

# Test Gemini AI
python test_gemini.py

# Test Appwrite connection
python test_appwrite.py
```

## 🙏 Acknowledgments

- **OpenFoodFacts**: Comprehensive food product data
- **Google Gemini**: AI-powered health analysis and food recognition capabilities
- **Appwrite**: Cloud database, auth, and storage infrastructure
- **Open Source Community**: Amazing tools and libraries

---

**Made with ❤️ for healthier eating choices**