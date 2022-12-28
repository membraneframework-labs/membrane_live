import { Product } from "../../types/types";

type ProductsListProps = {
  products: Product[];
};

const ProductsList = ({ products }: ProductsListProps) => {
  return (
    <div className="ProductList">
      {products.map((product) => (
        <a key={product.id} href={product.itemUrl} target="_blank" rel="noreferrer">
          <div className="Product">
            <div className="ProductHeader">
              <span className="ProductPrice">{product.price}</span>
            </div>
            <img src={product.imageUrl} alt={product.name} />
            <div className="ProductFooter">
              <span className="">{product.name}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default ProductsList;
