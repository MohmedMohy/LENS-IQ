export interface Tenant {
  id: number;
  name: string;
  email: string;
  api_key: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tenant: Tenant;
}
