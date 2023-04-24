import { Product } from "../types/types";
import { useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { axiosWithInterceptor } from "../services";
import axios from "axios";

const REFETCH_PRODUCTS_INTERVAL_MILLIS = 15 * 1000;

export const useWebinarProductsQuery = (productId: string) =>
  useQuery({
    queryKey: ["get-webinar-products", productId],
    queryFn: async () => await axios.get(`/resources/webinars/${productId}/products`),
    enabled: productId !== "",
    refetchOnWindowFocus: false,
    refetchInterval: REFETCH_PRODUCTS_INTERVAL_MILLIS,
  });

export const useAllProductsQuery = (enabled: boolean) =>
  useQuery({
    queryKey: ["get-all-products"],
    queryFn: async () => await axiosWithInterceptor.get(`/resources/products`),
    refetchOnWindowFocus: false,
    enabled,
  });

type UseProducts = {
  addProduct: (id: string) => void;
  removeProduct: (id: string) => void;
  products: Product[];
};

const ADD_PRODUCT_MUTATION_NAME = "ADD-PRODUCT";
const REMOVE_PRODUCT_MUTATION_NAME = "REMOVE-PRODUCT";

export const useWebinarProducts = (webinarId: string): UseProducts => {
  const { refetch, data } = useWebinarProductsQuery(webinarId);
  const products: Product[] = data?.data?.products || [];

  const addProductMutation = useMutation({
    mutationKey: [ADD_PRODUCT_MUTATION_NAME],
    mutationFn: async (id: string) =>
      await axiosWithInterceptor.post(`/resources/webinars/${webinarId}/products`, { productId: id }),
    onSuccess: async () => await refetch(),
  });

  const removeProductMutation = useMutation({
    mutationKey: ["REMOVE-PRODUCT"],
    mutationFn: async (id: string) =>
      await axiosWithInterceptor.delete(`/resources/webinars/${webinarId}/products/${id}`),
    onSuccess: async () => await refetch(),
  });
  return {
    products,
    addProduct: addProductMutation.mutate,
    removeProduct: removeProductMutation.mutate,
  };
};

export const useIsProductMutating = (): boolean => {
  const numberOfMutation = useIsMutating({
    predicate: (mutation) => {
      const name = mutation.options.mutationKey?.[0];
      return name === ADD_PRODUCT_MUTATION_NAME || name === REMOVE_PRODUCT_MUTATION_NAME;
    },
  });

  return numberOfMutation > 0;
};
