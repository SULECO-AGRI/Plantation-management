# Project TODOs

## [TODO-001] QR / RFID Scanner Integration for Worker Attendance Roll-Call
- **What:** Camera-based QR/Barcode and RFID badge scanner for rapid worker attendance roll-call during morning muster.
- **Why:** Accelerates physical muster roll-calls in high-density tea estate divisions, eliminating manual name search and transcription errors.
- **Pros:** Fast contactless check-in, reduces morning muster queue times, works offline on mobile/tablet cameras.
- **Cons:** Requires camera device permissions, video stream capture, and physical QR/RFID worker badges.
- **Context:** To be integrated into the Field Officer `AttendanceMarkingView` search header as an alternative input channel.
- **Depends on / blocked by:** `AttendanceMarkingView` core component.

## [TODO-002] Daily Harvest Weigh-In CSV/PDF Export & Weighbridge Slips
- **What:** Export daily weigh-in records to printable weighbridge slips and CSV files for leaf transport tractors.
- **Why:** Field officers must provide physical or exportable leaf transfer manifests when green leaf bags are loaded for transport to the tea processing factory.
- **Pros:** Instant paper/digital audit trail between field harvest stations and central factory weighbridge.
- **Cons:** Additional client-side PDF/CSV generation dependencies or helpers.
- **Context:** Accessible directly from the `DailyHarvestEntryView` action bar.
- **Depends on / blocked by:** `DailyHarvestEntryView` and `mockHarvestService.getHarvestLogs()`.
