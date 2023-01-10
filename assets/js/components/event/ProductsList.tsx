import { Product } from "../../types/types";
import ProductGenericComponent from "./ProductGenericComponent";

type ProductsListProps = {
  products: Product[];
};

const ProductsList = ({ products }: ProductsListProps) => {
  return (
    <div className="ProductList">
      {products.map((product) => (
        <a key={product.id} href={product.itemUrl} target="_blank" rel="noreferrer">
          <ProductGenericComponent product={product} />
        </a>
      ))}
    </div>
  );
};

export default ProductsList;
