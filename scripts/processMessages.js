import fs from 'fs';
import path from 'path';
import { processTextFile } from '../src/utils/messageParser.js';

async function buildMessages() {
  try {
    console.log('Processing messages for build...');
    
    // Process the raw text file
    const inputFile = './src/data/raw-messages.txt'; // Place your txt file here
    const outputFile = './src/data/processed-messages.json';
    
    if (!fs.existsSync(inputFile)) {
      console.error(`Input file not found: ${inputFile}`);
      console.log('Please place your raw messages.txt file in src/data/raw-messages.txt');
      process.exit(1);
    }
    
    const websiteData = await processTextFile(inputFile, outputFile);
    
    // Generate message numbers for each date
    let messageNumber = 1;
    const messagesWithNumbers = {};
    
    websiteData.dates.forEach(date => {
      messagesWithNumbers[date] = {
        messageNumber: messageNumber++,
        messages: websiteData.messages[date]
      };
    });
    
    // Save enhanced data
    const enhancedData = {
      ...websiteData,
      messagesWithNumbers
    };

    fs.writeFileSync(outputFile, JSON.stringify(enhancedData, null, 2));
    console.log('Build-time message processing completed!');
    
  } catch (error) {
    console.error('Error processing messages:', error);
    process.exit(1);
  }
}

buildMessages();