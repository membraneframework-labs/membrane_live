import { Product } from "../../types/types";
import ProductGenericComponent from "./ProductGenericComponent";

type ProductsListProps = {
  products: Product[];
  enablePictureInPicture: () => void;
};

const ProductsList = ({ products, enablePictureInPicture }: ProductsListProps) => {
  const openInNewTab = (link: string) => {
    enablePictureInPicture();
    const popup = window.open(link);
    // TODO change this to a proper promise-based asynchronous call
    if (popup === null)
      setTimeout(
        () =>
          document.exitPictureInPicture().catch((error) => console.error("Picture in picture could not close", error)),
        200
      );
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
