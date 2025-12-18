'use client'

// ============================================
// 기술적 지표 서브 차트
// RSI, MACD 등 별도 패널 차트
// ============================================

import { memo, useRef, useEffect } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type Time,
} from 'lightweight-charts'
import { calculateRSI, calculateMACD, type MACDOutput } from '@/lib/indicators'

// ============================================
// Types
// ============================================

export interface IndicatorChartProps {
  type: 'rsi' | 'macd'
  data: { time: Time; close: number }[]
  period?: number
  height?: number
  className?: string
}

// ============================================
// Theme
// ============================================

const chartTheme = {
  background: '#0A0A0C',
  textColor: '#71717a',
  gridColor: 'rgba(255, 255, 255, 0.04)',
  borderColor: 'rgba(255, 255, 255, 0.06)',
  rsi: {
    line: '#06b6d4',
    overbought: 'rgba(239, 68, 68, 0.3)',
    oversold: 'rgba(16, 185, 129, 0.3)',
  },
  macd: {
    line: '#3b82f6',
    signal: '#f97316',
    histogramUp: 'rgba(16, 185, 129, 0.6)',
    histogramDown: 'rgba(239, 68, 68, 0.6)',
  },
}

// ============================================
// RSI Chart Component
// ============================================

const RSIChart = memo(function RSIChart({
  data,
  period = 14,
  height = 150,
  className = '',
}: Omit<IndicatorChartProps, 'type'>) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
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
        vertLine: { color: '#71717a', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#71717a', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: chartTheme.borderColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        visible: false,
        borderColor: chartTheme.borderColor,
      },
    })

    chartRef.current = chart

    // Calculate RSI
    const closes = data.map((d) => d.close)
    const times = data.map((d) => d.time)
    const rsiValues = calculateRSI(closes, period)

    // Add RSI line (v5 API)
    const rsiSeries = chart.addSeries(LineSeries, {
      color: chartTheme.rsi.line,
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    })

    const rsiData = times
      .map((time, i) => ({ time, value: rsiValues[i] }))
      .filter((d) => !isNaN(d.value))

    rsiSeries.setData(rsiData)

    // Add overbought/oversold lines
    rsiSeries.createPriceLine({
      price: 70,
      color: chartTheme.rsi.overbought,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '과매수',
    })

    rsiSeries.createPriceLine({
      price: 30,
      color: chartTheme.rsi.oversold,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '과매도',
    })

    rsiSeries.createPriceLine({
      price: 50,
      color: 'rgba(113, 113, 122, 0.3)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, period, height])

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-2 left-3 z-10">
        <span className="text-xs font-medium text-cyan-400">
          RSI({period})
        </span>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
})

// ============================================
// MACD Chart Component
// ============================================

const MACDChart = memo(function MACDChart({
  data,
  height = 150,
  className = '',
}: Omit<IndicatorChartProps, 'type' | 'period'>) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
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
        vertLine: { color: '#71717a', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#71717a', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: chartTheme.borderColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        visible: false,
        borderColor: chartTheme.borderColor,
      },
    })

    chartRef.current = chart

    // Calculate MACD
    const closes = data.map((d) => d.close)
    const times = data.map((d) => d.time)
    const macdResult = calculateMACD(closes, 12, 26, 9)

    // Add histogram (v5 API)
    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
    })

    const histogramData = times
      .map((time, i) => ({
        time,
        value: macdResult.histogram[i],
        color: macdResult.histogram[i] >= 0
          ? chartTheme.macd.histogramUp
          : chartTheme.macd.histogramDown,
      }))
      .filter((d) => !isNaN(d.value))

    histogramSeries.setData(histogramData)

    // Add MACD line (v5 API)
    const macdSeries = chart.addSeries(LineSeries, {
      color: chartTheme.macd.line,
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
    })

    const macdData = times
      .map((time, i) => ({ time, value: macdResult.macd[i] }))
      .filter((d) => !isNaN(d.value))

    macdSeries.setData(macdData)

    // Add signal line (v5 API)
    const signalSeries = chart.addSeries(LineSeries, {
      color: chartTheme.macd.signal,
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
    })

    const signalData = times
      .map((time, i) => ({ time, value: macdResult.signal[i] }))
      .filter((d) => !isNaN(d.value))

    signalSeries.setData(signalData)

    // Zero line
    macdSeries.createPriceLine({
      price: 0,
      color: 'rgba(113, 113, 122, 0.3)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, height])

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3">
        <span className="text-xs font-medium text-blue-400">MACD</span>
        <span className="text-xs font-medium text-orange-400">Signal</span>
        <span className="text-xs font-medium text-zinc-400">Histogram</span>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
})

// ============================================
// Main Indicator Chart Component
// ============================================

export const IndicatorChart = memo(function IndicatorChart({
  type,
  data,
  period,
  height = 150,
  className = '',
}: IndicatorChartProps) {
  if (type === 'rsi') {
    return <RSIChart data={data} period={period} height={height} className={className} />
  }

  if (type === 'macd') {
    return <MACDChart data={data} height={height} className={className} />
  }

  return null
})

IndicatorChart.displayName = 'IndicatorChart'

export { IndicatorChart as default }
