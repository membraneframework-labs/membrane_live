import { Product } from "../../types/types";

type ProductGenericProps = {
  product: Product;
  footer?: React.ReactNode;
};

const ProductGenericComponent = ({ product, footer }: ProductGenericProps) => {
  return (
    <div className="Product">
      <div className="ProductHeader">
        <span className="ProductPrice">{product.price}</span>
      </div>
      <img src={product.imageUrl} alt={product.name} />
      <div className="ProductFooter">
        <span className="">{product.name}</span>
        {footer}
      </div>
    </div>
  );
};

export default ProductGenericComponent;
