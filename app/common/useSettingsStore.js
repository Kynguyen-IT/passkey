import { useEffect, useState } from "react";

export const useChromeStorage = (options = {}) => {
  const [data, setData] = useState(options.initialData || {});

  useEffect(() => {
    const callback = (items) => {
      setData(items);
    };

    if (options.get) {
      chrome.storage.local.get(options.get, callback);
    }

    return () => {
      if (options.set) {
        chrome.storage.local.set(options.set);
      }
    };
  }, [options]);

  return [data, setData];
};
