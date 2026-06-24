import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function DirectionProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return <>{children}</>;
}
