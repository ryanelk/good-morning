<script>
  import { createEventDispatcher } from 'svelte';
  
  export let messageNumber = 1;
  export let messages = [];
  export let date = '';
  export let isMobile = false;
  
  const dispatch = createEventDispatcher();
  
  let comments = [];
  let newComment = '';
  let messagesContainer;
  let messageDisplayElement;
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  
  let commentsStorage = {};
  
  $: dateKey = `comments_${date}`;
  $: comments = commentsStorage[dateKey] || [];
  
  function addComment() {
    if (newComment) {
      const comment = {
        id: Date.now(),
        text: newComment,
        timestamp: new Date().toLocaleString()
      };
      
      const updatedComments = [...comments, comment];
      commentsStorage[dateKey] = updatedComments;
      comments = updatedComments;
      newComment = '';
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      addComment();
    }
  }
  
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
  
  function handleDateClick() {
    if (isMobile) {
      dispatch('backToCalendar');
    }
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
  
  // $: if (messagesContainer && messages) {
  //   setTimeout(() => {
  //     messagesContainer.scrollTop = messagesContainer.scrollHeight;
  //   }, 10);
  // }
</script>

<div class="message-display {isMobile ? 'mobile' : ''}"
     bind:this={messageDisplayElement}
     on:touchstart={handleTouchStart}
     on:touchmove={handleTouchMove}
     on:touchend={handleTouchEnd}>
  
  <div class="message-header {isMobile ? 'mobile' : ''}">
    <h2 class="message-number {isMobile ? 'mobile' : ''}">#{messageNumber}</h2>
    <div 
      class="message-date {isMobile ? 'mobile clickable' : ''}" 
      on:click={handleDateClick}
      disabled={!isMobile}
      >
      <span>
        {formatDate(date)}
      </span>
      {#if isMobile}
      <span class="back-indicator">← Back to Calendar</span>
      {/if}
    </div>
  </div>
  
  {#if isMobile}
    <div class="swipe-indicator">
      <div class="swipe-hint">← Swipe to navigate messages →</div>
    </div>
  {/if}
  
  <div 
    bind:this={messagesContainer}
    class="messages-container {isMobile ? 'mobile' : ''}"
  >
    {#each messages as message (message.ts)}
      <div class="message-row {message.sender === 'ry' ? 'me' : 'them'}">
        <div class="message-wrapper {isMobile ? 'mobile' : ''}">
          <div class="speech-bubble {message.sender === 'ry' ? 'bubble-me' : 'bubble-them'} {isMobile ? 'mobile' : ''}">
            <p class="message-text {isMobile ? 'mobile' : ''}">{message.msg}</p>
            
            {#if message.react}
              <div class="reaction {message.sender === 'ry' ? 'reaction-me' : 'reaction-them'} {isMobile ? 'mobile' : ''}">
                <span class="reaction-emoji {isMobile ? 'mobile' : ''}">{message.react}</span>
              </div>
            {/if}
          </div>
          
          <div class="sender-label {message.sender === 'ry' ? 'label-me' : 'label-them'} {isMobile ? 'mobile' : ''}">
            {message.sender}
          </div>
        </div>
      </div>
    {/each}
    
    {#if messages.length === 0}
      <div class="empty-messages {isMobile ? 'mobile' : ''}">
        <p>No messages for this day</p>
      </div>
    {/if}
  </div>
  
  <div class="comments-section {isMobile ? 'mobile' : ''}">
    {#if comments.length > 0}
      <div class="existing-comments">
        <div class="comments-list {isMobile ? 'mobile' : ''}">
          {#each comments as comment (comment.id)}
            <div class="comment {isMobile ? 'mobile' : ''}">
              <p class="comment-text">{comment.text}</p>
              <p class="comment-time">{comment.timestamp}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <div class="comment-input-section">
      <div class="input-group {isMobile ? 'mobile' : ''}">
        <input
          type="text"
          bind:value={newComment}
          on:keypress={handleKeyPress}
          placeholder="What were we talking about?"
          class="comment-input {isMobile ? 'mobile' : ''}"
        />
        <button
          on:click={addComment}
          disabled={!newComment}
          class="add-btn {isMobile ? 'mobile' : ''}"
        >
          ↵
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .message-display {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    user-select: none;
  }
  
  .message-display.mobile {
    height: 100vh;
    gap: 0.5rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 1rem;
  }
  
  .message-header {
    text-align: center;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .message-header.mobile {
    padding: 0.5rem 0 1rem 0;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .message-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #4b4726;
    margin: 0 0 0.5rem 0;
  }
  
  .message-number.mobile {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
  }
  
  .message-date {
    color: #4b5563;
    margin: 0;
    background: none;
    border: none;
    font: inherit;
    cursor: default;
  }
  
  .message-date.mobile.clickable {
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: background-color 0.15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  
  .message-date.mobile.clickable:hover {
    background: #f3f4f6;
  }
  
  .back-indicator {
    font-size: 0.75rem;
    color: #007AFF;
    font-weight: 500;
  }
  
  .swipe-indicator {
    text-align: center;
    margin-bottom: 0.5rem;
  }
  
  .swipe-hint {
    color: #6b7280;
    font-size: 0.75rem;
    opacity: 0.7;
  }
  
  .messages-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 0.5rem;
    height: 24rem;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .messages-container.mobile {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    flex: 1;
    height: auto;
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .message-row {
    display: flex;
    animation: fadeInUp 0.3s ease-out;
  }
  
  .message-row.me {
    justify-content: flex-end;
  }
  
  .message-row.them {
    justify-content: flex-start;
  }
  
  .message-wrapper {
    max-width: 20rem;
    display: flex;
    flex-direction: column;
  }
  
  .message-wrapper.mobile {
    max-width: 85%;
  }
  
  @media (min-width: 1024px) {
    .message-wrapper:not(.mobile) {
      max-width: 28rem;
    }
  }
  
  .speech-bubble {
    position: relative;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    word-wrap: break-word;
  }
  
  .speech-bubble.mobile {
    padding: 1rem 1.25rem;
    font-size: 1rem;
  }
  
  .bubble-me {
    background: linear-gradient(135deg, var(--bubble-me) 0%, #0056CC 100%);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
    color: white;
    border-bottom-right-radius: 0.375rem;
  }
  
  .bubble-them {
    background: linear-gradient(135deg, var(--bubble-them) 0%, #d1d5db 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    color: #000000;
    border-bottom-left-radius: 0.375rem;
  }
  
  .message-text {
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
    white-space: pre-line;
  }
  
  .message-text.mobile {
    font-size: 1rem;
    line-height: 1.4;
  }
  
  .reaction {
    position: absolute;
    bottom: -1rem;
    background: white;
    border-radius: 9999px;
    padding: 0.25rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 2px solid;
  }
  
  .reaction.mobile {
    bottom: -1.25rem;
    padding: 0.375rem;
  }
  
  .reaction-me {
    left: -1rem;
    border-color: #007AFF;
  }
  
  .reaction-them {
    right: -1rem;
    border-color: #E9E9EB;
  }
  
  .reaction-emoji {
    font-size: 0.875rem;
  }
  
  .reaction-emoji.mobile {
    font-size: 1rem;
  }
  
  .sender-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .sender-label.mobile {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
  
  .label-me {
    text-align: right;
  }
  
  .label-them {
    text-align: left;
  }
  
  .empty-messages {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  
  .empty-messages p {
    color: #6b7280;
    margin: 0;
  }
  
  .comments-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .comments-section.mobile {
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  .existing-comments {
    margin-bottom: 0.5rem;
  }
  
  .comments-list {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
    max-height: 10rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .comments-list.mobile {
    border-radius: 1rem;
    max-height: 8rem;
    padding: 0.75rem;
  }
  
  .comment {
    background: white;
    border-radius: 0.5rem;
    padding: 0.75rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .comment.mobile {
    border-radius: 0.75rem;
    padding: 1rem;
  }
  
  .comment-text {
    color: #4b4726;
    font-size: 0.875rem;
    margin: 0 0 0.25rem 0;
    white-space: pre-line;
  }
  
  .comment-time {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
  }
  
  .input-group {
    display: flex;
    gap: 0.5rem;
  }
  
  .input-group.mobile {
    gap: 0.75rem;
  }
  
  .comment-input {
    flex: 1;
    background: rgba(255, 255, 255, .9);
    backdrop-filter: blur(8px);
    border-color: var(--primary-blue);
    border: 2px solid rgba(229, 231, 235, 0.5);
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .comment-input.mobile {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border: 2px solid rgba(229, 231, 235, 0.5);
    border-radius: 1.5rem;
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
  }
  
  .comment-input:focus {
    background: rgba(255, 255, 255, 1);
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  }
  
  .add-btn {
    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-hover) 100%);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s;
    font-size: 1.125rem;
  }
  
  .add-btn.mobile {
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
    border-radius: 1.5rem;
    padding: 0.75rem 1rem;
    font-size: 1.25rem;
  }
  
  .add-btn:hover:not(:disabled) {
    background: #0056CC;
  }
  
  .add-btn:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 640px) {
    .message-wrapper {
      max-width: 90%;
    }
    
    .messages-container:not(.mobile) {
      height: 18.75rem;
    }
    
    .speech-bubble {
      font-size: 0.875rem;
    }
    
    .reaction {
      bottom: -0.875rem;
    }
  }
</style>