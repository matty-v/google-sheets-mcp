import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SheetsApiClient, RowData } from './sheets-client.js';

const SHEETS_API_URL = process.env.SHEETS_API_URL || 'https://sheetsapi-g56q77hy2a-uc.a.run.app';

export function createMcpServer(): McpServer {
  const client = new SheetsApiClient(SHEETS_API_URL);

  const server = new McpServer({
    name: 'google-sheets-mcp',
    version: '1.0.0',
  });

  // List all sheets in the spreadsheet
  server.tool(
    'list_sheets',
    'List all sheets in the Google Spreadsheet',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
    },
    async ({ spreadsheet_id }) => {
      const sheets = await client.listSheets(spreadsheet_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(sheets, null, 2),
          },
        ],
      };
    }
  );

  // Create a new sheet
  server.tool(
    'create_sheet',
    'Create a new sheet in the Google Spreadsheet',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
      sheet_name: z.string().describe('Name for the new sheet'),
    },
    async ({ spreadsheet_id, sheet_name }) => {
      const sheet = await client.createSheet(spreadsheet_id, sheet_name);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(sheet, null, 2),
          },
        ],
      };
    }
  );

  // Delete a sheet
  server.tool(
    'delete_sheet',
    'Delete a sheet from the Google Spreadsheet',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
      sheet_name: z.string().describe('Name of the sheet to delete'),
    },
    async ({ spreadsheet_id, sheet_name }) => {
      await client.deleteSheet(spreadsheet_id, sheet_name);
      return {
        content: [
          {
            type: 'text',
            text: `Sheet "${sheet_name}" deleted successfully`,
          },
        ],
      };
    }
  );

  // Get sheet schema (column headers)
  server.tool(
    'get_schema',
    'Get the column headers (schema) of a sheet',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
      sheet_name: z.string().describe('Name of the sheet'),
    },
    async ({ spreadsheet_id, sheet_name }) => {
      const columns = await client.getSchema(spreadsheet_id, sheet_name);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ columns }, null, 2),
          },
        ],
      };
    }
  );

  // Get all rows from a sheet
  server.tool(
    'get_rows',
    'Get all rows from a sheet',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
      sheet_name: z.string().describe('Name of the sheet'),
    },
    async ({ spreadsheet_id, sheet_name }) => {
      const rows = await client.getRows(spreadsheet_id, sheet_name);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    }
  );

  // Get a specific row
  server.tool(
    'get_row',
    'Get a specific row from a sheet by row index (1-based, row 1 is headers, data starts at row 2)',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
      sheet_name: z.string().describe('Name of the sheet'),
      row_index: z.number().min(2).describe('Row index (2 or higher, as row 1 contains headers)'),
    },
    async ({ spreadsheet_id, sheet_name, row_index }) => {
      const row = await client.getRow(spreadsheet_id, sheet_name, row_index);
      if (row === null) {
        return {
          content: [
            {
              type: 'text',
              text: `Row ${row_index} not found`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(row, null, 2),
          },
        ],
      };
    }
  );

  // Create a new row
  server.tool(
    'create_row',
    'Create a new row in a sheet. Pass data as a JSON object with column names as keys.',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
      sheet_name: z.string().describe('Name of the sheet'),
      data: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).describe('Row data as a JSON object with column names as keys'),
    },
    async ({ spreadsheet_id, sheet_name, data }) => {
      const rowIndex = await client.createRow(spreadsheet_id, sheet_name, data as RowData);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ rowIndex, message: `Row created at index ${rowIndex}` }, null, 2),
          },
        ],
      };
    }
  );

  // Update a row
  server.tool(
    'update_row',
    'Update an existing row in a sheet',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
      sheet_name: z.string().describe('Name of the sheet'),
      row_index: z.number().min(2).describe('Row index to update (2 or higher)'),
      data: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).describe('Updated row data as a JSON object'),
    },
    async ({ spreadsheet_id, sheet_name, row_index, data }) => {
      await client.updateRow(spreadsheet_id, sheet_name, row_index, data as RowData);
      return {
        content: [
          {
            type: 'text',
            text: `Row ${row_index} updated successfully`,
          },
        ],
      };
    }
  );

  // Delete a row
  server.tool(
    'delete_row',
    'Delete a row from a sheet',
    {
      spreadsheet_id: z.string().describe('The Google Spreadsheet ID'),
      sheet_name: z.string().describe('Name of the sheet'),
      row_index: z.number().min(2).describe('Row index to delete (2 or higher)'),
    },
    async ({ spreadsheet_id, sheet_name, row_index }) => {
      await client.deleteRow(spreadsheet_id, sheet_name, row_index);
      return {
        content: [
          {
            type: 'text',
            text: `Row ${row_index} deleted successfully`,
          },
        ],
      };
    }
  );

  return server;
}
