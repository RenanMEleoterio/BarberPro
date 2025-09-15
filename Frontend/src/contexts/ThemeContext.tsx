import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Define a interface para o contexto de tema, especificando o estado do tema e a função para alterná-lo.
 */
interface ThemeContextType {
  isDark: boolean; // Indica se o tema atual é escuro (true) ou claro (false).
  toggleTheme: () => void; // Função para alternar entre o tema claro e escuro.
}

// Cria o contexto de tema com um valor inicial indefinido.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provedor de tema que gerencia o estado do tema da aplicação (claro/escuro).
 * Persiste a preferência do usuário no localStorage e aplica a classe 'dark' ao elemento HTML.
 * @param {React.ReactNode} children - Os componentes filhos que terão acesso ao contexto de tema.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Estado para armazenar se o tema atual é escuro. Inicializa como true (escuro) por padrão.
  const [isDark, setIsDark] = useState(true);

  // Efeito para carregar a preferência de tema do localStorage na montagem do componente.
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark'); // Define o tema com base no valor salvo.
    }
  }, []);

  // Efeito para aplicar a classe 'dark' ao elemento <html> e salvar a preferência no localStorage
  // sempre que o estado 'isDark' mudar.
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark'); // Adiciona a classe 'dark' para ativar o tema escuro.
    } else {
      document.documentElement.classList.remove('dark'); // Remove a classe 'dark' para ativar o tema claro.
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); // Salva a preferência no localStorage.
  }, [isDark]);

  /**
   * Função para alternar o tema atual (de claro para escuro e vice-versa).
   */
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook personalizado para consumir o contexto de tema.
 * Garante que o hook seja usado dentro de um ThemeProvider.
 * @returns {ThemeContextType} - O objeto do contexto de tema.
 * @throws {Error} - Lança um erro se o hook for usado fora de um ThemeProvider.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


