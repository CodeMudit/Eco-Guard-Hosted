import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "EcoWatch": "EcoWatch",
      "Overview": "Overview",
      "Alerts": "Alerts",
      "Reports": "Reports",
      "AI Engine": "AI Engine",
      "Notify Admin": "Notify District Admin",
      "Landslide Risk": "Landslide Risk",
      "Flood Risk": "Flood Risk"
    }
  },
  hi: {
    translation: {
      "EcoWatch": "इकोवॉच",
      "Overview": "अवलोकन",
      "Alerts": "अलर्ट",
      "Reports": "रिपोर्ट्स",
      "AI Engine": "एआई इंजन",
      "Notify Admin": "ज़िला अधिकारी को सूचित करें",
      "Landslide Risk": "भूस्खलन का जोखिम",
      "Flood Risk": "बाढ़ का जोखिम",
      "Home": "होम",
      "Nodes": "नोड्स",
      "ML Predictions": "एमएल भविष्यवाणियाँ",
      "API Data": "एपीआई डेटा",
      "Analytics": "विश्लेषिकी",
      "Hazard Zones": "खतरे वाले क्षेत्र",
      "Settings": "सेटिंग्स",
      "System Online": "सिस्टम ऑनलाइन"
    }
  },
  as: {
    translation: {
      "EcoWatch": "ইক'ৱাচ",
      "Overview": "ওভাৰভিউ",
      "Alerts": "সতৰ্কবাণী",
      "Reports": "প্ৰতিবেদন",
      "AI Engine": "এআই ইঞ্জিন",
      "Notify Admin": "জিলা প্ৰশাসকক জনাওক",
      "Landslide Risk": "ভূমিস্খলনৰ আশংকা",
      "Flood Risk": "বানপানীৰ আশংকা",
      "Home": "গৃহ",
      "Nodes": "ন'ডসমূহ",
      "ML Predictions": "এমএল পূৰ্বানুমান",
      "API Data": "এপিআই তথ্য",
      "Analytics": "বিশ্লেষণ",
      "Hazard Zones": "বিপদজনক অঞ্চল",
      "Settings": "ছেটিংছ",
      "System Online": "চিষ্টেম অনলাইন"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
