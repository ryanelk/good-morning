<script>
  import { onMount } from 'svelte';
  import Calendar from './Calendar.svelte';
  import MessageDisplay from './MessageDisplay.svelte';
  
  export let messagesData = {
    messages: {},
    dates: [],
    messagesWithNumbers: {}
  };
  
  let selectedDate = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let mounted = false;
  let isMobile = false;
  let currentView = 'calendar'; // 'calendar' or 'messages'
  
  onMount(() => {
    mounted = true;
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    if (messagesData?.dates?.length > 0) {
      selectedDate = messagesData.dates[messagesData.dates.length - 1];
      const date = new Date(selectedDate);
      currentMonth = date.getMonth();
      currentYear = date.getFullYear();
    }
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  });
  
  function checkIfMobile() {
    isMobile = window.innerWidth < 768;
  }
  
  function handleDateSelect(event) {
    selectedDate = event.detail;
    if (isMobile) {
      currentView = 'messages';
    }
  }
  
  function handleMonthChange(event) {
    currentMonth = event.detail.month;
    currentYear = event.detail.year;
  }
  
  function selectRandomDate() {
    if (messagesData?.dates?.length > 0) {
      const randomIndex = Math.floor(Math.random() * messagesData.dates.length);
      selectedDate = messagesData.dates[randomIndex];
      const date = new Date(selectedDate);
      currentMonth = date.getMonth();
      currentYear = date.getFullYear();
      
      if (isMobile) {
        currentView = 'messages';
      }
    }
  }
  
  function handleBackToCalendar() {
    if (isMobile) {
      currentView = 'calendar';
    }
  }
  
  function handleSwipeCalendar(direction) {
    if (direction === 'left') {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
    } else if (direction === 'right') {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
    }
    handleMonthChange({ detail: { month: currentMonth, year: currentYear }});
  }
  
  function handleSwipeMessages(direction) {
    if (!selectedDate || !messagesData?.dates?.length) return;
    
    const currentIndex = messagesData.dates.indexOf(selectedDate);
    let newIndex;
    
    if (direction === 'left') {
      newIndex = currentIndex + 1;
    } else if (direction === 'right') {
      newIndex = currentIndex - 1;
    }
    
    if (newIndex >= 0 && newIndex < messagesData.dates.length) {
      selectedDate = messagesData.dates[newIndex];
      const date = new Date(selectedDate);
      currentMonth = date.getMonth();
      currentYear = date.getFullYear();
    }
  }
  
  $: selectedMessages = selectedDate && messagesData?.messagesWithNumbers ? 
    messagesData.messagesWithNumbers[selectedDate] : null;
</script>

{#if mounted}
  <div class="app-container {isMobile ? 'mobile' : 'desktop'}">
    {#if !isMobile}
      <!-- Desktop Layout -->
      <div class="calendar-section">
        <div class="section-header">
          <button 
            class="random-btn"
            on:click={selectRandomDate}
            disabled={!messagesData?.dates?.length}
          >
            Random Day
          </button>
        </div>
        
        <Calendar 
          {messagesData}
          {selectedDate}
          {currentMonth}
          {currentYear}
          {isMobile}
          on:dateSelect={handleDateSelect}
          on:monthChange={handleMonthChange}
          on:swipe={e => handleSwipeCalendar(e.detail)}
        />
      </div>
      
      <div class="messages-section">
        {#if selectedMessages}
          <MessageDisplay 
            messageNumber={selectedMessages.messageNumber}
            messages={selectedMessages.messages}
            date={selectedDate}
            {isMobile}
            on:backToCalendar={handleBackToCalendar}
            on:swipe={e => handleSwipeMessages(e.detail)}
          />
        {:else}
          <div class="no-messages">
            <p>{messagesData?.dates?.length > 0 ? 'Select a date to view messages' : 'No messages available'}</p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Mobile Layout - Single View -->
      <div class="mobile-container">
        {#if currentView === 'calendar'}
          <div class="mobile-header">
            <button 
              class="random-btn mobile"
              on:click={selectRandomDate}
              disabled={!messagesData?.dates?.length}
            >
              Random Day
            </button>
          </div>
          
          <div class="mobile-view calendar-view">
            <Calendar 
              {messagesData}
              {selectedDate}
              {currentMonth}
              {currentYear}
              {isMobile}
              on:dateSelect={handleDateSelect}
              on:monthChange={handleMonthChange}
              on:swipe={e => handleSwipeCalendar(e.detail)}
            />
          </div>
        {:else}
          <div class="mobile-view messages-view">
            {#if selectedMessages}
              <MessageDisplay 
                messageNumber={selectedMessages.messageNumber}
                messages={selectedMessages.messages}
                date={selectedDate}
                {isMobile}
                on:backToCalendar={handleBackToCalendar}
                on:swipe={e => handleSwipeMessages(e.detail)}
              />
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{:else}
  <div class="loading">
    <div class="spinner"></div>
  </div>
{/if}

<style>
  .app-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .app-container.desktop {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .app-container.mobile {
    display: block;
    padding: 0;
  }
  
  .calendar-section, .messages-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .section-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .random-btn {
    background: #007AFF;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  
  .random-btn:hover:not(:disabled) {
    background: #0056CC;
  }
  
  .random-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .random-btn.mobile {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
  
  .no-messages {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  }
  
  .no-messages p {
    color: #6b7280;
    font-size: 1.125rem;
    margin: 0;
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24rem;
  }
  
  .spinner {
    width: 3rem;
    height: 3rem;
    border: 2px solid transparent;
    border-top: 2px solid #007AFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .mobile-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .mobile-header {
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .mobile-view {
    flex: 1;
    overflow: hidden;
    background: #f9fafb;
  }
  
  .calendar-view {
    padding: 1rem;
  }
  
  .messages-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  @media (max-width: 767px) {
    .app-container.desktop {
      display: none;
    }
  }
  
  @media (min-width: 768px) {
    .app-container.mobile {
      display: none;
    }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>