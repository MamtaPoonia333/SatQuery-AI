import React, { useEffect, useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "ta", label: "தமிழ்" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "or", label: "ଓଡ଼ିଆ" },
  { code: "as", label: "অসমীয়া" },
  { code: "ur", label: "اردو" },
];

const SCRIPT_ID = "google-translate-script";

const LanguageSelector = () => {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate || document.querySelector(".goog-te-combo")) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: LANGUAGES.map(({ code }) => code).join(","),
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate) {
      window.googleTranslateElementInit();
    }

  }, []);

  const changeLanguage = (event) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);

    const googleSelect = document.querySelector(".goog-te-combo");
    if (!googleSelect) return;

    googleSelect.value = nextLanguage;
    googleSelect.dispatchEvent(new Event("change"));
  };

  return (
    <div className="language-control">
      <span className="language-icon" aria-hidden="true">文</span>
      <label htmlFor="site-language" className="sr-only">Website language</label>
      <select id="site-language" value={language} onChange={changeLanguage}>
        {LANGUAGES.map(({ code, label }) => (
          <option value={code} key={code}>{label}</option>
        ))}
      </select>
      <div id="google_translate_element" aria-hidden="true" />
    </div>
  );
};

export default LanguageSelector;