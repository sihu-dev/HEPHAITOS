'use client'

// ============================================
// TanStack Table-based Data Table
// Supports sorting, filtering, pagination
// ============================================

import { useState, useMemo, memo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table'
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// ============================================
// Types
// ============================================

export interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchColumn?: string
  pagination?: boolean
  pageSize?: number
  className?: string
  emptyMessage?: string
  onRowClick?: (row: TData) => void
}

// ============================================
// Main Component
// ============================================

function DataTableInner<TData>({
  data,
  columns,
  searchable = false,
  searchPlaceholder,
  searchColumn,
  pagination = true,
  pageSize = 10,
  className = '',
  emptyMessage,
  onRowClick,
}: DataTableProps<TData>) {
  // Default values are set via i18n in the component body
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  // Use English defaults - actual locale-aware text should be passed via props
  const effectiveSearchPlaceholder = searchPlaceholder || 'Search...'
  const effectiveEmptyMessage = emptyMessage || 'No data available'

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: paginationState,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
  })

  const totalRows = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  const currentPage = paginationState.pageIndex + 1

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder={effectiveSearchPlaceholder}
            value={searchColumn ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? '' : globalFilter}
            onChange={(e) => {
              if (searchColumn) {
                table.getColumn(searchColumn)?.setFilterValue(e.target.value)
              } else {
                setGlobalFilter(e.target.value)
              }
            }}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-white/[0.06] rounded-lg">
        <table className="w-full">
          {/* Header */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-white/[0.06]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider bg-white/[0.02]"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none hover:text-white' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="flex flex-col">
                            <ChevronUpIcon
                              className={`w-3 h-3 -mb-1 ${
                                header.column.getIsSorted() === 'asc' ? 'text-amber-400' : 'text-zinc-400'
                              }`}
                            />
                            <ChevronDownIcon
                              className={`w-3 h-3 ${
                                header.column.getIsSorted() === 'desc' ? 'text-amber-400' : 'text-zinc-400'
                              }`}
                            />
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-white/[0.04]">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-white/[0.02]' : ''
                  } transition-colors`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-zinc-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-zinc-400"
                >
                  {effectiveEmptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Showing {paginationState.pageIndex * paginationState.pageSize + 1}-
            {Math.min((paginationState.pageIndex + 1) * paginationState.pageSize, totalRows)} of {totalRows}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                let pageNum: number
                if (pageCount <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= pageCount - 2) {
                  pageNum = pageCount - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => table.setPageIndex(pageNum - 1)}
                    className={`w-8 h-8 text-xs rounded transition-colors ${
                      currentPage === pageNum
                        ? 'bg-amber-500/20 text-amber-400 font-medium'
                        : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Export with memo
// ============================================

export const DataTable = memo(DataTableInner) as typeof DataTableInner & {
  displayName: string
}

DataTable.displayName = 'DataTable'

export { DataTable as default }

// ============================================
// Helper: Column Definition Utilities
// ============================================

export function createColumn<TData, TValue = unknown>(
  accessorKey: keyof TData & string,
  header: string,
  options?: Partial<ColumnDef<TData, TValue>>
): ColumnDef<TData, TValue> {
  return {
    accessorKey,
    header,
    ...options,
  } as ColumnDef<TData, TValue>
}

export function createPriceColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: { currency?: string; colorize?: boolean }
): ColumnDef<TData, number> {
  const { currency = 'KRW', colorize = false } = options || {}

  return {
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as number
      const formatted = new Intl.NumberFormat('ko-KR', {
        style: currency === 'USD' ? 'currency' : 'decimal',
        currency: currency === 'USD' ? 'USD' : undefined,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value)

      if (colorize) {
        const color = value >= 0 ? 'text-emerald-400' : 'text-red-400'
        const prefix = value >= 0 ? '+' : ''
        return <span className={color}>{prefix}{formatted}</span>
      }

      return formatted
    },
  } as ColumnDef<TData, number>
}

export function createPercentColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: { colorize?: boolean }
): ColumnDef<TData, number> {
  const { colorize = true } = options || {}

  return {
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as number
      const formatted = `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

      if (colorize) {
        const color = value >= 0 ? 'text-emerald-400' : 'text-red-400'
        return <span className={color}>{formatted}</span>
      }

      return formatted
    },
  } as ColumnDef<TData, number>
}

export function createDateColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: { format?: 'date' | 'datetime' | 'relative' }
): ColumnDef<TData, number | string | Date> {
  const { format = 'datetime' } = options || {}

  return {
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue()
      const date = value instanceof Date ? value : new Date(value as number | string)

      if (format === 'date') {
        return date.toLocaleDateString('en-US')
      }

      if (format === 'relative') {
        const now = Date.now()
        const diff = now - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes} min ago`
        if (hours < 24) return `${hours} hours ago`
        if (days < 7) return `${days} days ago`
        return date.toLocaleDateString('en-US')
      }

      return date.toLocaleString('en-US')
    },
  } as ColumnDef<TData, number | string | Date>
}

export function createBadgeColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  colorMap: Record<string, string>
): ColumnDef<TData, string> {
  return {
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as string
      const color = colorMap[value] || 'bg-zinc-500/20 text-zinc-400'

      return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
          {value}
        </span>
      )
    },
  } as ColumnDef<TData, string>
}
