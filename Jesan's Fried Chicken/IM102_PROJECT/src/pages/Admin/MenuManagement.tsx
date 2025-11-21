import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { products as initialProducts } from '@/data/products';

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const MenuManagement = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    image: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) return;

    setProducts([
      ...products,
      { ...newProduct, id: Date.now().toString(), price: Number(newProduct.price) },
    ]);

    setNewProduct({ name: '', price: 0, image: '' });
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setNewProduct({ name: product.name, price: product.price, image: product.image });
  };

  const saveEdit = () => {
    if (!editingId) return;

    setProducts(
      products.map(p =>
        p.id === editingId ? { ...p, ...newProduct, price: Number(newProduct.price) } : p
      )
    );
    setEditingId(null);
    setNewProduct({ name: '', price: 0, image: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewProduct({ name: '', price: 0, image: '' });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Product' : 'Add New Product'}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input
            placeholder="Product Name"
            value={newProduct.name}
            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
          />
          <Input
            placeholder="Image URL"
            value={newProduct.image}
            onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
          />
          {editingId ? (
            <div className="flex gap-2">
              <Button onClick={saveEdit}>Save</Button>
              <Button variant="destructive" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={addProduct}>Add Product</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={p.image} className="w-12 h-12 object-cover rounded" />
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">₱{p.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => startEditing(p)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => removeProduct(p.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuManagement;
