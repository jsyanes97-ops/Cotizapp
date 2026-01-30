import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Star } from 'lucide-react';

interface RatingSystemProps {
  providerName: string;
  onSubmit: (rating: number, comment: string) => void;
}

export function RatingSystem({ providerName, onSubmit }: RatingSystemProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    onSubmit(rating, comment);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="font-semibold text-lg mb-2">¡Gracias por tu calificación!</h3>
          <p className="text-gray-600 text-sm">
            Tu opinión ayuda a otros usuarios a tomar mejores decisiones
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Califica el Servicio</CardTitle>
        <CardDescription>
          ¿Cómo fue tu experiencia con {providerName}?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Stars */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-12 h-12 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {rating > 0 && (
            <p className="text-sm font-medium">
              {rating === 5 ? '¡Excelente!' : 
               rating === 4 ? 'Muy bueno' :
               rating === 3 ? 'Bueno' :
               rating === 2 ? 'Regular' : 'Necesita mejorar'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Cuéntanos más (opcional)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué destacarías del servicio? ¿Algo que podría mejorar?"
            rows={4}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="w-full"
          size="lg"
        >
          Enviar Calificación
        </Button>

        <p className="text-xs text-center text-gray-500">
          Tu calificación será visible públicamente y ayudará a mejorar el servicio
        </p>
      </CardContent>
    </Card>
  );
}
