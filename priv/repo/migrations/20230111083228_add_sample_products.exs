defmodule MembraneLive.Repo.Migrations.AddSampleProducts do
  use Ecto.Migration
  alias MembraneLive.Products

  def change do
    mock_item_url = "https://www.maybelline.pl/"
    mock_image_url = "https://www.maybelline.pl/~/media/mny/pl/products/packshots/oczy/sky%20high/primer/maybelline-sky-high-tinted-primer-041554081336-primary.jpg?thn=0&w=380&hash=EB463A26756F6E88944D3FC6E12E81E5E5AB3D96"

    IO.puts("Adding products")
    Products.create_product!(%{name: "Maybeline Ink", price: "21.37", itemUrl: mock_item_url , imageUrl: mock_image_url})
    Products.create_product!(%{name: "Maybeline Highlighter", price: "10.29", itemUrl: mock_item_url , imageUrl: mock_image_url})
    Products.create_product!(%{name: "Maybeline Eyelasher", price: "74.39", itemUrl: mock_item_url , imageUrl: mock_image_url})
    Products.create_product!(%{name: "Maybeline Eye Magic", price: "123.34", itemUrl: mock_item_url , imageUrl: mock_image_url})

  end
end
