/**
 * HTTP client for sheets-db-api
 */

export interface SheetInfo {
  sheetId: number;
  title: string;
  index: number;
}

export interface RowData {
  [key: string]: string | number | boolean | null;
}

export class SheetsApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(
    method: string,
    path: string,
    spreadsheetId: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'X-Spreadsheet-Id': spreadsheetId,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
      throw new Error(errorBody.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  async listSheets(spreadsheetId: string): Promise<SheetInfo[]> {
    const result = await this.request<{ sheets: SheetInfo[] }>('GET', '/sheets', spreadsheetId);
    return result.sheets;
  }

  async createSheet(spreadsheetId: string, name: string): Promise<SheetInfo> {
    const result = await this.request<{ sheet: SheetInfo }>('POST', '/sheets', spreadsheetId, { name });
    return result.sheet;
  }

  async deleteSheet(spreadsheetId: string, sheetName: string): Promise<void> {
    await this.request<void>('DELETE', `/sheets/${encodeURIComponent(sheetName)}`, spreadsheetId);
  }

  async getSchema(spreadsheetId: string, sheetName: string): Promise<string[]> {
    const result = await this.request<{ columns: string[] }>(
      'GET',
      `/sheets/${encodeURIComponent(sheetName)}/schema`,
      spreadsheetId
    );
    return result.columns;
  }

  async getRows(spreadsheetId: string, sheetName: string): Promise<RowData[]> {
    const result = await this.request<{ rows: RowData[] }>(
      'GET',
      `/sheets/${encodeURIComponent(sheetName)}/rows`,
      spreadsheetId
    );
    return result.rows;
  }

  async getRow(spreadsheetId: string, sheetName: string, rowIndex: number): Promise<RowData | null> {
    try {
      const result = await this.request<{ row: RowData }>(
        'GET',
        `/sheets/${encodeURIComponent(sheetName)}/rows/${rowIndex}`,
        spreadsheetId
      );
      return result.row;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createRow(spreadsheetId: string, sheetName: string, data: RowData): Promise<number> {
    const result = await this.request<{ rowIndex: number }>(
      'POST',
      `/sheets/${encodeURIComponent(sheetName)}/rows`,
      spreadsheetId,
      data
    );
    return result.rowIndex;
  }

  async updateRow(
    spreadsheetId: string,
    sheetName: string,
    rowIndex: number,
    data: RowData
  ): Promise<void> {
    await this.request<void>(
      'PUT',
      `/sheets/${encodeURIComponent(sheetName)}/rows/${rowIndex}`,
      spreadsheetId,
      data
    );
  }

  async deleteRow(spreadsheetId: string, sheetName: string, rowIndex: number): Promise<void> {
    await this.request<void>(
      'DELETE',
      `/sheets/${encodeURIComponent(sheetName)}/rows/${rowIndex}`,
      spreadsheetId
    );
  }
}
