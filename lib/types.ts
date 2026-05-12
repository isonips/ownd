export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  points: number;
};

export type TerritoryFeature = {
  type: "Feature";
  geometry: GeoJSON.LineString;
  properties: {
    segment_id: string;
    name: string | null;
    owner_id: string | null;
    owner_username: string | null;
    score: number;
  };
};

export type TerritoryFC = {
  type: "FeatureCollection";
  features: TerritoryFeature[];
};
