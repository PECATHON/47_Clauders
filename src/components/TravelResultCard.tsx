import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, Clock, MapPin, DollarSign, Star, Calendar, ExternalLink } from "lucide-react";

interface TravelResultCardProps {
  type: "flight" | "hotel";
  data: any;
}

export const TravelResultCard = ({ type, data }: TravelResultCardProps) => {
  if (type === "flight") {
    return (
      <Card className="border-l-4 border-l-blue-500 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 font-display">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              {data.airline || "Flight Option"}
            </CardTitle>
            {data.price && (
              <Badge variant="secondary" className="text-base font-bold gradient-primary text-white">
                {data.price}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                From
              </div>
              <div className="font-medium">{data.from || "Departure"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                To
              </div>
              <div className="font-medium">{data.to || "Destination"}</div>
            </div>
          </div>
          
          {data.duration && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{data.duration}</span>
            </div>
          )}
          
          {data.departure && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{data.departure}</span>
            </div>
          )}
          
          {data.stops !== undefined && (
            <Badge variant="outline">
              {data.stops === 0 ? "Direct" : `${data.stops} stop${data.stops > 1 ? 's' : ''}`}
            </Badge>
          )}
          
          <div className="pt-3 border-t mt-3">
            <Button asChild className="w-full gradient-primary hover:shadow-glow transition-all" size="sm">
              <a 
                href={data.bookingLink || `https://www.google.com/flights?q=${data.from}+to+${data.to}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <span>View Flights</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "hotel") {
    return (
      <Card className="border-l-4 border-l-orange-500 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 font-display">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Hotel className="w-4 h-4 text-white" />
              </div>
              {data.name || "Hotel Option"}
            </CardTitle>
            {data.price && (
              <Badge variant="secondary" className="text-base font-bold gradient-secondary text-white">
                {data.price}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.rating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < data.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                ({data.rating}/5)
              </span>
            </div>
          )}
          
          {data.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{data.location}</span>
            </div>
          )}
          
          {data.pricePerNight && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>{data.pricePerNight} per night</span>
            </div>
          )}
          
          {data.amenities && data.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {data.amenities.slice(0, 4).map((amenity: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="pt-3 border-t mt-3">
            <Button asChild className="w-full gradient-secondary hover:shadow-glow transition-all" size="sm">
              <a 
                href={data.bookingLink || `https://www.google.com/travel/hotels?q=${data.name}+${data.location}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <span>View Hotel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};