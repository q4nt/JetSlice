import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the time-slot divs (inline onclick handlers) with rmp-time-slot class + proper data attrs
# And replace the date chips section  
# Find the RMP panel section
start_marker = '<div class="rate-marketplace-panel awaiting prod-screen" id="rate-marketplace-panel">'
end_marker = '</div></div>\n</div></div><script src="app.js?v=6">'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers! start={start_idx}, end={end_idx}")
    exit(1)

new_panel = '''<div class="rate-marketplace-panel awaiting prod-screen" id="rate-marketplace-panel">
<!-- Header -->
<div class="rmp-header">
<div class="rmp-header-top">
<ion-icon name="chevron-back-outline" onclick="app.hideScheduleView()" style="font-size: 20px; color: var(--accent-color); cursor: pointer; margin-right: 8px;"></ion-icon>
<h2 style="flex: 1; margin: 0;">Schedule</h2>
<span class="rmp-badge" id="rmp-status-badge" style="background: rgba(212,175,55,0.12); color: var(--accent-color);">
<span class="pulse-dot" style="background:var(--accent-color);"></span> Planning
</span>
</div>
<div class="rmp-route-label" id="rmp-route-label"><span id="rmp-selected-date">Tomorrow, Apr 26</span></div>
</div>
<!-- Scrollable Content -->
<div class="rmp-content" id="rmp-content">
    <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 10px;">
        <!-- Date Chips -->
        <div id="rmp-date-chips" style="display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; padding-bottom: 6px;">
            <div class="rmp-date-chip" data-date="Today, Apr 25" onclick="app.selectScheduleDate(this)">
                <div class="rdc-label">Today</div><div class="rdc-day">25</div>
            </div>
            <div class="rmp-date-chip active" data-date="Tomorrow, Apr 26" onclick="app.selectScheduleDate(this)">
                <div class="rdc-label">Tomorrow</div><div class="rdc-day">26</div>
            </div>
            <div class="rmp-date-chip" data-date="Wed, Apr 27" onclick="app.selectScheduleDate(this)">
                <div class="rdc-label">Wed</div><div class="rdc-day">27</div>
            </div>
            <div class="rmp-date-chip" data-date="Thu, Apr 28" onclick="app.selectScheduleDate(this)">
                <div class="rdc-label">Thu</div><div class="rdc-day">28</div>
            </div>
            <div class="rmp-date-chip" data-date="Fri, Apr 29" onclick="app.selectScheduleDate(this)">
                <div class="rdc-label">Fri</div><div class="rdc-day">29</div>
            </div>
        </div>

        <!-- Time Slots Header -->
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); font-weight: 700;">Available Delivery Times</div>

        <!-- Time Slots -->
        <div id="rmp-time-slots" style="display: flex; flex-direction: column; gap: 10px;">
            <div class="rmp-time-slot" onclick="app.selectScheduleTime(this)" data-price="$1,450">
                <div style="flex:1;"><div class="rst-time">9:00 AM \u2013 11:00 AM</div><div class="rst-label" style="color:#54ec96;">Optimal Route (Save $332)</div></div>
                <div class="rst-price">$1,450</div>
            </div>
            <div class="rmp-time-slot selected" onclick="app.selectScheduleTime(this)" data-price="$1,782">
                <div style="flex:1;"><div class="rst-time">12:00 PM \u2013 2:00 PM</div><div class="rst-label">Standard Execution</div></div>
                <div class="rst-price">$1,782</div>
            </div>
            <div class="rmp-time-slot" onclick="app.selectScheduleTime(this)" data-price="$2,150">
                <div style="flex:1;"><div class="rst-time">5:00 PM \u2013 7:00 PM</div><div class="rst-label" style="color:#ff3b30;">High Demand Surcharge</div></div>
                <div class="rst-price">$2,150</div>
            </div>
            <div class="rmp-time-slot" onclick="app.selectScheduleTime(this)" data-price="$1,850">
                <div style="flex:1;"><div class="rst-time">8:00 PM \u2013 10:00 PM</div><div class="rst-label">Late Night Ops</div></div>
                <div class="rst-price">$1,850</div>
            </div>
        </div>

        <!-- Plan Summary (cloned from DPP on time selection) -->
        <div id="rmp-plan-summary" style="display:none; flex-direction: column; gap: 0;"></div>
    </div>
</div>
<!-- Footer -->
<div class="rmp-footer">
<div class="rmp-savings" id="rmp-savings" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 14px; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: var(--text-secondary);">
<ion-icon name="trending-down-outline" style="font-size: 14px; flex-shrink:0; margin-top:1px;"></ion-icon>
<span id="rmp-savings-text">Select a time window to preview your plan</span>
</div>
<button class="dpp-footer-btn" id="rmp-book-btn" onclick="app.openDispatchModal()">
<ion-icon name="rocket-outline"></ion-icon> Book Selected
</button>
</div>
</div>'''

new_content = content[:start_idx] + new_panel + content[end_idx:]
print(f"Replaced panel. Length diff: {len(new_content) - len(content)}")
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Done")
