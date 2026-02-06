import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { ProductListing, ProductCategory, ProductCondition } from '@/types';
import {
  Search,
  Star,
  MapPin,
  ShoppingCart,
  Filter,
  Package2,
  TrendingUp,
  MessageSquare,
  Plus,
  Minus
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { marketplaceService } from '@/services';
import { PaymentModal } from './PaymentModal';

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

export function ProductMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductListing | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{ product: ProductListing, quantity: number } | null>(null);

  // State for products
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("Fetching active products...");
        const response = await marketplaceService.getActiveProducts();
        console.log("Products API Response:", response);
        const data = response.data || [];

        const mappedProducts: ProductListing[] = data.map((p: any) => {
          // Robust parsing helpers
          const parseJsonSafe = (jsonStr: any, fallback: any = []) => {
            if (!jsonStr) return fallback;
            try {
              if (typeof jsonStr === 'string' && (jsonStr.trim().startsWith('[') || jsonStr.trim().startsWith('{'))) {
                const parsed = JSON.parse(jsonStr);
                // If expected array but got string/object, wrap it
                if (Array.isArray(fallback) && !Array.isArray(parsed)) return [jsonStr];
                return parsed;
              } else {
                // Comma separated string fallback for tags/images
                if (Array.isArray(fallback)) return jsonStr.split(',').map((s: string) => s.trim());
                return fallback;
              }
            } catch (e) {
              // Fallback for primitive values treated as complex
              if (Array.isArray(fallback)) return [String(jsonStr)];
              return fallback;
            }
          };

          return {
            id: p.id,
            providerId: p.proveedorId,
            providerName: p.proveedorNombre || 'Proveedor',
            providerRating: p.proveedorRating === null ? 5.0 : p.proveedorRating,
            providerReviews: 0,
            category: p.categoria,
            title: p.titulo || 'Sin título',
            description: p.descripcion || '',
            price: p.precio,
            originalPrice: p.precioOriginal,
            condition: p.condicion,
            images: parseJsonSafe(p.imagenesJson, []),
            tags: parseJsonSafe(p.etiquetas, []),
            stock: p.stock,
            isActive: p.activo,
            allowNegotiation: p.permitirNegociacion,
            minNegotiablePrice: p.precioMinimoNegociable,
            createdAt: p.fechaCreacion ? new Date(p.fechaCreacion) : new Date(),
            location: {
              district: 'Panamá' // TODO: Add location to SP/DTO
            },
            specifications: parseJsonSafe(p.especificacionesJson, {})
          };
        });
        setProducts(mappedProducts);

      } catch (error) {
        console.error("Failed to load marketplace products", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  const handleBuyNow = (product: ProductListing) => {
    if (!product) return;

    // Store pending purchase and open payment modal
    setPendingPurchase({ product, quantity: purchaseQuantity });
    setShowPaymentModal(true);
  };

  const executePurchase = async () => {
    if (!pendingPurchase) return;
    const { product, quantity } = pendingPurchase;
    if (!product) return;

    try {
      const response = await marketplaceService.purchaseProduct(
        product.id,
        purchaseQuantity,
        `Solicitud de compra de ${purchaseQuantity} unidad(es)`
      );

      const total = (product.price * purchaseQuantity).toFixed(2);

      alert(`✅ ¡Compra realizada exitosamente!\n\nProducto: ${product.title}\nCantidad: ${purchaseQuantity}\nTotal: $${total}\n\n📬 Se ha creado una conversación con ${product.providerName}.\nPuedes chatear con el vendedor en la sección "Mensajes".`);

      // Clean up
      setSelectedProduct(null);
      setPurchaseQuantity(1);

    } catch (error: any) {
      console.error('Purchase Error:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      let msg = 'Error al realizar la compra';

      const data = error.response?.data;
      if (data) {
        if (data.Error) msg = data.Error;
        else if (data.message) msg = data.message;
      }
      alert(`❌ ${msg}`);
    }
  };

  const handleNegotiate = (product: ProductListing) => {
    setIsNegotiating(true);
    setOfferAmount(product.minNegotiablePrice?.toString() || '');
  };

  const handleSendOffer = async () => {
    if (!offerAmount || !selectedProduct) return;

    const offer = parseFloat(offerAmount);
    if (selectedProduct.minNegotiablePrice && offer < selectedProduct.minNegotiablePrice) {
      alert(`⚠️ Tu oferta debe ser al menos $${selectedProduct.minNegotiablePrice}`);
      return;
    }

    try {
      await marketplaceService.negotiateProduct(
        selectedProduct.id,
        offer,
        'Oferta inicial' // You might want to add a message input field later
      );

      alert(`✅ Oferta enviada exitosamente!\n\nProducto: ${selectedProduct.title}\nTu oferta: $${offer}`);

      // Clean up
      setSelectedProduct(null);
      setIsNegotiating(false);
      setOfferAmount('');
      setPurchaseQuantity(1);

    } catch (error: any) {
      console.error('Negotiation Error:', error);
      let msg = 'Error al enviar oferta';

      const data = error.response?.data;
      if (data) {
        if (data.Error) msg = data.Error;
        else if (data.message) msg = data.message;
        else if (data.errors) {
          const vals = Object.values(data.errors);
          if (vals.length > 0) msg = String(vals[0]);
        }
      }
      alert(`Atención: ${msg}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Marketplace de Productos
          </CardTitle>
          <p className="text-sm text-gray-600">
            Compra productos, negocia precios y ahorra dinero
          </p>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar productos (ej: Control PS5, Mouse, Cable HDMI)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ProductCategory | 'all')}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(categoryNames).map(([key, name]) => (
              <SelectItem key={key} value={key}>
                {getCategoryIcon(key as ProductCategory)} {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProduct(product)}>
            <CardContent className="p-4">
              {/* Product Image */}
              <div className="mb-3">
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border mb-2">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {getCategoryIcon(product.category)}
                    </div>
                  )}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <Badge className="bg-red-500 mb-2">
                    AHORRA {Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Badge>
                )}
                <h4 className="font-semibold text-base mb-1 line-clamp-2">{product.title}</h4>
                <Badge variant="outline" className="text-xs mb-2">
                  {conditionNames[product.condition]}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-600">{product.providerName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.providerRating}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {product.location.district}
                </div>
                <span className="text-xs text-gray-500">
                  📦 Stock: {product.stock}
                </span>
              </div>

              <div className="border-t pt-3">
                {product.originalPrice && (
                  <p className="text-xs text-gray-400 line-through">
                    ${product.originalPrice}
                  </p>
                )}
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-green-600">
                    ${product.price}
                  </p>
                  {product.allowNegotiation && (
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Negociable
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Package2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No se encontraron productos</p>
            <p className="text-sm text-gray-400">
              Intenta con otros términos de búsqueda o cambia el filtro
            </p>
          </CardContent>
        </Card>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={selectedProduct !== null} onOpenChange={() => {
        setSelectedProduct(null);
        setIsNegotiating(false);
        setOfferAmount('');
        setPurchaseQuantity(1);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">{getCategoryIcon(selectedProduct.category)}</span>
                  {selectedProduct.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Product Images Gallery */}
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className="w-full">
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border">
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {selectedProduct.images.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {selectedProduct.images.slice(1, 5).map((img, idx) => (
                          <div key={idx} className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded border overflow-hidden">
                            <img
                              src={img}
                              alt={`${selectedProduct.title} ${idx + 2}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Price and Discount */}
                <div className="flex items-center gap-3">
                  {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                    <>
                      <p className="text-lg text-gray-400 line-through">
                        ${selectedProduct.originalPrice}
                      </p>
                      <Badge className="bg-red-500">
                        AHORRA {Math.round((1 - selectedProduct.price / selectedProduct.originalPrice) * 100)}%
                      </Badge>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-4xl font-bold text-green-600">
                    ${selectedProduct.price}
                  </p>
                  {selectedProduct.allowNegotiation && (
                    <Badge className="bg-blue-500 text-white">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Precio Negociable
                    </Badge>
                  )}
                </div>

                {/* Provider Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{selectedProduct.providerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{selectedProduct.providerRating}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({selectedProduct.providerReviews} reseñas)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{conditionNames[selectedProduct.condition]}</Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {selectedProduct.location.district}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>

                {/* Specifications */}
                {selectedProduct.specifications && (
                  <div>
                    <h4 className="font-semibold mb-2">Especificaciones</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{key}:</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h4 className="font-semibold mb-2">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stock */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Disponibilidad:</strong> {selectedProduct.stock} unidades en stock
                  </p>
                </div>

                {/* Negotiation Section */}
                {!isNegotiating ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label>Cantidad:</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                          disabled={purchaseQuantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{purchaseQuantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPurchaseQuantity(Math.min(selectedProduct.stock, purchaseQuantity + 1))}
                          disabled={purchaseQuantity >= selectedProduct.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 ml-auto">
                        Total: <span className="text-xl font-bold text-green-600">${(selectedProduct.price * purchaseQuantity).toFixed(2)}</span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" size="lg" onClick={() => handleBuyNow(selectedProduct)}>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Comprar Ahora
                      </Button>
                      {selectedProduct.allowNegotiation && (
                        <Button variant="outline" size="lg" onClick={() => handleNegotiate(selectedProduct)}>
                          <TrendingUp className="w-5 h-5 mr-2" />
                          Negociar Precio
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold">Hacer una Oferta</h4>
                    <p className="text-sm text-gray-600">
                      Precio actual: <strong>${selectedProduct.price}</strong>
                      {selectedProduct.minNegotiablePrice && (
                        <> | Precio mínimo aceptado: <strong>${selectedProduct.minNegotiablePrice}</strong></>
                      )}
                    </p>
                    <div className="space-y-2">
                      <Label>Tu Oferta (USD)</Label>
                      <Input
                        type="number"
                        placeholder={selectedProduct.minNegotiablePrice?.toString() || ''}
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleSendOffer}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Enviar Oferta
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsNegotiating(false);
                        setOfferAmount('');
                      }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        amount={pendingPurchase ? Number((pendingPurchase.product.price * pendingPurchase.quantity).toFixed(2)) : 0}
        onSuccess={executePurchase}
      />
    </div>
  );
}
