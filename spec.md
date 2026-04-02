# Flipchat

## Current State
New build (expired draft). Full rebuild of Flipchat WhatsApp-inspired chat app.

## Requested Changes (Diff)

### Add
- Full Flipchat app rebuild with all features
- Profile screen updated to WhatsApp style: Name, About, Phone, Links sections with icons

### Modify
- Profile screen layout: show profile photo (editable), Name row with icon, About row (editable, green 'Set About'), Phone row showing login number with +91, Links row (green 'Add links')

### Remove
- SMS API Key section from profile (already removed)
- Any demo OTP bypass

## Implementation Plan
1. Frontend-only React app (no ICP backend needed - uses localStorage for persistence)
2. Screens: Splash, Login (OTP via 2Factor.in), Setup, Chat List (tabs: Chats/Calls/Status/Profile)
3. Chat features: 1-on-1 and group chats, demo contacts, typing indicators, online status, media sharing
4. Call system: voice/video call screens, call history tab
5. Status (Stories) tab with + button
6. Profile screen: WhatsApp-style with avatar, Edit button, Name/About/Phone/Links rows with icons
7. OTP via 2Factor.in API: key aa417444-2cad-11f1-ae4a-0200cd936042
8. Green theme, Flipchat logo on all major screens
9. Mobile responsive
