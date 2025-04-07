const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Default configuration
const config = {
  sourceDir: './src',
  outputFile: './concatenated_source.txt',
};

// Process command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--sourceDir=')) {
    config.sourceDir = arg.split('=')[1];
  } else if (arg.startsWith('--outputFile=')) {
    config.outputFile = arg.split('=')[1];
  }
});

// Main function
async function concatenateFiles() {
  try {
    // Check if source directory exists
    try {
      const srcStats = await stat(config.sourceDir);
      if (!srcStats.isDirectory()) {
        throw new Error(`Source path ${config.sourceDir} is not a directory`);
      }
    } catch (err) {
      throw new Error(`Source directory ${config.sourceDir} does not exist`);
    }

    // Get all files recursively
    const files = await getAllFiles(config.sourceDir);
    
    console.log(`Found ${files.length} files to process.`);
    
    // Initialize output content
    let outputContent = '';
    
    // Process each file
    let processedCount = 0;
    for (const file of files) {
      try {
        // Get the relative path from the source directory
        const relativePath = path.relative(config.sourceDir, file);
        
        // Read file content
        const content = await readFile(file, 'utf8');
        
        // Add file path and content to output
        outputContent += `Path: ${relativePath}\n`;
        outputContent += '```\n';
        outputContent += content;
        outputContent += '\n```\n\n---\n\n';
        
        processedCount++;
        console.log(`Processed (${processedCount}/${files.length}): ${relativePath}`);
      } catch (err) {
        console.warn(`Error processing file ${file}:`, err.message);
      }
    }
    
    // Write output to file
    await writeFile(config.outputFile, outputContent);
    
    console.log('\nConcatenation complete.');
    console.log(`Output file: ${path.resolve(config.outputFile)}`);
    console.log(`Total files processed: ${processedCount}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Function to recursively get all files from a directory
async function getAllFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subDirFiles = await getAllFiles(fullPath);
      files.push(...subDirFiles);
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Run the main function
concatenateFiles();