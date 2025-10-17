// DEBUG: Test script để kiểm tra VRMA loading

// 1. VRMA_FILES mapping hiện tại
const VRMA_FILES_DEBUG = [
  { name: 'tetris', path: '/models/tetris.vrma' },
  { name: 'batlayemgiua_canhdongluamachnon', path: '/models/batlayemgiua canhdongluamachnon.vrma' },
];

// 2. Kiểm tra path có space
console.log('VRMA Files to check:');
VRMA_FILES_DEBUG.forEach(file => {
  console.log(`- Name: "${file.name}"  Path: "${file.path}"`);
  console.log(`  Has space: ${file.path.includes(' ')}`);
});

// 3. Test fetch files  
async function testVRMAFiles() {
  for (const file of VRMA_FILES_DEBUG) {
    try {
      const response = await fetch(file.path);
      console.log(`✅ ${file.name}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ ${file.name}: Error - ${error.message}`);
    }
  }
}

// Uncomment to test:
// testVRMAFiles();

export default {};