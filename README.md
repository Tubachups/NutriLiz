# 🥗 NutriLiz - Smart Nutrition Scanner

NutriLiz is an intelligent nutrition analysis system that combines barcode scanning hardware with AI-powered health assessments to help users make informed dietary decisions. The system provides comprehensive nutritional information, allergen warnings, and personalized health recommendations for both packaged foods and fresh produce.

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Testing](#testing)

## ✨ Features

### 🔍 Dual Data Source System
- **OpenFoodFacts Integration**: Access to millions of packaged food products worldwide
- **Custom Appwrite Database**: Local database for fresh foods and regional products (Philippines)
- Automatic fallback mechanism between data sources

### 🤖 AI-Powered Health Analysis
- **Google Gemini AI Integration**: Advanced nutritional risk assessment
- **Comorbidity-Aware Recommendations**: Tailored advice for users with specific health conditions
- **Allergen Detection**: Comprehensive allergen and trace detection
- **Processing Level Assessment**: NOVA group classification

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

### 🖥️ Multi-Platform Support
- **Web Frontend**: React-based responsive web application
- **Mobile App**: React Native/Expo mobile application (in development)
- **Hardware Integration**: USB barcode scanner support

## 🏗️ System Architecture

```
┌─────────────────┐
│  Barcode Scanner│
│   (USB Device)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      Backend (Flask API)            │
│  ┌─────────────────────────────┐   │
│  │  Serial Communication       │   │
│  │  (barcode.py)              │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│             ▼                       │
│  ┌─────────────────────────────┐   │
│  │  Data Fetching Layer        │   │
│  │  • Appwrite (Custom DB)     │   │
│  │  • OpenFoodFacts API        │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│             ▼                       │
│  ┌─────────────────────────────┐   │
│  │  Recommendation Engine      │   │
│  │  (scikit-learn/ML)         │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│             ▼                       │
│  ┌─────────────────────────────┐   │
│  │  AI Risk Assessment         │   │
│  │  (Google Gemini 2.5 Flash)  │   │
│  └──────────┬──────────────────┘   │
└─────────────┼───────────────────────┘
              │
              ▼
    ┌─────────────────┐
    │   Frontend      │
    │  (React/Vite)   │
    │  • Web App      │
    │  • Mobile App   │
    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Python 3.x** with Flask
- **PySerial**: Serial communication with barcode scanner
- **OpenFoodFacts SDK**: Product data retrieval
- **scikit-learn**: Machine learning for recommendations
- **Google GenAI**: AI-powered health analysis (Gemini 2.5 Flash)
- **Appwrite SDK**: Custom database integration

### Frontend (Web)
- **React 19** with Vite
- **TailwindCSS 4**: Utility-first styling
- Custom hooks for state management

### Frontend (Mobile)
- **React Native** with Expo
- **TypeScript**: Type safety

### Database & Services
- **Appwrite Cloud**: Database, file storage, and real-time sync
- **OpenFoodFacts API**: Global food product database
- **Google Gemini API**: AI health analysis

## 📋 Prerequisites

### Hardware
- USB Barcode Scanner (serial communication compatible)
- Computer/Raspberry Pi with USB port
- Internet connection

### Software
- Python 3.8+
- Node.js 18+ and npm
- Git

### API Keys Required
1. **Google Gemini API Key** - [Get it here](https://makersuite.google.com/app/apikey)
2. **Appwrite Account** - [Sign up](https://cloud.appwrite.io)
   - Project ID, API Key, Database ID, Collection ID, Bucket ID

## 🧪 Testing

Test individual components:

```bash
# Test barcode scanner
cd backend
python test_barcode.py

# Test Gemini AI
python test_gemini.py

# Test Appwrite connection
python test_appwrite.py
```

## 🙏 Acknowledgments

- **OpenFoodFacts**: Comprehensive food product data
- **Google Gemini**: AI-powered health analysis capabilities
- **Appwrite**: Cloud database and storage infrastructure
- **Open Source Community**: Amazing tools and libraries

---

**Made with ❤️ for healthier eating choices**