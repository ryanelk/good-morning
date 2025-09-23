<script>
  import { createEventDispatcher } from 'svelte';
  
  export let messagesData = { messages: {}, dates: [] };
  export let selectedDate = null;
  export let currentMonth = new Date().getMonth();
  export let currentYear = new Date().getFullYear();
  export let isMobile = false;
  
  const dispatch = createEventDispatcher();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  let calendarElement;
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  
  $: availableYears = messagesData?.dates?.length ? 
    [...new Set(messagesData.dates.map(date => new Date(date).getFullYear()))].sort() : 
    [new Date().getFullYear()];
  
  $: calendarDays = getCalendarDays(currentYear, currentMonth);
  $: selectedDate;
  
  function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.getFullYear() + '-' + 
                     String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(date.getDate()).padStart(2, '0');
      
      const hasMessages = messagesData?.messages[dateStr];
      const emojis = hasMessages ? getEmojisForDate(dateStr) : [];
      days.push({
        day,
        dateStr,
        hasMessages: !!hasMessages,
        emojis,
      });
    }
    
    return days;
  }
  
  function getEmojisForDate(dateStr) {
    const messages = messagesData?.messages[dateStr] || [];
    if (messages.length === 0) return [];
    
    const firstMessage = messages[0];
    if (!firstMessage.msg) return [];
    
    let filteredText = firstMessage.msg.toLowerCase();
    
    const goodMorningVariants = [
      'good morning',
      'goodmorning', 
      'good mornin',
      'goodmornin',
      'gud morning',
      'good mrning',
      'mornin',
      'gm'
    ];
    
    goodMorningVariants.forEach(variant => {
      filteredText = filteredText.replace(new RegExp(variant, 'gi'), '');
    });
    
    filteredText = filteredText.trim();
    
    let originalText = firstMessage.msg;
    goodMorningVariants.forEach(variant => {
      const regex = new RegExp(variant, 'gi');
      originalText = originalText.replace(regex, '');
    });
    originalText = originalText.trim();
    
    if (!originalText) return [];
    
    const chars = [...originalText];
    
    for (let char of chars) {
      if (char.length > 1 || 
          (char.codePointAt(0) > 127 && 
           !/[a-zA-Z0-9\s\p{P}]/u.test(char))) {
        return [char];
      }
    }
    
    return [];
  }
  
  function selectDate(dateStr) {
    if (messagesData?.messages[dateStr]) {
      dispatch('dateSelect', dateStr);
    }
  }
  
  function previousMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    dispatch('monthChange', { month: currentMonth, year: currentYear });
  }
  
  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    dispatch('monthChange', { month: currentMonth, year: currentYear });
  }
  
  function handleTouchStart(event) {
    if (!isMobile) return;
    
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isSwiping = false;
  }
  
  function handleTouchMove(event) {
    if (!isMobile) return;
    
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      isSwiping = true;
      event.preventDefault();
    }
  }
  
  function handleTouchEnd(event) {
    if (!isMobile || !isSwiping) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        dispatch('swipe', 'right');
      } else {
        dispatch('swipe', 'left');
      }
    }
    
    isSwiping = false;
  }
</script>

