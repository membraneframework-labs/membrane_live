import { useEffect, useState} from "react";
import axiosWithInterceptor from "../../services";

export type Product = {
  id: string,
  name: string,
  price: string,
  itemUrl: string,
  imageUrl: string,
}

const imageSize = "200/150"

export type Props = {
  webinarId: string;
}

export const ProductsComponent = ({webinarId}: Props) => {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    let ignore = false;
    // const url = `http://localhost:4000/resources/webinars/${webinarId}/products`;
    const url = `http://localhost:4000/resources/products`;

    axiosWithInterceptor.get(url)
      .then(response => {
        if (!ignore) {
          setProducts(response.data.products);
        }
      })
      .catch(response => {
        console.error(`Failed to fetch products: ${response}`);
      })

    return () => {
      ignore = true;
    }
  }, [])

  return <div className="ProductList">
    {products.map((product) => (
      <a key={product.id} href={product.itemUrl} target="_blank" rel="noreferrer">
        <div
          className="Product">
          <div className="ProductHeader">
            <span className="ProductPrice">{product.price}</span>
          </div>
          <img src={product.imageUrl} alt={product.name}/>
          <div className="ProductFooter">
            <span className="">{product.name}</span>
          </div>
        </div>
      </a>))

    }
  </div>;
}

