import React from "react";
import {Product} from "./SidebarList";

type Prop = Product

export const ProductComponent = (product: Product) => <div className="Product">
  <div className="ProductHeader">
    <span className="ProductPrice">{product.price}</span>
  </div>
  <img src={product.imageUrl} alt={product.name}/>
  <div className="ProductFooter">
    <span className="">{product.name}</span>
  </div>
</div>;
