import {Button} from "@chakra-ui/react";
import ProductGenericComponent from "./ProductGenericComponent";
import {Product} from "../../types/types";

export type ItemStatus = "SELECTED" | "NOT-SELECTED"
export type ProductWithStatus = (Product & { status: ItemStatus })

type ProductProps = {
  add: (id: string) => void;
  remove: (id: string) => void;
  isLoading: boolean;
  product: ProductWithStatus;
}

const ProductComponent = ({product, add, remove, isLoading}: ProductProps) => {
  const button = product.status === "NOT-SELECTED"
    ? {onClick: () => add?.(product.id), label: "Add", colorScheme: "green"}
    : {onClick: () => remove?.(product.id), label: "Remove", colorScheme: "red"}

  return <ProductGenericComponent
    product={product}
    footer={<div>
      <Button colorScheme={button.colorScheme}
              disabled={isLoading}
              margin="8px"
              onClick={button.onClick}>{button.label}
      </Button>
    </div>
    }/>
}

export default ProductComponent
