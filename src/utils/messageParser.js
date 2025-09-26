import fs from 'fs';
import path from 'path';

function parseMessagesFile(fileContent) {
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const messages = [];
  let currentMessage = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    // Check if line is a timestamp (starts with month abbreviation and contains time)
    const timestampMatch = line.match(/^([A-Za-z]{3}\s+\d{1,2},\s+\d{4})\s+(\d{1,2}:\d{2}:\d{2}\s+[AP]M)/);
    
    if (timestampMatch) {
      // Save previous message if it exists and contains "good morning"
      if (currentMessage && containsGoodMorning(currentMessage.content)) {
        messages.push(createMessageObject(currentMessage));
      }
      
      // Start new message
      const dateStr = timestampMatch[1];
      const timeStr = timestampMatch[2];
      const fullDateTimeStr = `${dateStr} ${timeStr}`;
      
      currentMessage = {
        timestamp: new Date(fullDateTimeStr).getTime(),
        content: '',
        sender: null,
        tapbacks: []
      };
      
      i++;
      continue;
    }
    
    // Check if line is a sender identifier
    if (line === 'Me' || line.match(/^\+\d+$/)) {
      if (currentMessage) {
        currentMessage.sender = line === 'Me' ? 'ry' : 'bb';
      }
      i++;
      continue;
    }
    
    // Check if line starts tapbacks section
    if (line === 'Tapbacks:') {
      i++;
      // Collect all tapback lines
      while (i < lines.length && !lines[i].match(/^([A-Za-z]{3}\s+\d{1,2},\s+\d{4})\s+(\d{1,2}:\d{2}:\d{2}\s+[AP]M)/) && lines[i] !== 'Me' && !lines[i].match(/^\+\d+$/)) {
        if (currentMessage && lines[i].trim().length > 0) {
          currentMessage.tapbacks.push(lines[i]);
        }
        i++;
      }
      continue;
    }
    
    // Regular message content line
    if (currentMessage && currentMessage.sender) {
      if (currentMessage.content.length > 0) {
        currentMessage.content += '\n';
      }
      currentMessage.content += line;
    }
    
    i++;
  }
  
  // Don't forget the last message
  if (currentMessage && containsGoodMorning(currentMessage.content)) {
    messages.push(createMessageObject(currentMessage));
  }
  
  return messages;
}

function convertTapbacksToEmojis(tapbacks) {
  const tapbackMap = {
    'loved': '❤️',
    'love': '❤️',
    'laughed': '😂',
    'laugh': '😂',
    'liked': '👍',
    'like': '👍',
    'disliked': '👎',
    'dislike': '👎',
    'emphasized': '‼️',
    'emphasize': '‼️',
    'questioned': '❓',
    'question': '❓'
  };
  
  return tapbacks.map(tapback => {
    // Extract the reaction type from strings like "Loved by Me" or "Laughed at by +18182820161"
    const reactionMatch = tapback.toLowerCase().match(/^(loved|love|laughed|laugh|liked|like|disliked|dislike|emphasized|emphasize|questioned|question)/);
    
    if (reactionMatch) {
      const reactionType = reactionMatch[1];
      return tapbackMap[reactionType] || tapback; // Return emoji or original if no match
    }
    
    return tapback; // Return original if no pattern match
  }).join(' '); // Join multiple reactions with spaces
}

function containsGoodMorning(content) {
  if (!content) return false;
  // filter out long messages
  if (content.length > 40) return false;
  const lowercaseContent = content.toLowerCase();
  
  // Check for various forms of "good morning"
  const goodMorningVariants = [
    'good morning',
    'goodmorning',
  ];
  
  return goodMorningVariants.some(variant => 
    lowercaseContent.includes(variant)
  );
}

function createMessageObject(messageData) {
  return {
    ts: messageData.timestamp,
    msg: messageData.content.replace(/\n/, ' '), // Replace first newline with spaces
    react: messageData.tapbacks.length > 0 ? convertTapbacksToEmojis(messageData.tapbacks) : null,
    sender: messageData.sender
  };
}

// Group messages by date for easier calendar integration
function groupMessagesByDate(messages) {
  const groupedMessages = {};
  
  messages.forEach(message => {
    const date = new Date(message.ts);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    
    groupedMessages[dateKey].push(message);
  });
  
  return groupedMessages;
}

// Node.js file processing function
async function processTextFile(inputFilePath, outputFilePath = null) {
  try {
    // Read the text file
    const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
    console.log(`Successfully read file: ${inputFilePath}`);
    
    // Parse messages and filter for "good morning"
    const parsedMessages = parseMessagesFile(fileContent);
    console.log(`Found ${parsedMessages.length} "good morning" messages`);
    
    // Group by date
    const groupedByDate = groupMessagesByDate(parsedMessages);
    console.log(`Messages grouped across ${Object.keys(groupedByDate).length} dates`);
    
    // Create output data structure optimized for website
    const websiteData = {
      messages: groupedByDate,
      dates: Object.keys(groupedByDate).sort(),
      totalMessages: parsedMessages.length,
      dateRange: {
        start: Object.keys(groupedByDate).sort()[0],
        end: Object.keys(groupedByDate).sort().slice(-1)[0]
      },
      metadata: {
        processedAt: new Date().toISOString(),
        sourceFile: path.basename(inputFilePath)
      }
    };
    
    // Determine output file path
    if (!outputFilePath) {
      const inputDir = path.dirname(inputFilePath);
      const inputName = path.basename(inputFilePath, path.extname(inputFilePath));
      outputFilePath = path.join(inputDir, `${inputName}_processed.json`);
    }
    
    // Write processed data to JSON file
    fs.writeFileSync(outputFilePath, JSON.stringify(websiteData, null, 2));
    console.log(`Processed data saved to: ${outputFilePath}`);
    
    // Print summary
    console.log('\n=== PROCESSING SUMMARY ===');
    console.log(`Source file: ${inputFilePath}`);
    console.log(`Output file: ${outputFilePath}`);
    console.log(`Total "good morning" messages: ${parsedMessages.length}`);
    console.log(`Date range: ${websiteData.dateRange.start} to ${websiteData.dateRange.end}`);
    console.log(`Dates with messages: ${websiteData.dates.length}`);
    
    return websiteData;
    
  } catch (error) {
    console.error('Error processing file:', error.message);
    throw error;
  }
}

// Browser/client-side function for processing uploaded files
async function processUploadedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const fileContent = e.target.result;
        const parsedMessages = parseMessagesFile(fileContent);
        const groupedByDate = groupMessagesByDate(parsedMessages);
        
        const websiteData = {
          messages: groupedByDate,
          dates: Object.keys(groupedByDate).sort(),
          totalMessages: parsedMessages.length,
          dateRange: {
            start: Object.keys(groupedByDate).sort()[0],
            end: Object.keys(groupedByDate).sort().slice(-1)[0]
          },
          metadata: {
            processedAt: new Date().toISOString(),
            sourceFile: file.name
          }
        };
        
        resolve(websiteData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = function(error) {
      reject(error);
    };
    
    reader.readAsText(file);
  });
}

// Command line usage example:
/*
// Save this file as messageParser.js and run:
// node messageParser.js path/to/your/messages.txt

*/

if (process.argv.length >= 3) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] || null;
  
  processTextFile(inputFile, outputFile)
    .then(() => {
      console.log('File processing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('File processing failed:', error);
      process.exit(1);
    });
}

export { parseMessagesFile, groupMessagesByDate, processTextFile, processUploadedFile };