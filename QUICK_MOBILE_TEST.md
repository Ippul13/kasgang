# 🧪 Quick Mobile Testing Guide

## How to Test Mobile Features

### Desktop Browser Testing
```
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select "iPhone 12" or "Mobile Generic (375x667)"
4. Test flows below
```

---

## Test Flows

### Flow 1: Not Logged In (Mobile)
```
✅ Start App
   ├─ Input Transaksi menu → HIDDEN
   ├─ Input Transaksi form → HIDDEN
   ├─ Action buttons (🖊️🗑️) → HIDDEN
   ├─ "Tambah" buttons (➕) → HIDDEN
   └─ Login button → VISIBLE

✅ Try to navigate to other sections
   ├─ Checklist Kas → VISIBLE
   ├─ Inventaris → VISIBLE (no action buttons)
   ├─ Program Kerja → VISIBLE (no action buttons)
   └─ Riwayat → VISIBLE (no delete buttons)
```

### Flow 2: Login
```
✅ Click "Login Admin" button
   ├─ Enter admin credentials
   ├─ Click "Login"
   └─ Redirected to Dashboard

✅ Check visibility changes
   ├─ Input Transaksi menu → NOW VISIBLE
   ├─ Input Transaksi form → NOW VISIBLE
   ├─ Action buttons → NOW VISIBLE
   └─ "Tambah" buttons → NOW VISIBLE
```

### Flow 3: Check Mobile Layout
```
✅ Click on "Input Transaksi" menu
   └─ Form displays nicely on mobile

✅ Navigate to "Checklist Kas"
   ├─ Table visible with data
   ├─ Action buttons visible: 🖊️
   ├─ Buttons properly aligned
   └─ Spacing looks good

✅ Navigate to "Inventaris"
   ├─ Table visible with data
   ├─ Action buttons visible: 🖊️ 🗑️
   ├─ "Tambah Barang" button visible
   └─ Buttons wrap nicely on small screen

✅ Navigate to "Program Kerja"
   ├─ Table visible with data
   ├─ Action buttons visible: 🖊️ 🗑️
   ├─ "Tambah Program" button visible
   └─ Layout responsive
```

### Flow 4: Logout
```
✅ Click "Logout" button
   ├─ Logged out
   ├─ Return to Dashboard

✅ Check visibility reverts
   ├─ Input Transaksi menu → HIDDEN
   ├─ Input Transaksi form → HIDDEN
   ├─ Action buttons → HIDDEN
   ├─ "Tambah" buttons → HIDDEN
   └─ Login button → VISIBLE
```

---

## What to Look For

### ✅ Correct Behavior
- [ ] Input section only visible when logged in on mobile
- [ ] Menu item appears/disappears with login state
- [ ] Action buttons properly aligned
- [ ] Buttons don't overlap or stretch
- [ ] Tables remain readable on mobile
- [ ] All text visible (not cut off)
- [ ] Buttons clickable with good touch targets

### ❌ Problems to Avoid
- [ ] Input form showing when not logged in
- [ ] Action buttons invisible when logged in
- [ ] Buttons misaligned or stacked
- [ ] Text too small to read
- [ ] Buttons too close together (hard to tap)
- [ ] Responsive breakpoint not working

---

## Responsive Breakpoints

| Device | Width | Test With |
|--------|-------|-----------|
| iPhone SE | 375px | Chrome DevTools: "iPhone SE" |
| iPhone 12 | 390px | Chrome DevTools: "iPhone 12" |
| iPhone 14 | 390px | Chrome DevTools: "iPhone 14" |
| iPad Mini | 768px | Chrome DevTools: "iPad Mini" |

---

## Browser Console Test (Optional)

```javascript
// Check if input section exists
console.log('Input section found:', document.getElementById('input') !== null);

// Check if nav item exists
console.log('Nav input found:', document.getElementById('navInput') !== null);

// Check current login state
console.log('Is logged in:', isLoggedIn);

// Manually test visibility toggle
updateAuthButton(); // Call to update
console.log('Admin visible class:', document.getElementById('input').classList.contains('admin-visible'));
```

---

## Expected Results

### Desktop (1024px+)
```
Input form: ALWAYS visible (desktop unchanged)
Action buttons: visible when logged in
Menu: shows Input Transaksi always
```

### Mobile (< 768px)
```
Input form: visible ONLY when logged in
Action buttons: visible ONLY when logged in
Menu: Input Transaksi visible ONLY when logged in
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Input form always showing on mobile | CSS rule not applied | Check media query at line 1901 in style.css |
| Action buttons not visible when logged in | updateAuthButton not called | Check login success handler |
| Menu item not appearing | navInput ID might be wrong | Verify HTML has `id="navInput"` |
| Layout broken | CSS class conflict | Check for duplicate/conflicting rules |

---

## Quick Checklist

```
Before submitting for review:

□ Tested on iPhone 12 (375px)
□ Tested on iPad Mini (768px)
□ Tested on Desktop (1024px+)
□ Input form hidden on mobile (not logged in)
□ Input form visible on mobile (logged in)
□ Action buttons responsive and aligned
□ All tables readable on mobile
□ No console errors
□ No layout breaks
□ Performance acceptable
```

---

## Files to Check

If issues arise:
1. `style.css` → Line 1888-1950 (media query)
2. `app.js` → Line ~1100 (updateAuthButton function)
3. `index.html` → Look for `id="input"` and `id="navInput"`

---

## Questions?

Refer to: `MOBILE_IMPLEMENTATION_SUMMARY.md`

---

*Last Updated: 2026-06-03*
