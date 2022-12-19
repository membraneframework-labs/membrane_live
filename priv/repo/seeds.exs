# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     MembraneLive.Repo.insert!(%MembraneLive.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

alias MembraneLive.Products

case Mix.env() do
  :dev ->
    mock_item_url = "https://www.maybelline.pl/"
    mock_image_url = "https://www.maybelline.pl/~/media/mny/pl/products/packshots/oczy/sky%20high/primer/maybelline-sky-high-tinted-primer-041554081336-primary.jpg?thn=0&w=380&hash=EB463A26756F6E88944D3FC6E12E81E5E5AB3D96"

    IO.puts("Adding products")
    Products.create_product!(%{name: "Maybeline Ink", price: "21.37", item_url: mock_item_url , image_url: mock_image_url})
    Products.create_product!(%{name: "Maybeline Highlighter", price: "10.29", item_url: mock_item_url , image_url: mock_image_url})
    Products.create_product!(%{name: "Maybeline Eyelasher", price: "74.39", item_url: mock_item_url , image_url: mock_image_url})
    Products.create_product!(%{name: "Maybeline Eye Magic", price: "123.34", item_url: mock_item_url , image_url: mock_image_url})

  _ ->
    nil
end
