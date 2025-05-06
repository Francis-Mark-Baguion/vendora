"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ReactNode } from "react";

export const CurrencyContext = createContext({
  currency: "USD",
  setCurrency: (currency: string) => {},
  exchangeRate: 1, // This will now represent how much USD 1 unit of selected currency is worth
});

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        // Always fetch USD rates first
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();

        if (data && data.rates) {
          if (currency === "USD") {
            setExchangeRate(1);
          } else {
            // Get how much USD is worth in the selected currency
            // For example: 1 USD = 50 PHP → exchangeRate will be 50
            const rate = data.rates[currency];
            if (rate) {
              setExchangeRate(rate);
            }
          }
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
