import { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ProductListing } from '@/types';
import { 
  Star, 
  MapPin, 
  ShoppingCart, 
  TrendingUp,
  Package2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface ProductResultsProps {
  products: ProductListing[];
}

const conditionNames: Record<string, string> = {
  'nuevo': 'Nuevo',
  'usado-como-nuevo': 'Usado - Como Nuevo',
  'usado-bueno': 'Usado - Buen Estado',
  'usado-aceptable': 'Usado - Aceptable'
};

export function ProductResults({ products }: ProductResultsProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductListing | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  const handleBuyNow = (product: ProductListing) => {
    alert(`✅ Compra realizada!\n\nProducto: ${product.title}\nPrecio: $${product.price}\n\nEl vendedor ${product.providerName} se contactará contigo pronto.`);
    setSelectedProduct(null);
  };

  const handleNegotiate = (product: ProductListing) => {
    setIsNegotiating(true);
    setOfferAmount(product.minNegotiablePrice?.toString() || '');
  };

  const handleSendOffer = () => {
    if (!offerAmount || !selectedProduct) return;
    
    const offer = parseFloat(offerAmount);
    if (selectedProduct.minNegotiablePrice && offer < selectedProduct.minNegotiablePrice) {
      alert(`⚠️ Tu oferta debe ser al menos $${selectedProduct.minNegotiablePrice}`);
      return;
    }

    alert(`✅ Oferta enviada!\n\nProducto: ${selectedProduct.title}\nTu oferta: $${offer}\n\n${selectedProduct.providerName} revisará tu oferta y te responderá pronto.`);
    setSelectedProduct(null);
    setIsNegotiating(false);
    setOfferAmount('');
  };

  if (products.length === 0) {
    return (
      <div className="flex justify-start">
        <Card className="max-w-[80%] border-2 border-dashed">
          <CardContent className="py-8 text-center">
            <Package2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No se encontraron productos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex justify-start">
            <Card 
              className="max-w-[85%] hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
              onClick={() => setSelectedProduct(product)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Icon/Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center text-4xl">
                      🎮
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base line-clamp-1">{product.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {conditionNames[product.condition] || product.condition}
                          </Badge>
                          {product.allowNegotiation && (
                            <Badge className="bg-blue-500 text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Negociable
                            </Badge>
                          )}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <Badge className="bg-red-500 text-xs">
                              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {product.originalPrice && (
                          <p className="text-xs text-gray-400 line-through">
                            ${product.originalPrice}
                          </p>
                        )}
                        <p className="text-xl font-bold text-green-600">
                          ${product.price}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {product.description}
                    </p>

                    {/* Provider Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <span>{product.providerName}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{product.providerRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {product.location.district}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(product);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Comprar
                      </Button>
                      {product.allowNegotiation && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                            setIsNegotiating(true);
                          }}
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Negociar
                        </Button>
                      )}
                    </div>

                    {/* Stock */}
                    <p className="text-xs text-gray-500 mt-2">
                      📦 {product.stock} disponibles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={selectedProduct !== null && !isNegotiating} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">🎮</span>
                  {selectedProduct.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <div>
                    {selectedProduct.originalPrice && (
                      <p className="text-sm text-gray-400 line-through">
                        ${selectedProduct.originalPrice}
                      </p>
                    )}
                    <p className="text-3xl font-bold text-green-600">
                      ${selectedProduct.price}
                    </p>
                  </div>
                  {selectedProduct.allowNegotiation && (
                    <Badge className="bg-blue-500">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Negociable
                    </Badge>
                  )}
                </div>

                {/* Provider */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{selectedProduct.providerName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{selectedProduct.providerRating}</span>
                    <span className="text-sm text-gray-500">({selectedProduct.providerReviews} reseñas)</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>

                {/* Specs */}
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

                {/* Stock */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Stock:</strong> {selectedProduct.stock} unidades disponibles
                  </p>
                </div>
              </div>
              <DialogFooter>
                <div className="flex gap-2 w-full">
                  <Button className="flex-1" onClick={() => handleBuyNow(selectedProduct)}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Comprar Ahora
                  </Button>
                  {selectedProduct.allowNegotiation && (
                    <Button variant="outline" onClick={() => handleNegotiate(selectedProduct)}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Negociar
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Negotiation Dialog */}
      <Dialog open={isNegotiating} onOpenChange={() => {
        setIsNegotiating(false);
        setOfferAmount('');
      }}>
        <DialogContent>
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>Negociar Precio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold">{selectedProduct.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Precio actual: <strong>${selectedProduct.price}</strong>
                    {selectedProduct.minNegotiablePrice && (
                      <> | Precio mínimo: <strong>${selectedProduct.minNegotiablePrice}</strong></>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tu Oferta (USD)</Label>
                  <Input
                    type="number"
                    placeholder={selectedProduct.minNegotiablePrice?.toString() || ''}
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsNegotiating(false);
                  setOfferAmount('');
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSendOffer}>
                  Enviar Oferta
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}