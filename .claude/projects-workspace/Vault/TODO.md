# Vault Application - TODO List

## Priority Queue for Future Work

### 1. AI Service Connection Issue
**Status:** Pending
**Description:** Fix the "AI service is disconnected" error appearing in the Vault app.
**Impact:** High - Blocks URL analysis and auto-fill functionality

---

### 2. Streamline Add Tool Flow
**Status:** Pending
**Current Behavior:** Clicking "Add" button opens a modal with two options (Manual/Link)
**Desired Behavior:** Clicking "Add" should directly navigate to a simple load page without intermediate modal
**Impact:** Medium - Improves UX by reducing clicks

---

### 3. Improve Text Readability
**Status:** Pending
**Description:** Make table content and header fonts black for better visibility
**Current Issue:** Text is too light and hard to read
**Impact:** High - Accessibility and usability

---

### 4. Fix Top Navigation Tabs
**Status:** Pending
**Tabs to Fix:**
- Home
- AI Tools
- Chatbots
- LLM Platforms

**Current Issue:** Tabs are present but non-functional
**Desired Behavior:** Clicking each tab should navigate to respective section/view
**Impact:** High - Core navigation feature

---

### 5. Left Menu UI Enhancement (Light Mode)
**Status:** Pending
**Current Issue:** Left menu appears mostly white in Light Mode, blending with main content area
**Desired Behavior:** Apply distinct background color to differentiate left menu from table area
**Impact:** Medium - Visual hierarchy and usability

---

### 6. Left Menu Reorganization - Part A: Hierarchical Organization
**Status:** Pending
**Location:** Top of left menu, under "Search All"
**Features:**
- Display all apps in hierarchical structure
- **Toggle switch** to change organization mode:
  - **Mode 1:** By Organization/Platform
  - **Mode 2:** By Function
- Collapsible/expandable tree structure
- Position: Top section of left menu

**Impact:** High - Core organizational feature

---

### 7. Left Menu Reorganization - Part B: User Defined Groups
**Status:** Pending
**Location:** Below hierarchical section with visual separator
**Features:**
- "User Defined Groups" section header
- Create custom labels/categories
- Drag-and-drop tools into custom groups
- Tools can exist in both hierarchy AND user-defined groups simultaneously
- Allows multiple users to organize tools their own way

**Impact:** High - Personalization and workflow optimization

---

### 8. Simplify Theme Toggle
**Status:** Pending
**Current Behavior:** Clicking sun/moon icon opens dropdown with Light/Dark/System options
**Desired Behavior:**
- Single toggle button (no dropdown)
- Click once: Switch from Light → Dark (or Dark → Light)
- Click again: Switch back
- No "System" option
- Save user preference

**Impact:** Medium - Simplified UX

---

## Implementation Notes

**Work Approach:**
- Items numbered 1-8 in priority order
- Tackle one by one in future sessions
- Do NOT implement now - this is a queue for later work
- Each item should be completed and tested before moving to next

**Dependencies:**
- Item 6 and 7 are related (left menu sections) - may implement together
- Item 3 should be done early as it affects daily usability
- Item 1 blocks AI features - high priority

**Testing Checklist (for future implementation):**
- [ ] Test in both Light and Dark modes
- [ ] Verify responsive behavior on different screen sizes
- [ ] Check accessibility (keyboard navigation, screen readers)
- [ ] Ensure data persistence (theme preference, user groups)
- [ ] Cross-browser compatibility

---

*Last Updated: 2026-01-03*
*Total Items: 8*
*Status: All Pending*
