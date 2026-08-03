'use client';

import axios, { AxiosInstance } from 'axios';

interface GetEntriesOptions {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

interface ApiResponse<T> {
  ok: boolean;
  msg?: string;
  [key: string]: any;
}

interface EntriesResponse extends ApiResponse<void> {
  total: number;
  page: number;
  pageSize: number;
  rows: any[];
}

interface StatsResponse extends ApiResponse<void> {
  total: number;
  success: number;
  pending: number;
  failed: number;
  retry: number;
}

interface ResendResponse extends ApiResponse<void> {
  messageId?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to headers if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getEntries(options: GetEntriesOptions = {}): Promise<EntriesResponse> {
    try {
      const { data } = await this.client.get<EntriesResponse>('/api/entries', {
        params: {
          page: options.page || 1,
          pageSize: options.pageSize || 20,
          ...(options.keyword && { keyword: options.keyword }),
          ...(options.status && { status: options.status }),
        },
      });
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch entries');
    }
  }

  async resendEmail(row: number): Promise<ResendResponse> {
    try {
      const { data } = await this.client.post<ResendResponse>('/api/resend', {
        row,
      });
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to resend email');
    }
  }

  async getStats(): Promise<StatsResponse> {
    try {
      const { data } = await this.client.get<StatsResponse>('/api/stats');
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch stats');
    }
  }

  async exportCsv(): Promise<void> {
    try {
      const response = await this.client.get('/api/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to export CSV');
    }
  }
}

export const apiClient = new ApiClient();
