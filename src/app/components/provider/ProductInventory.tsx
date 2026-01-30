import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { productService } from '@/services';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { ProductListing, ProductCategory, ProductCondition } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';

const categoryNames: Record<ProductCategory, string> = {
  'electronica': 'Electrónica',
  'computadoras': 'Computadoras',
  'videojuegos': 'Videojuegos',
  'hogar': 'Hogar',
  'construccion': 'Construcción',
  'herramientas': 'Herramientas',
  'jardineria': 'Jardinería',
  'automotriz': 'Automotriz',
  'otros': 'Otros'
};

const conditionNames: Record<ProductCondition, string> = {
  'nuevo': 'Nuevo',
  'usado-como-nuevo': 'Usado - Como Nuevo',
  'usado-bueno': 'Usado - Buen Estado',
  'usado-aceptable': 'Usado - Aceptable'
};

const getCategoryIcon = (category: ProductCategory) => {
  const icons: Record<ProductCategory, string> = {
    'electronica': '📱',
    'computadoras': '💻',
    'videojuegos': '🎮',
    'hogar': '🏠',
    'construccion': '🏗️',
    'herramientas': '🔧',
    'jardineria': '🌱',
    'automotriz': '🚗',
    'otros': '📦'
  };
  return icons[category];
};

