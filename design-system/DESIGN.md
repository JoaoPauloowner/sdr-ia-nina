---
version: 1.0.0
name: Miyagi-Labs-Design-System
description: Design system inspired by the visual identity of Miyagi Labs — a high-performance, precision-engineered aesthetic characterized by vibrant vermilion/fire-orange accents (#FF4D00 / #FF5520), deep obsidian and charcoal surfaces (#0A0A0C, #121217, #1A1A22), crisp warm off-whites, sleek pill buttons, radial warm glows, and bold technical typography.

colors:
  primary: "#FF4D00"
  primary-hover: "#FF6622"
  primary-active: "#E04400"
  primary-light: "#FFF0EB"
  primary-glow: "rgba(255, 77, 0, 0.25)"
  
  # Dark Surfaces & Inks
  bg-dark: "#0A0A0C"
  surface-dark: "#121217"
  surface-card: "#181820"
  surface-hover: "#22222C"
  border-dark: "#262632"
  border-glow: "rgba(255, 77, 0, 0.35)"

  # Light Surfaces (Clean High-Contrast)
  canvas: "#F8F9FB"
  canvas-subtle: "#F0F2F5"
  card-light: "#FFFFFF"
  border-light: "#E2E5EB"
  
  # Text & Inks
  ink-white: "#FFFFFF"
  ink-light: "#E4E4E7"
  ink-muted: "#9494A0"
  ink-dark: "#09090B"
  ink-body: "#3F3F46"
  
  # Semantic Indicators
  positive: "#10B981"
  positive-bg: "rgba(16, 185, 129, 0.12)"
  warning: "#F59E0B"
  warning-bg: "rgba(245, 158, 11, 0.12)"
  negative: "#EF4444"
  negative-bg: "rgba(239, 68, 68, 0.12)"
  info: "#3B82F6"
  info-bg: "rgba(59, 130, 246, 0.12)"

typography:
  font-family: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  display-xxl:
    fontSize: "56px"
    fontWeight: "800"
    lineHeight: "1.1"
    letterSpacing: "-1.5px"
  display-xl:
    fontSize: "40px"
    fontWeight: "800"
    lineHeight: "1.15"
    letterSpacing: "-1px"
  heading-lg:
    fontSize: "28px"
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.5px"
  heading-md:
    fontSize: "20px"
    fontWeight: "700"
    lineHeight: "1.3"
  body-md:
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.5"
  body-sm:
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "1.4"
  button:
    fontSize: "13px"
    fontWeight: "700"
    letterSpacing: "0.2px"

rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "22px"
  pill: "9999px"

shadows:
  subtle: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.03)"
  card: "0 6px 20px rgba(0, 0, 0, 0.08)"
  glow-orange: "0 0 30px rgba(255, 77, 0, 0.18)"
  elevated: "0 20px 40px -10px rgba(0, 0, 0, 0.3)"

components:
  navbar:
    background: "rgba(10, 10, 12, 0.85)"
    backdropFilter: "blur(16px)"
    borderBottom: "1px solid #262632"
    height: "68px"

  brand-badge:
    background: "linear-gradient(135deg, #FF4D00 0%, #FF2600 100%)"
    color: "#FFFFFF"
    borderRadius: "9999px"
    fontWeight: "800"
    boxShadow: "0 0 20px rgba(255, 77, 0, 0.4)"

  buttons:
    primary:
      background: "linear-gradient(135deg, #FF5500 0%, #E63E00 100%)"
      color: "#FFFFFF"
      borderRadius: "9999px"
      fontWeight: "700"
      boxShadow: "0 4px 16px rgba(255, 77, 0, 0.35)"
      hover: "transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255, 77, 0, 0.5);"
    secondary:
      background: "#181820"
      color: "#FFFFFF"
      border: "1px solid #262632"
      borderRadius: "9999px"
      fontWeight: "600"
      hover: "background: #22222C; border-color: #3F3F4E;"
    dark:
      background: "#0A0A0C"
      color: "#FF5500"
      border: "1px solid rgba(255, 77, 0, 0.3)"
      borderRadius: "9999px"

  cards:
    background: "#121217"
    border: "1px solid #22222B"
    borderRadius: "20px"
    glowVariant: "background: radial-gradient(circle at top right, rgba(255, 77, 0, 0.08), transparent 60%), #121217"

  tables:
    headerBg: "#181820"
    rowHoverBg: "#1A1A24"
    borderColor: "#22222C"

  badges:
    borderRadius: "9999px"
    fontWeight: "700"
    fontSize: "11px"
---
