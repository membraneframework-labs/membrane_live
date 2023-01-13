import { Product } from "../../types/types";
import ProductGenericComponent from "./ProductGenericComponent";

type ProductsListProps = {
  products: Product[];
  enablePictureInPicture: () => void;
};

const ProductsList = ({ products, enablePictureInPicture }: ProductsListProps) => {
  const openInNewTab = (link: string) => {
    enablePictureInPicture();
    window.open(link);
  };

  return (
    <div className="ProductList">
      {products.map((product) => (
        <button key={product.id} onClick={() => openInNewTab(product.itemUrl)}>
          <ProductGenericComponent product={product} />
        </button>
      ))}
    </div>
  );
};

export default ProductsList;