export function ProductInventory() {
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await productService.getAll();
      const mapped = data.map((p: any) => ({
        id: p.id,
        category: p.categoria,
        title: p.titulo,
        description: p.descripcion,
        price: p.precio,
        originalPrice: p.precioOriginal,
        condition: p.condicion,
        stock: p.stock,
        tags: p.etiquetas ? p.etiquetas.split(',') : [],
        allowNegotiation: p.permitirNegociacion,
        minNegotiablePrice: p.precioMinimoNegociable,
        isActive: p.activo,
        createdAt: p.fechaCreacion,
        providerId: p.proveedorId,
        location: { district: 'Panamá' },
        specifications: p.especificacionesJson ? JSON.parse(p.especificacionesJson) : undefined
      }));
      setProducts(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchProducts();
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductListing | null>(null);
  const [formData, setFormData] = useState({
    category: 'electronica' as ProductCategory,
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    condition: 'nuevo' as ProductCondition,
    stock: '',
    allowNegotiation: false,
    minNegotiablePrice: '',
    tags: '',
    specifications: ''
  });

  const activeProducts = products.filter(p => p.isActive);
  const inactiveProducts = products.filter(p => !p.isActive);
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.isActive);

  const handleToggleActive = async (productId: string) => {
    try {
      await productService.toggle(productId);
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productService.delete(productId);
        fetchProducts();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleEdit = (product: ProductListing) => {
    setEditingProduct(product);
    setFormData({
      category: product.category,
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      condition: product.condition,
      stock: product.stock.toString(),
      allowNegotiation: product.allowNegotiation,
      minNegotiablePrice: product.minNegotiablePrice?.toString() || '',
      tags: product.tags.join(', '),
      specifications: product.specifications
        ? Object.entries(product.specifications).map(([k, v]) => `${k}: ${v}`).join('\n')
        : ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.stock) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const specs: Record<string, string> = {};
    if (formData.specifications) {
      formData.specifications.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          specs[key.trim()] = valueParts.join(':').trim();
        }
      });
    }

    try {
      await productService.save({
        id: editingProduct?.id,
        categoria: formData.category,
        titulo: formData.title,
        descripcion: formData.description,
        precio: parseFloat(formData.price),
        condicion: formData.condition,
        stock: parseInt(formData.stock),
        precioOriginal: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        permitirNegociacion: formData.allowNegotiation,
        precioMinimoNegociable: formData.minNegotiablePrice ? parseFloat(formData.minNegotiablePrice) : null,
        etiquetas: formData.tags,
        especificacionesJson: Object.keys(specs).length > 0 ? JSON.stringify(specs) : null
      });

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        category: 'electronica',
        title: '',
        description: '',
        price: '',
        originalPrice: '',
        condition: 'nuevo',
        stock: '',
        allowNegotiation: false,
        minNegotiablePrice: '',
        tags: '',
        specifications: ''
      });
      fetchProducts();
      alert('Producto guardado exitosamente');

    } catch (error) {
      console.error(error);
      alert('Error al guardar el producto');
    }
  };

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="w-6 h-6" />
                Inventario de Productos
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona los productos que vendes en el marketplace
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      category: 'electronica',
                      title: '',
                      description: '',
                      price: '',
                      originalPrice: '',
                      condition: 'nuevo',
                      stock: '',
                      allowNegotiation: false,
                      minNegotiablePrice: '',
                      tags: '',
                      specifications: ''
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoría *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryNames).map(([key, name]) => (
                            <SelectItem key={key} value={key}>
                              {getCategoryIcon(key as ProductCategory)} {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Condición *</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData({ ...formData, condition: value as ProductCondition })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(conditionNames).map(([key, name]) => (
                            <SelectItem key={key} value={key}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Título del Producto *</Label>
                    <Input
                      placeholder="Ej: Control PS5 DualSense Blanco"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción *</Label>
                    <Textarea
                      placeholder="Describe tu producto en detalle..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Precio (USD) *</Label>
                      <Input
                        type="number"
                        placeholder="75"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio Original</Label>
                      <Input
                        type="number"
                        placeholder="85"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">Para mostrar descuento</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Stock *</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">¿Permitir Negociación?</Label>
                        <p className="text-xs text-gray-600">Los clientes podrán negociar el precio</p>
                      </div>
                      <Switch
                        checked={formData.allowNegotiation}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowNegotiation: checked })}
                      />
                    </div>

                    {formData.allowNegotiation && (
                      <div className="space-y-2">
                        <Label>Precio Mínimo Negociable (USD)</Label>
                        <Input
                          type="number"
                          placeholder="70"
                          value={formData.minNegotiablePrice}
                          onChange={(e) => setFormData({ ...formData, minNegotiablePrice: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">Precio más bajo que aceptarás</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Etiquetas (separadas por coma)</Label>
                    <Input
                      placeholder="PS5, DualSense, Sony, Nuevo"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Especificaciones (una por línea: Clave: Valor)</Label>
                    <Textarea
                      placeholder="Marca: Sony&#10;Modelo: DualSense&#10;Color: Blanco"
                      rows={4}
                      value={formData.specifications}
                      onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{products.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Productos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{activeProducts.length}</p>
              <p className="text-sm text-gray-600 mt-1">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{lowStockProducts.length}</p>
              <p className="text-sm text-gray-600 mt-1">Stock Bajo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">${totalValue.toFixed(0)}</p>
              <p className="text-sm text-gray-600 mt-1">Valor Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-800">
                {lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} con stock bajo (≤5 unidades)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Products */}
      {activeProducts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Productos Activos
          </h3>
          {activeProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl">{getCategoryIcon(product.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{product.title}</h4>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <Badge className="bg-red-500">
                              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{categoryNames[product.category]}</Badge>
                          <Badge variant="outline">{conditionNames[product.condition]}</Badge>
                          {product.allowNegotiation && (
                            <Badge className="bg-blue-500">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Negociable
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {product.tags.slice(0, 5).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={`font-medium ${product.stock <= 5 ? 'text-orange-600' : 'text-gray-600'}`}>
                            📦 Stock: {product.stock}
                          </span>
                          <span className="text-gray-500">📍 {product.location.district}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="mb-3">
                      {product.originalPrice && (
                        <p className="text-sm text-gray-400 line-through">
                          ${product.originalPrice}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-green-600">
                        ${product.price}
                      </p>
                      {product.allowNegotiation && product.minNegotiablePrice && (
                        <p className="text-xs text-gray-500">
                          Min: ${product.minNegotiablePrice}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(product.id)}
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Desactivar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inactive Products */}
      {inactiveProducts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-600">
            <XCircle className="w-5 h-5" />
            Productos Inactivos
          </h3>
          {inactiveProducts.map((product) => (
            <Card key={product.id} className="opacity-60 hover:shadow-md transition-shadow border-l-4 border-l-gray-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{getCategoryIcon(product.category)}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1 text-gray-700">{product.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{categoryNames[product.category]}</Badge>
                          <Badge variant="outline">{conditionNames[product.condition]}</Badge>
                        </div>
                        <p className="text-gray-500 text-sm">{product.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-gray-600 mb-3">
                      ${product.price}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(product.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Activar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Package2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No tienes productos en tu inventario</p>
            <p className="text-sm text-gray-400 mb-4">
              Crea tu primer producto para comenzar a vender
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Producto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
