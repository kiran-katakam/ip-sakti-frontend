import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="lang-switcher">
      <label className="tag" htmlFor="lang-select">
        🌐 {t("langSwitcher.label")}
      </label>

      <select
        id="lang-select"
        value={i18n.language?.split("-")[0] || "en"}
        onChange={(e) =>
          i18n.changeLanguage(e.target.value)
        }
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
