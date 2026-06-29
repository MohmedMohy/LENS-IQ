export interface WithTenant {
  tenantId: number;
}

export interface WithTimestamps {
  createdAt: string;
  updatedAt: string;
}

export type SortDirection = "ASC" | "DESC";

export interface PaginationRequest {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
