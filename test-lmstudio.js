// Test script for LM Studio connection
import { LMStudioClient } from "@lmstudio/sdk";

// Try different possible configurations
const configs = [
  { baseUrl: "ws://192.168.2.154:1234", name: "WebSocket on custom IP" },
  { baseUrl: "ws://localhost:1234", name: "WebSocket on localhost" },
  { baseUrl: "ws://127.0.0.1:1234", name: "WebSocket on 127.0.0.1" },
  // LM Studio typically defaults to localhost without custom IP
];

async function testConnection() {
  for (const config of configs) {
    try {
      console.log(`\nTesting ${config.name}: ${config.baseUrl}...`);
      
      const client = new LMStudioClient(config);
      
      // Add timeout to prevent hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      const modelPromise = client.llm.model("minicpm-o-2_6");
      const model = await Promise.race([modelPromise, timeout]);
      
      console.log("✅ Successfully connected to LM Studio!");
      console.log("✅ MiniCPM-o-2_6 model found and accessible!");
      
      // Test a simple text completion with timeout
      console.log("\nTesting text completion...");
      const responsePromise = model.respond("Hello! Can you see this message?");
      const result = await Promise.race([responsePromise, timeout]);
      console.log("✅ Model response:", result.content);
      
      console.log(`\n🎉 LM Studio is ready! Use baseUrl: ${config.baseUrl}`);
      return config.baseUrl;
      
    } catch (error) {
      console.error(`❌ ${config.name} failed:`, error.message);
      
      if (error.message.includes('timeout')) {
        console.log("   Connection timed out - server might not be running");
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log("   Connection refused - check if LM Studio server is started");
      } else if (error.message.includes('model not found')) {
        console.log("   Model not found - but connection works! Check model name");
      }
    }
  }
  
  console.log("\n❌ All connection attempts failed!");
  console.log("\n💡 Troubleshooting tips:");
  console.log("1. Make sure LM Studio is running");
  console.log("2. In LM Studio, go to the 'Local Server' tab and start the server");
  console.log("3. Check that the MiniCPM-o-2_6 model is loaded");
  console.log("4. Verify the server URL in LM Studio settings");
  
  return null;
}

// Run the test
testConnection().then(baseUrl => {
  if (baseUrl) {
    console.log(`\n🎉 Success! Update your imageAnalysis.ts to use: ${baseUrl}`);
  } else {
    console.log("\n❌ Please fix the issues above and try again.");
  }
  process.exit(baseUrl ? 0 : 1);
});
