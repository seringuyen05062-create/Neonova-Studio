const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/globals.css',
  'app/api/chat/route.ts',
  'app/api/tts/route.ts',
  'components/Scene.tsx',
  'components/ChatInterface.tsx',
  'components/ControlPanel.tsx',
  'hooks/useVRM.ts',
  'hooks/useChat.ts',
  'hooks/useAnimation.ts',
  'lib/vrm-loader.ts',
  'lib/animation-controller.ts',
  'lib/lip-sync.ts',
  'lib/deepseek-client.ts',
  'lib/audio-analyzer.ts',
  'types/index.ts',
];

console.log('🔍 Checking required files...\n');

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allFilesExist = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('✅ All required files exist!');
  process.exit(0);
} else {
  console.log('❌ Some files are missing!');
  process.exit(1);
}
