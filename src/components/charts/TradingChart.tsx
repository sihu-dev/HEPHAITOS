'use client'

// ============================================
// TradingView 스타일 트레이딩 차트
// lightweight-charts 기반 고성능 캔들스틱 차트
// ============================================

import { memo, useRef, useEffect, useState, useCallback } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
} from 'lightweight-charts'
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands } from '@/lib/indicators'

// ============================================
// Types
// ============================================

export interface OHLCVData {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface IndicatorOverlay {
  type: 'sma' | 'ema' | 'bollinger'
  period: number
  color?: string
}

export interface IndicatorPane {
  type: 'rsi' | 'macd' | 'volume'
  period?: number
}

export interface TradingChartProps {
  data: OHLCVData[]
  height?: number
  overlays?: IndicatorOverlay[]
  panes?: IndicatorPane[]
  showVolume?: boolean
  showToolbar?: boolean
  onCrosshairMove?: (data: { time: Time; price: number } | null) => void
  className?: string
}

// ============================================
// Theme Configuration (HEPHAITOS 디자인 시스템)
// ============================================

const chartTheme = {
  background: '#0A0A0C',
  textColor: '#71717a',
  gridColor: 'rgba(255, 255, 255, 0.04)',
  borderColor: 'rgba(255, 255, 255, 0.06)',
  upColor: '#10b981',
  downColor: '#ef4444',
  volumeUpColor: 'rgba(16, 185, 129, 0.3)',
  volumeDownColor: 'rgba(239, 68, 68, 0.3)',
  crosshairColor: '#71717a',
  indicatorColors: {
    sma: '#f59e0b',
    ema: '#8b5cf6',
    rsi: '#06b6d4',
    macdLine: '#3b82f6',
    macdSignal: '#f97316',
    macdHistogramUp: 'rgba(16, 185, 129, 0.5)',
    macdHistogramDown: 'rgba(239, 68, 68, 0.5)',
    bollingerUpper: 'rgba(139, 92, 246, 0.5)',
    bollingerMiddle: '#8b5cf6',
    bollingerLower: 'rgba(139, 92, 246, 0.5)',
  },
}

// ============================================
// Helper: Data Conversion
// ============================================

function convertToLightweightData(data: OHLCVData[]): CandlestickData<Time>[] {
  return data.map((d) => ({
    time: d.time,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }))
}

function convertToLineData(times: Time[], values: number[]): LineData<Time>[] {
  return times
    .map((time, i) => ({
      time,
      value: values[i],
    }))
    .filter((d) => !isNaN(d.value))
}

function convertToHistogramData(
  times: Time[],
  values: number[],
  positiveColor: string,
  negativeColor: string
): HistogramData<Time>[] {
  return times
    .map((time, i) => ({
      time,
      value: values[i],
      color: values[i] >= 0 ? positiveColor : negativeColor,
    }))
    .filter((d) => !isNaN(d.value))
}

// ============================================
// Main Component
// ============================================

export const TradingChart = memo(function TradingChart({
  data,
  height = 500,
  overlays = [],
  panes = [],
  showVolume = true,
  showToolbar = true,
  onCrosshairMove,
  className = '',
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const overlaySeriesRef = useRef<ISeriesApi<'Line'>[]>([])

  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0)

  // Calculate price statistics
  useEffect(() => {
    if (data.length > 0) {
      const latest = data[data.length - 1]
      const previous = data.length > 1 ? data[data.length - 2] : latest
      const change = latest.close - previous.close
      const changePercent = (change / previous.close) * 100

      setCurrentPrice(latest.close)
      setPriceChange(change)
      setPriceChangePercent(changePercent)
    }
  }, [data])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.background },
        textColor: chartTheme.textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: chartTheme.gridColor, style: LineStyle.Dotted },
        horzLines: { color: chartTheme.gridColor, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: chartTheme.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#27272a',
        },
        horzLine: {
          color: chartTheme.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#27272a',
        },
      },
      rightPriceScale: {
        borderColor: chartTheme.borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.25 : 0.1,
        },
      },
      timeScale: {
        borderColor: chartTheme.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: chartTheme.upColor,
      downColor: chartTheme.downColor,
      borderUpColor: chartTheme.upColor,
      borderDownColor: chartTheme.downColor,
      wickUpColor: chartTheme.upColor,
      wickDownColor: chartTheme.downColor,
    })
    candleSeriesRef.current = candleSeries

    // Add volume series
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      })
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      })
      volumeSeriesRef.current = volumeSeries
    }

    // Subscribe to crosshair move
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.time && param.point) {
          const price = candleSeries.coordinateToPrice(param.point.y)
          if (price !== null) {
            onCrosshairMove({ time: param.time, price })
          }
        } else {
          onCrosshairMove(null)
        }
      })
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      overlaySeriesRef.current = []
    }
  }, [height, showVolume, onCrosshairMove])

  // Update data
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || data.length === 0) return

    const candleData = convertToLightweightData(data)
    candleSeriesRef.current.setData(candleData)

    // Volume data
    if (volumeSeriesRef.current && showVolume) {
      const volumeData = data.map((d, i) => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? chartTheme.volumeUpColor : chartTheme.volumeDownColor,
      }))
      volumeSeriesRef.current.setData(volumeData as HistogramData<Time>[])
    }

    // Fit content
    chartRef.current.timeScale().fitContent()
  }, [data, showVolume])

  // Update overlays
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return

    // Remove existing overlay series
    overlaySeriesRef.current.forEach((series) => {
      chartRef.current?.removeSeries(series)
    })
    overlaySeriesRef.current = []

    const closes = data.map((d) => d.close)
    const times = data.map((d) => d.time)

    // Add new overlay series
    overlays.forEach((overlay) => {
      let values: number[] = []
      let color = overlay.color

      switch (overlay.type) {
        case 'sma':
          values = calculateSMA(closes, overlay.period)
          color = color || chartTheme.indicatorColors.sma
          break
        case 'ema':
          values = calculateEMA(closes, overlay.period)
          color = color || chartTheme.indicatorColors.ema
          break
        case 'bollinger':
          const bb = calculateBollingerBands(closes, overlay.period)
          // Add three lines for Bollinger Bands
          const upperSeries = chartRef.current!.addLineSeries({
            color: chartTheme.indicatorColors.bollingerUpper,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
          })
          upperSeries.setData(convertToLineData(times, bb.upper))
          overlaySeriesRef.current.push(upperSeries)

          const middleSeries = chartRef.current!.addLineSeries({
            color: chartTheme.indicatorColors.bollingerMiddle,
            lineWidth: 1,
          })
          middleSeries.setData(convertToLineData(times, bb.middle))
          overlaySeriesRef.current.push(middleSeries)

          const lowerSeries = chartRef.current!.addLineSeries({
            color: chartTheme.indicatorColors.bollingerLower,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
          })
          lowerSeries.setData(convertToLineData(times, bb.lower))
          overlaySeriesRef.current.push(lowerSeries)
          return
      }

      if (values.length > 0) {
        const lineSeries = chartRef.current!.addLineSeries({
          color,
          lineWidth: 2,
          crosshairMarkerVisible: false,
        })
        lineSeries.setData(convertToLineData(times, values))
        overlaySeriesRef.current.push(lineSeries)
      }
    })
  }, [data, overlays])

  // Fit to screen
  const handleFitContent = useCallback(() => {
    chartRef.current?.timeScale().fitContent()
  }, [])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (chartRef.current) {
      const visibleRange = chartRef.current.timeScale().getVisibleRange()
      if (visibleRange) {
        const midPoint = ((visibleRange.from as number) + (visibleRange.to as number)) / 2
        const newRange = ((visibleRange.to as number) - (visibleRange.from as number)) / 2 * 0.8
        chartRef.current.timeScale().setVisibleRange({
          from: (midPoint - newRange) as Time,
          to: (midPoint + newRange) as Time,
        })
      }
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (chartRef.current) {
      const visibleRange = chartRef.current.timeScale().getVisibleRange()
      if (visibleRange) {
        const midPoint = ((visibleRange.from as number) + (visibleRange.to as number)) / 2
        const newRange = ((visibleRange.to as number) - (visibleRange.from as number)) / 2 * 1.25
        chartRef.current.timeScale().setVisibleRange({
          from: (midPoint - newRange) as Time,
          to: (midPoint + newRange) as Time,
        })
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Header with price info */}
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            {/* Current Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-medium text-white">
                {currentPrice?.toLocaleString('ko-KR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`text-sm font-medium ${
                  priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}
                {priceChangePercent.toFixed(2)}%)
              </span>
            </div>

            {/* Active Indicators */}
            {overlays.length > 0 && (
              <div className="flex items-center gap-2">
                {overlays.map((overlay, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] font-medium rounded"
                    style={{
                      backgroundColor: `${overlay.color || chartTheme.indicatorColors[overlay.type]}20`,
                      color: overlay.color || chartTheme.indicatorColors[overlay.type],
                    }}
                  >
                    {overlay.type.toUpperCase()}({overlay.period})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
              title="확대"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
              title="축소"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <button
              onClick={handleFitContent}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
              title="전체 보기"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ height: showToolbar ? height - 52 : height }}
      />

      {/* Data Attribution */}
      <div className="absolute bottom-4 right-4 text-[10px] text-zinc-500 pointer-events-none">
        Data: Polygon.io
      </div>
    </div>
  )
})

TradingChart.displayName = 'TradingChart'

export { TradingChart as default }
