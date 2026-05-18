# Blockchain Timestamp Fix

**Issue:** Audit trail menampilkan "Invalid Date" untuk blockchain events

**Root Cause:** 
Hyperledger Fabric menggunakan **Protobuf Timestamp** format untuk timestamp di blockchain:
```javascript
{
  seconds: 1779040895,  // Unix timestamp in seconds
  nanos: 600000000      // Nanoseconds precision
}
```

JavaScript `new Date()` tidak bisa parse object ini, perlu convert manual.

---

## Solution

### Conversion Formula
```javascript
const milliseconds = timestamp.seconds * 1000 + timestamp.nanos / 1000000
const date = new Date(milliseconds)
```

### Files Fixed
1. ✅ `frontend/src/views/usulan/UsulanDetail.vue`
2. ✅ `frontend/src/views/kegiatan/KegiatanDetail.vue`
3. ✅ `frontend/src/views/AuditTrailView.vue`

### Utility Created
Created `frontend/src/utils/dateFormatter.js` dengan functions:
- `formatDate()` - Auto-detect ISO string atau Protobuf
- `formatDateTime()` - With time
- `formatDateShort()` - Short format
- `formatRelativeTime()` - "2 hours ago" style
- `protobufToDate()` - Convert Protobuf → Date
- `isProtobufTimestamp()` - Type check

---

## Usage Example

### Before (Broken)
```javascript
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {...})
  // ❌ Returns "Invalid Date" for {seconds, nanos}
}
```

### After (Fixed)
```javascript
function formatDate(dateStr) {
  if (!dateStr) return '-'
  
  // Handle Protobuf Timestamp from blockchain
  if (typeof dateStr === 'object' && dateStr.seconds !== undefined) {
    const milliseconds = dateStr.seconds * 1000 + (dateStr.nanos || 0) / 1000000
    return new Date(milliseconds).toLocaleDateString('id-ID', {...})
  }
  
  // Handle regular ISO string
  return new Date(dateStr).toLocaleDateString('id-ID', {...})
}
```

### Using Utility (Recommended for future)
```javascript
import { formatDateTime } from '@/utils/dateFormatter'

// Auto-handles both formats
const formatted = formatDateTime(entry.timestamp)
```

---

## Testing

Test dengan blockchain event yang memiliki timestamp:
```javascript
{
  action: "Blockchain Event",
  timestamp: {seconds: 1779040895, nanos: 600000000},
  source: "blockchain",
  txId: "0fb2171e2d12..."
}
```

**Expected Result:** "18 Mei 2026, 01:01" (atau sesuai locale)

---

## Related

- Hyperledger Fabric menggunakan Google Protobuf Timestamp
- Protobuf spec: https://developers.google.com/protocol-buffers/docs/reference/google.protobuf#timestamp
- Fabric Node SDK mengembalikan timestamp dalam format ini untuk audit trail

---

**Fixed:** May 18, 2026
**Status:** ✅ Complete
