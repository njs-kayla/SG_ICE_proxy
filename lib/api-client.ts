'use client';

import axios, { AxiosInstance } from 'axios';
import {
  exportMockCsv,
  getAllMockEntries,
  getMockEntries,
  getMockStats,
  isMockMode,
  resendMockEmail,
} from '@/lib/mock-data';

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

type EntryRecord = EntriesResponse['rows'][number];

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
    if (isMockMode()) {
      return getMockEntries(options);
    }

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

  async getAllEntries(options: Omit<GetEntriesOptions, 'page' | 'pageSize'> = {}): Promise<EntryRecord[]> {
    if (isMockMode()) {
      return getAllMockEntries(options);
    }

    const pageSize = 1000;
    const firstPage = await this.getEntries({
      ...options,
      page: 1,
      pageSize,
    });

    const allRows = [...firstPage.rows];
    const totalPages = Math.ceil(firstPage.total / pageSize);

    for (let page = 2; page <= totalPages; page += 1) {
      const nextPage = await this.getEntries({
        ...options,
        page,
        pageSize,
      });
      allRows.push(...nextPage.rows);
    }

    return allRows;
  }

  async resendEmail(row: number): Promise<ResendResponse> {
    if (isMockMode()) {
      return resendMockEmail(row);
    }

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
    if (isMockMode()) {
      return {
        ok: true,
        ...getMockStats(),
      };
    }

    try {
      const { data } = await this.client.get<StatsResponse>('/api/stats');
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch stats');
    }
  }

  async exportCsv(): Promise<void> {
    if (isMockMode()) {
      const csv = exportMockCsv();
      const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mock-export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

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