<div class="calendar-container {isMobile ? 'mobile' : ''}"
     bind:this={calendarElement}
     on:touchstart={handleTouchStart}
     on:touchmove={handleTouchMove}
     on:touchend={handleTouchEnd}>
  
  <div class="calendar-header">
    {#if !isMobile}
      <div class="nav-buttons">
        <button class="nav-btn" on:click={previousMonth}>←</button>
        <button class="nav-btn" on:click={nextMonth}>→</button>
      </div>
    {/if}
    
    <div class="selectors {isMobile ? 'mobile' : ''}">
      <select bind:value={currentMonth} class="{isMobile ? 'mobile' : ''}">
        {#each monthNames as month, index}
          <option value={index}>{month}</option>
        {/each}
      </select>
      
      <select bind:value={currentYear} class="{isMobile ? 'mobile' : ''}">
        {#each availableYears as year}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>
  </div>
  
  {#if isMobile}
    <div class="swipe-indicator">
      <div class="swipe-hint">← Swipe to change months →</div>
    </div>
  {/if}
  
  <div class="calendar-grid {isMobile ? 'mobile' : ''}">
    {#each dayNames as day}
      <div class="day-header {isMobile ? 'mobile' : ''}">{day}</div>
    {/each}
    
    {#each calendarDays as dayData}
      <div class="day-cell {isMobile ? 'mobile' : ''}">
        {#if dayData}
          <button
            class="day-button {dayData.hasMessages ? 'has-messages' : 'no-messages'} {dayData.dateStr === selectedDate ? 'selected' : ''} {isMobile ? 'mobile' : ''}"
            on:click={() => selectDate(dayData.dateStr)}
            disabled={!dayData.hasMessages}
          >
            <div class="day-content">
              <span class="day-number {dayData.hasMessages ? 'with-circle' : ''} {isMobile ? 'mobile' : ''}">{dayData.day}</span>
              {#if dayData.emojis.length > 0}
                <div class="emoji-center">
                  <span class="emoji {isMobile ? 'mobile' : ''}">{dayData.emojis[0]}</span>
                </div>
              {/if}
            </div>
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .calendar-container {
    background: rgba(255, 255, 255, 0.9); /* Semi-transparent white */
    backdrop-filter: blur(10px); /* Glass effect */
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    padding: 1.5rem;
    user-select: none;
  }
  
  .calendar-container.mobile {
    padding: 0.5rem;
    border-radius: 0;
    box-shadow: none;
    background: rgba(249, 250, 251, 0.8);
    backdrop-filter: blur(8px);
    height: 100vh; /* Full height for better swipe area */
    display: flex;
    flex-direction: column;
  }
  
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .nav-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .nav-btn {
    background: #f3f4f6;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    font-size: 1.125rem;
    transition: background-color 0.15s;
  }
  
  .nav-btn:hover {
    background: #e5e7eb;
  }
  
  .selectors {
    display: flex;
    gap: 1rem;
  }
  
  .selectors.mobile {
    gap: 0.5rem;
    width: 100%;
    justify-content: center;
  }
  
  select {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  
  select.mobile {
    flex: 1;
    font-size: 1rem;
    padding: 0.75rem;
  }
  
  .swipe-indicator {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .swipe-hint {
    color: #6b7280;
    font-size: 0.875rem;
    opacity: 0.7;
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }
  
  .calendar-grid.mobile {
    gap: 0.125rem; /* Smaller gap for mobile */
    flex: 1; /* Take remaining space */
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: auto repeat(6, 1fr); /* Auto for headers, equal rows for dates */
    align-content: stretch;
  }
  
  .day-header {
    padding: 0.75rem;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .day-header.mobile {
    padding: 0.375rem;
    font-size: 0.75rem;
  }
  
  .day-cell {
    aspect-ratio: 1;
    padding: 0.25rem;
    min-height: 100px;
  }
  
  .day-cell.mobile {
    min-height: 0; /* Remove min-height constraint */
    padding: 0.125rem;
    aspect-ratio: 1; /* Keep square cells */
    display: flex;
  }
  
  .day-button {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 0.5rem;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    font-size: 0.875rem;
    transition: all 0.2s;
    position: relative;
    cursor: pointer;
    background: #f9fafb;
    touch-action: manipulation;
  }
  
  .day-button.mobile {
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }
  
  .day-content {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
  }
  
  .day-button.has-messages {
    background: #f9fafb;
    cursor: pointer;
  }
  
  .day-button.has-messages:hover {
    background: #f3f4f6;
  }
  
  .day-button.has-messages:active {
    background: #e5e7eb;
    transform: scale(0.98);
  }
  
  .day-button.no-messages {
    background: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
  }
  
  .day-button.selected {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
    border: 2px solid var(--primary-blue) !important;
    box-shadow: 0 0 0 2px var(--primary-blue), 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .day-number {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1;
  }
  
  .day-number.mobile {
    font-size: 0.625rem;
  }
  
  .day-number.with-circle {
    background: linear-gradient(135deg, var(--primary-blue-light) 0%, rgba(59, 130, 246, 0.2) 100%);
    border: 1px solid var(--primary-blue);
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: #3b82f6;
  }
  
  .day-number.with-circle.mobile {
    width: 0.875rem;
    height: 0.875rem;
    font-size: 0.4375rem;
  }
  
  .day-button.selected .day-number {
    color: #1d4ed8;
    font-weight: 600;
  }
  
  .day-button.selected .day-number.with-circle {
    background: rgba(29, 78, 216, 0.2);
    border-color: #1d4ed8;
    color: #1d4ed8;
  }
  
  .emoji-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .emoji {
    font-size: 1.25rem;
    line-height: 1;
  }
  
  .emoji.mobile {
    font-size: 0.875rem;
  }


  
  @media (max-width: 640px) {
    .calendar-container.mobile {
      height: calc(100vh - 5rem); /* Account for header and padding */
    }

    .calendar-grid.mobile {
      max-height: calc(100vh - 12rem); /* Account for header, selectors, and swipe indicator */
    }
    
    .day-cell.mobile {
      min-height: calc((100vh - 15rem) / 6); /* Dynamically size based on available space */
    }
    
    .emoji.mobile {
      font-size: 0.875rem;
    }
    
    .day-number.with-circle.mobile {
      width: 1rem;
      height: 1rem;
      font-size: 0.5rem;
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem; /* Reduced margin */
      flex-wrap: wrap;
      gap: 1rem;
      flex-shrink: 0; /* Prevent header from shrinking */
    }
    
    .day-cell {
      min-height: 70px;
    }
    
    .emoji {
      font-size: 0.875rem;
    }
    
    .day-number.with-circle {
      width: 1rem;
      height: 1rem;
      font-size: 0.5rem;
    }
  }
</style>