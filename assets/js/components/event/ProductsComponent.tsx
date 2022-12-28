import React, {useCallback, useState} from "react";
import axiosWithInterceptor from "../../services";

export type Product = {
  id: string,
  name: string,
  price: string,
  itemUrl: string,
  imageUrl: string,
}

const imageSize: string = "200/150"

const productsMock: Product[] = [{
  id: "1",
  name: "Kawiarnia",
  price: "999$",
  itemUrl: "https://google.com",
  imageUrl: `https://picsum.photos/id/42/${imageSize}`,
}, {
  id: "2",
  name: "Most",
  price: "15$",
  itemUrl: "https://allegro.pl",
  imageUrl: `https://picsum.photos/id/43/${imageSize}`,
}, {
  id: "3",
  name: "Laptop",
  price: "79.99$",
  itemUrl: "#",
  imageUrl: `https://picsum.photos/id/48/${imageSize}`,
}, {
  id: "4",
  name: "Kulki",
  price: "999$",
  itemUrl: "#",
  imageUrl: `https://picsum.photos/id/56/${imageSize}`,
}, {
  id: "5",
  name: "Natura rozwkita ponownie",
  price: "1 $",
  itemUrl: "#",
  imageUrl: `https://picsum.photos/id/55/${imageSize}`,
},
  {
    id: "6",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "7",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "8",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "9",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "10",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "11",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "12",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "13",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "14",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "15",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "16",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "17",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
  {
    id: "18",
    name: "Natura rozwkita ponownie",
    price: "1 $",
    itemUrl: "#",
    imageUrl: `https://picsum.photos/id/55/${imageSize}`,
  },
]

export type Props = {
  webinarId: string;
}

export const ProductsComponent = ({webinarId}: Props) => {

  const [products, setProducts] = useState<Product[]>([])

  const getProducts = useCallback(() => {
    axiosWithInterceptor.get(`http://localhost:4000/resources/webinars/${webinarId}/products`)
      .then(response => {
        console.log(response.data.products)
        setProducts(response.data.products);
      })
  }, [setProducts, webinarId])

  return <div className="ProductList">
    <button onClick={getProducts}>Download products</button>
    {products.map((product) => (
      <a key={product.id} href={product.itemUrl} target="_blank">
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

