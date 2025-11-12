export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type JwtPayload = {
  sub: string;
  uid: string;
  name: string;
  tgId?: string;
  iat?: number;
  exp?: number;
};
