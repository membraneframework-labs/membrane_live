import { useEffect, useState } from "react";
import axiosWithInterceptor from "../services";
import { Product } from "../types/types";

export const useProducts = (webinarId: string) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let ignore = false;
    // const url = `http://localhost:4000/resources/webinars/${webinarId}/products`;
    const url = `${window.location.origin}/resources/products`;

    axiosWithInterceptor
      .get(url)
      .then((response) => {
        if (!ignore) {
          setProducts(response.data.products);
        }
      })
      .catch((response) => {
        console.error(`Failed to fetch products: ${response}`);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return products;
};
