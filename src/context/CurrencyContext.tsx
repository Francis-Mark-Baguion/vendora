"use client";
import { createContext, useContext, useState, useEffect } from "react";

export const CurrencyContext = createContext({
  currency: "USD",
  setCurrency: (currency: string) => {},
  exchangeRate: 1,
});

import { ReactNode } from "react";

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
        const data = await response.json();
        if (data && data.rates) {
          setExchangeRate(data.rates["USD"] || 1);
        }
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
      }
    };

    fetchExchangeRate();
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
