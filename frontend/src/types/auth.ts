export interface AuthConfig {
  admin: {
    enabled: boolean;
  };
  oidc: {
    enabled: boolean;
    provider?: string;
  };
  token: {
    enabled: boolean;
  };
  server: {
    host: string;
    port: number;
    protocol?: string;
    root_url?: string;
    allowed_ips?: string[];
    max_body_size?: number;
    max_header_size?: number;
    read_buffer_size?: number;
    write_buffer_size?: number;
  };
  logging: {
    level: string;
    format: string;
  };
}

export interface AuthUser {
  username: string;
  email?: string;
  name?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
