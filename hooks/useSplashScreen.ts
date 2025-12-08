import { useState, useEffect } from "react";

export const useSplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Splash screen sempre aparece por 1.5 segundos
    // Ordem garantida: Splash Screen (1.5s) → Login → Tela Principal
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500); // 1.5 segundos

    return () => clearTimeout(timer);
  }, []); // Executa quando o app abre

  return { isVisible, hideSplash: () => setIsVisible(false) };
};
